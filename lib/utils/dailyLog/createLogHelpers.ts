import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import { UploadedFile } from "@/app/types/DailyLog";
import { WorkTimeOverride } from "@/components/workTime/WorkTimeForm";
import type { CreatedLogInfo } from "./types";

export interface LogCreationRequest {
  promise: Promise<Response>;
  isMainLog: boolean;
  itemType: string;
  appliedTo: string[];
}

export interface FormDefinition {
  type: "worktime" | "accommodation" | "additional";
  data: WorkTimeFormState | AccommodationFormState | AdditionalFormState;
  isFilled: boolean;
}

/**
 * Creates a log creation request for the owner's log
 */
export function createOwnerLogRequest(
  itemType: string,
  data: WorkTimeFormState | AccommodationFormState | AdditionalFormState,
  isoDate: string,
  tripId: string,
  userId: string,
  appliedTo: string[],
  files: UploadedFile[] = [],
): LogCreationRequest {
  const body = {
    itemType,
    tripId,
    userId,
    dateTime: isoDate,
    appliedTo,
    isGroupSource: appliedTo.length > 0,
    data,
    files,
  };

  return {
    promise: fetch("/api/daily-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    isMainLog: appliedTo.length > 0,
    itemType,
    appliedTo,
  };
}

/**
 * Creates log creation requests for colleague logs
 */
export function createColleagueLogRequests(
  itemType: string,
  formData: WorkTimeFormState | AccommodationFormState | AdditionalFormState,
  isoDate: string,
  tripId: string,
  appliedTo: string[],
  workTimeOverrides: Record<string, WorkTimeOverride>,
  workTime: WorkTimeFormState,
): LogCreationRequest[] {
  const requests: LogCreationRequest[] = [];

  appliedTo.forEach((colleagueId) => {
    // For worktime, use override if available, otherwise use base data
    let colleagueData = formData;
    if (itemType === "worktime") {
      const override = workTimeOverrides[colleagueId];
      colleagueData = {
        startTime: override?.startTime || workTime.startTime,
        endTime: override?.endTime || workTime.endTime,
        description: override?.description || workTime.description,
      } as WorkTimeFormState;
    }

    const colleagueBody = {
      itemType,
      tripId,
      userId: colleagueId,
      dateTime: isoDate,
      appliedTo: [],
      isGroupSource: false,
      data: colleagueData,
      files: [],
    };

    requests.push({
      promise: fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colleagueBody),
      }),
      isMainLog: false,
      itemType,
      appliedTo: [],
    });
  });

  return requests;
}

/**
 * Builds all log creation requests for the given forms
 */
export function buildLogCreationRequests(
  forms: FormDefinition[],
  isoDateString: string,
  tripId: string,
  userId: string,
  appliedTo: string[],
  sharedFields: Set<string>,
  workTimeOverrides: Record<string, WorkTimeOverride>,
  workTime: WorkTimeFormState,
): LogCreationRequest[] {
  const requests: LogCreationRequest[] = [];

  forms.forEach((form) => {
    if (!form.isFilled) return;

    // Create owner's log
    const isMainLog = appliedTo.length > 0 && sharedFields.has(form.type);
    requests.push(
      createOwnerLogRequest(
        form.type,
        form.data,
        isoDateString,
        tripId,
        userId,
        appliedTo,
        [],
      ),
    );

    // Create real logs for each colleague in appliedTo only if this field is shared
    if (appliedTo.length > 0 && sharedFields.has(form.type)) {
      requests.push(
        ...createColleagueLogRequests(
          form.type,
          form.data,
          isoDateString,
          tripId,
          appliedTo,
          workTimeOverrides,
          workTime,
        ),
      );
    }
  });

  return requests;
}

/**
 * Extracts created log information from API responses
 */
export async function extractCreatedLogs(
  responses: Response[],
): Promise<CreatedLogInfo[]> {
  const createdLogs: CreatedLogInfo[] = [];

  for (const response of responses) {
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data?.log) {
        const log = result.data.log;
        const logInfo = {
          id: log.id,
          _id: log._id?.toString() || "",
          userId: log.userId,
          itemType: log.itemType,
          tripId: log.tripId,
          dateTime: log.dateTime,
          isGroupSource: log.isGroupSource,
          appliedTo: log.appliedTo || [],
        };

        console.log("Extracted log:", {
          hasId: !!logInfo.id,
          id: logInfo.id,
          userId: logInfo.userId,
          isGroupSource: logInfo.isGroupSource,
          appliedTo: logInfo.appliedTo,
          rawLog: log,
        });

        createdLogs.push(logInfo);
      } else {
        console.warn("Response not successful or missing log data:", result);
      }
    } else {
      console.warn("Response not OK:", response.status, response.statusText);
    }
  }

  console.log("Total extracted logs:", createdLogs.length);
  return createdLogs;
}

/**
 * Links related logs to main logs
 */
export async function linkRelatedLogs(
  createdLogs: CreatedLogInfo[],
): Promise<void> {
  console.log("linkRelatedLogs called with:", {
    totalLogs: createdLogs.length,
    logs: createdLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      itemType: log.itemType,
      isGroupSource: log.isGroupSource,
      appliedTo: log.appliedTo,
    })),
  });

  const mainLogs = createdLogs.filter((log) => log.isGroupSource);
  console.log("Main logs found:", mainLogs.length);

  for (const mainLog of mainLogs) {
    // Find related logs: same tripId, same dateTime, same itemType, userId in appliedTo
    const relatedLogs = createdLogs.filter(
      (log) =>
        log.tripId === mainLog.tripId &&
        log.dateTime === mainLog.dateTime &&
        log.itemType === mainLog.itemType &&
        mainLog.appliedTo.includes(log.userId) &&
        !log.isGroupSource,
    );

    console.log(`Finding related logs for main log ${mainLog.id}:`, {
      mainLogId: mainLog.id,
      mainLogAppliedTo: mainLog.appliedTo,
      relatedLogsFound: relatedLogs.length,
      relatedLogs: relatedLogs.map((log) => ({
        id: log.id,
        userId: log.userId,
        hasId: !!log.id,
      })),
    });

    const relatedLogIds = relatedLogs.map((log) => log.id).filter((id) => id); // Filter out undefined/null IDs

    console.log(
      `Updating main log ${mainLog._id} with relatedLogs:`,
      relatedLogIds,
    );

    // Update the main log with relatedLogs (even if empty array)
    const updateResponse = await fetch(`/api/daily-logs/${mainLog._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        relatedLogs: relatedLogIds,
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.error(
        `Failed to update relatedLogs for ${mainLog._id}:`,
        errorData,
      );
    } else {
      console.log(`Successfully updated relatedLogs for ${mainLog._id}`);
    }
  }
}
