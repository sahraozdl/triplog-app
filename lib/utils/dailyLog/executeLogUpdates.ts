import { DailyLogFormState } from "@/app/types/DailyLog";
import type { LogUpdatePlan, CreatedLogInfo } from "./types";
import {
  fetchRelatedLogs,
  updateMainLogsWithRelatedLogs,
  createTripDateMap,
} from "./relatedLogsLinking";

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

    // Create logs and track created logs for relatedLogs linking
    const createdLogs: CreatedLogInfo[] = [];

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

        // Extract created log data
        const result = await res.json();
        if (result.success && result.data?.log) {
          const log = result.data.log;
          createdLogs.push({
            id: log.id,
            _id: log._id?.toString() || "",
            userId: log.userId,
            itemType: log.itemType,
            tripId: log.tripId,
            dateTime: log.dateTime,
            isGroupSource: log.isGroupSource,
            appliedTo: log.appliedTo || [],
          });
        }
      }
    }

    // Update main logs with relatedLogs after all logs are created
    // Also check updated logs that might need relatedLogs updates
    const allLogsToCheck: CreatedLogInfo[] = [
      ...createdLogs,
      ...plan.logsToUpdate.map((log) => ({
        id: (log as any).id || "",
        _id: log._id.toString(),
        userId: log.userId,
        itemType: log.itemType,
        tripId: log.tripId,
        dateTime: log.dateTime,
        isGroupSource: log.isGroupSource,
        appliedTo: log.appliedTo || [],
      })),
    ];

    // Fetch all logs for the affected trips/dates to find related logs
    const tripDateMap = createTripDateMap(allLogsToCheck);

    // Fetch all related logs from database
    const allRelatedLogs = await fetchRelatedLogs(tripDateMap);

    // Update main logs with relatedLogs
    const mainLogs = allLogsToCheck.filter((log) => log.isGroupSource);
    await updateMainLogsWithRelatedLogs(mainLogs, allRelatedLogs);

    return { success: true };
  } catch (error) {
    console.error("Update failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}
