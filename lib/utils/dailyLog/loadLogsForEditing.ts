import { DailyLogFormState } from "@/app/types/DailyLog";
import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import {
  transformLogToFormState,
  extractWorkTimeOverride,
} from "../logDataTransformers";
import type { LogEditData, LoadLogsResult } from "./types";
import type { WorkTimeOverride } from "@/components/workTime/WorkTimeForm";

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
