import {
  DailyLogFormState,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
} from "@/app/types/DailyLog";
import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import { LogCreationPayload } from "@/app/types/LogCreation";
import { WorkTimeOverride } from "@/components/workTime/WorkTimeForm";
import type { FormData, LogUpdatePlan } from "./types";

/**
 * Plans the updates needed for logs based on form data and sharing settings
 */
export function planLogUpdates(
  forms: FormData[],
  appliedTo: string[],
  sharedFields: Set<string>,
  workTimeOverrides: Record<string, WorkTimeOverride>,
  workTime: WorkTimeFormState,
  originalLogs: DailyLogFormState[],
  tripId: string,
  effectiveUserId: string,
  selectedDate: string,
): LogUpdatePlan {
  const [year, month, day] = selectedDate.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const isoDateString = utcDate.toISOString();

  const logsToUpdate: DailyLogFormState[] = [];
  const logsToCreate: LogCreationPayload[] = [];
  const logsToDelete: string[] = [];

  // Track existing owner logs by itemType
  const existingOwnerLogs = new Map<string, DailyLogFormState>();

  // Track existing colleague logs for all field types
  const existingColleagueLogs = new Map<
    string,
    Map<string, DailyLogFormState>
  >(); // Map<itemType, Map<colleagueId, log>>

  originalLogs.forEach((log) => {
    if (log.tripId !== tripId) return;

    const logDate = log.dateTime ? log.dateTime.split("T")[0] : "";
    if (logDate !== selectedDate) return;

    if (log.userId === effectiveUserId) {
      // Track owner's logs
      existingOwnerLogs.set(log.itemType, log);
    } else {
      // Track colleague logs
      const type = log.itemType;
      if (!existingColleagueLogs.has(type)) {
        existingColleagueLogs.set(type, new Map());
      }
      existingColleagueLogs.get(type)!.set(log.userId, log);
    }
  });

  const currentColleagueIds = new Set(appliedTo);

  forms.forEach((form) => {
    const hasData = Object.values(form.data).some(
      (val) => val && val !== "" && val !== 0 && val !== false,
    );

    const appliedToForThis = appliedTo;
    const isGroupSourceForThis = appliedToForThis.length > 0;

    // Update owner's log (never create new in edit mode)
    if (form.id) {
      const existingOwnerLog = existingOwnerLogs.get(form.type);
      const updatedLog: DailyLogFormState = {
        _id: form.id,
        id: existingOwnerLog?.id, // Preserve the UUID from the existing log
        userId: effectiveUserId,
        tripId,
        dateTime: isoDateString,
        appliedTo: appliedToForThis,
        isGroupSource: isGroupSourceForThis,
        itemType: form.type,
        ...form.data,
      } as DailyLogFormState;

      logsToUpdate.push(updatedLog);
    } else if (hasData) {
      // In edit mode, we should never create new logs - only update existing ones
      // If form.id is missing, it means the log was deleted or doesn't exist
      // This is an error condition in edit mode
      console.warn(
        `Attempted to create new ${form.type} log in edit mode. This should not happen.`,
      );
      // Still allow it for now, but log the warning
      const newLog: LogCreationPayload = {
        itemType: form.type,
        tripId,
        userId: effectiveUserId,
        dateTime: isoDateString,
        appliedTo: appliedToForThis,
        isGroupSource: isGroupSourceForThis,
        data: form.data,
        files: [],
      };

      logsToCreate.push(newLog);
    }

    // Update or create real logs for each colleague in appliedTo
    // Only if this field is shared
    if (hasData && appliedToForThis.length > 0 && sharedFields.has(form.type)) {
      const colleagueLogsMap =
        existingColleagueLogs.get(form.type) || new Map();

      for (const colleagueId of appliedToForThis) {
        const existing = colleagueLogsMap.get(colleagueId);

        // For worktime, use override if available, otherwise use base data
        let colleagueData:
          | WorkTimeFormState
          | AccommodationFormState
          | AdditionalFormState = form.data;
        if (form.type === "worktime") {
          const override = workTimeOverrides[colleagueId];
          colleagueData = {
            startTime: override?.startTime || workTime.startTime,
            endTime: override?.endTime || workTime.endTime,
            description: override?.description || workTime.description,
          };
        }

        if (existing) {
          // Update existing log - preserve metadata including the UUID 'id' field
          const baseLogFields = {
            _id: existing._id,
            id: existing.id, // Preserve the UUID - this is critical for relatedLogs to work
            userId: colleagueId,
            tripId,
            dateTime: isoDateString,
            appliedTo: [],
            isGroupSource: false,
            files: existing.files,
            sealed: existing.sealed,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
          };

          let updatedColleagueLog: DailyLogFormState;
          if (form.type === "worktime") {
            updatedColleagueLog = {
              ...baseLogFields,
              itemType: "worktime",
              ...(colleagueData as WorkTimeFormState),
            } as WorkTimeLog;
          } else if (form.type === "accommodation") {
            updatedColleagueLog = {
              ...baseLogFields,
              itemType: "accommodation",
              ...(colleagueData as AccommodationFormState),
            } as AccommodationLog;
          } else {
            // form.type === "additional"
            updatedColleagueLog = {
              ...baseLogFields,
              itemType: "additional",
              ...(colleagueData as AdditionalFormState),
            } as AdditionalLog;
          }

          logsToUpdate.push(updatedColleagueLog);
        } else {
          // Create new log for colleague who doesn't have one yet
          const newColleagueLog: LogCreationPayload = {
            itemType: form.type,
            tripId,
            userId: colleagueId,
            dateTime: isoDateString,
            appliedTo: [],
            isGroupSource: false,
            data: colleagueData,
            files: [],
          };

          logsToCreate.push(newColleagueLog);
        }
      }

      // Delete colleague logs that are no longer in appliedTo or if field is no longer shared
      colleagueLogsMap.forEach((log, colleagueId) => {
        if (
          !currentColleagueIds.has(colleagueId) ||
          !sharedFields.has(form.type)
        ) {
          logsToDelete.push(log._id.toString());
        }
      });
    } else if (hasData && !sharedFields.has(form.type)) {
      // If field is no longer shared, delete all existing colleague logs for this type
      const colleagueLogsMap = existingColleagueLogs.get(form.type);
      if (colleagueLogsMap) {
        colleagueLogsMap.forEach((log) => {
          logsToDelete.push(log._id.toString());
        });
      }
    }
  });

  return { logsToUpdate, logsToCreate, logsToDelete };
}
