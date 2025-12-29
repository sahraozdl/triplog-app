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
import { dateStringToISO } from "./dateConversion";
import {
  transformLogToFormState,
  extractWorkTimeOverride,
} from "./logDataTransformers";
import { fetchUsersData } from "./fetchers";

export interface LogEditData {
  logIds: {
    worktime?: string;
    accommodation?: string;
    additional?: string;
  };
  workTime: WorkTimeFormState;
  accommodationMeals: AccommodationFormState;
  additional: AdditionalFormState;
  workTimeOverrides: Record<string, WorkTimeOverride>;
  selectedDate: string;
  appliedTo: string[];
  ownerUserId: string;
  tripId: string;
  originalLogs: DailyLogFormState[];
  usersWithExistingLogs: Set<string>;
}

export interface LoadLogsResult {
  success: boolean;
  data?: LogEditData;
  error?: string;
}

/**
 * Loads and initializes log data for editing
 */
export async function loadLogsForEditing(
  logId: string,
): Promise<LoadLogsResult> {
  try {
    const initialLogRes = await fetch(`/api/daily-logs/${logId}`);
    if (!initialLogRes.ok) {
      throw new Error("Could not find initial log.");
    }
    const initialLog = (await initialLogRes.json()) as DailyLogFormState;

    const tripIdToFetch = initialLog.tripId;
    const logUserId = initialLog.userId;

    const logDate = initialLog.dateTime
      ? initialLog.dateTime.split("T")[0]
      : "";

    const groupRes = await fetch(
      `/api/daily-logs?tripId=${tripIdToFetch}&date=${logDate}`,
    );
    const data = await groupRes.json();
    const logs: DailyLogFormState[] = data.logs || [];

    // Track users who already have logs for this date (excluding the owner)
    const existingLogUsers = new Set<string>();
    logs.forEach((log) => {
      if (log.userId !== logUserId) {
        const logDateStr = log.dateTime ? log.dateTime.split("T")[0] : "";
        if (logDateStr === logDate) {
          existingLogUsers.add(log.userId);
        }
      }
    });

    const newLogIds: LogEditData["logIds"] = {};
    const foundOverrides: Record<string, WorkTimeOverride> = {};

    // Initialize form states
    const workTime: WorkTimeFormState = {
      startTime: "",
      endTime: "",
      description: "",
    };
    const accommodationMeals: AccommodationFormState = {
      accommodationType: "",
      accommodationCoveredBy: "",
      overnightStay: "",
      meals: {
        breakfast: { eaten: false, coveredBy: "" },
        lunch: { eaten: false, coveredBy: "" },
        dinner: { eaten: false, coveredBy: "" },
      },
    };
    const additional: AdditionalFormState = {
      notes: "",
      uploadedFiles: [],
    };

    logs.forEach((log) => {
      const type = log.itemType;
      const ownerId = logUserId;

      if (type === "worktime") {
        const workTimeLog = log as DailyLogFormState & {
          itemType: "worktime";
        };
        if (log.userId === ownerId) {
          newLogIds.worktime = log._id.toString();
          workTime.startTime = workTimeLog.startTime || "";
          workTime.endTime = workTimeLog.endTime || "";
          workTime.description = workTimeLog.description || "";
        } else {
          // Track existing colleague worktime logs for overrides
          foundOverrides[log.userId] = extractWorkTimeOverride(
            log as DailyLogFormState & { itemType: "worktime" },
          );
        }
        return;
      }

      if (log.userId === ownerId) {
        newLogIds[type as keyof typeof newLogIds] = log._id.toString();
        const formPayload = transformLogToFormState(log);

        if (type === "accommodation") {
          Object.assign(accommodationMeals, formPayload);
        } else if (type === "additional") {
          Object.assign(additional, formPayload);
        }
      }
    });

    return {
      success: true,
      data: {
        logIds: newLogIds,
        workTime,
        accommodationMeals,
        additional,
        workTimeOverrides: foundOverrides,
        selectedDate: logDate,
        appliedTo: initialLog.appliedTo || [],
        ownerUserId: logUserId,
        tripId: tripIdToFetch,
        originalLogs: logs,
        usersWithExistingLogs: existingLogUsers,
      },
    };
  } catch (error) {
    console.error("Failed to load logs for editing:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validates if any selected colleagues already have logs for the date
 */
export async function validateNoConflictingUsers(
  appliedTo: string[],
  usersWithExistingLogs: Set<string>,
): Promise<{ isValid: boolean; error?: string }> {
  const conflictingUsers: string[] = [];
  appliedTo.forEach((colleagueId) => {
    if (usersWithExistingLogs.has(colleagueId)) {
      conflictingUsers.push(colleagueId);
    }
  });

  if (conflictingUsers.length === 0) {
    return { isValid: true };
  }

  const result = await fetchUsersData(conflictingUsers, false);
  const userNames = result.success && result.users ? result.users : {};
  const names = conflictingUsers
    .map((id) => userNames[id] || id.slice(0, 8))
    .join(", ");

  return {
    isValid: false,
    error: `Cannot share with ${names}. They already have logs for this date.`,
  };
}

/**
 * Refreshes the list of users with existing logs for a given date
 */
export async function refreshUsersWithExistingLogs(
  tripId: string,
  date: string,
  excludeUserId: string,
): Promise<Set<string>> {
  try {
    const res = await fetch(`/api/daily-logs?tripId=${tripId}&date=${date}`);
    const data = await res.json();
    const logs: DailyLogFormState[] = data.logs || [];
    const existingLogUsers = new Set<string>();

    logs.forEach((log) => {
      if (log.userId !== excludeUserId) {
        const logDateStr = log.dateTime ? log.dateTime.split("T")[0] : "";
        if (logDateStr === date) {
          existingLogUsers.add(log.userId);
        }
      }
    });

    return existingLogUsers;
  } catch (error) {
    console.error("Failed to refresh excluded users", error);
    return new Set<string>();
  }
}

interface FormData {
  type: "worktime" | "accommodation" | "additional";
  data: WorkTimeFormState | AccommodationFormState | AdditionalFormState;
  id?: string;
}

interface LogUpdatePlan {
  logsToUpdate: DailyLogFormState[];
  logsToCreate: LogCreationPayload[];
  logsToDelete: string[];
}

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

  // Track existing colleague logs for all field types
  const existingColleagueLogs = new Map<
    string,
    Map<string, DailyLogFormState>
  >(); // Map<itemType, Map<colleagueId, log>>

  originalLogs.forEach((log) => {
    if (log.userId === effectiveUserId) return;
    if (log.tripId !== tripId) return;

    const logDate = log.dateTime ? log.dateTime.split("T")[0] : "";
    if (logDate !== selectedDate) return;

    const type = log.itemType;
    if (!existingColleagueLogs.has(type)) {
      existingColleagueLogs.set(type, new Map());
    }
    existingColleagueLogs.get(type)!.set(log.userId, log);
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
      const updatedLog: DailyLogFormState = {
        _id: form.id,
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
          // Update existing log - preserve metadata
          const baseLogFields = {
            _id: existing._id,
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

/**
 * Executes the planned log updates (delete, update, create)
 */
export async function executeLogUpdates(
  plan: LogUpdatePlan,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete logs
    if (plan.logsToDelete.length > 0) {
      for (const logId of plan.logsToDelete) {
        const res = await fetch(`/api/daily-logs/${logId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error(`Failed to delete log ${logId}`);
        }
      }
    }

    // Update logs
    if (plan.logsToUpdate.length > 0) {
      for (const log of plan.logsToUpdate) {
        const logId = log._id.toString();
        const res = await fetch(`/api/daily-logs/${logId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(log),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            `Update error for log ${logId}: ${errorData.error || "Unknown Error"}`,
          );
        }
      }
    }

    // Create logs
    if (plan.logsToCreate.length > 0) {
      for (const newLog of plan.logsToCreate) {
        const res = await fetch("/api/daily-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType: newLog.itemType,
            tripId: newLog.tripId,
            userId: newLog.userId,
            dateTime: newLog.dateTime,
            appliedTo: newLog.appliedTo,
            isGroupSource: newLog.isGroupSource,
            data: newLog.data,
            files: [],
          }),
        });
        if (!res.ok) {
          throw new Error(`Failed to create log for ${newLog.itemType}`);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Update failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}
