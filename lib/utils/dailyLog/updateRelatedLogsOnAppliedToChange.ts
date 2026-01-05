import { DailyLog } from "@/app/models/DailyLog";

/**
 * Updates relatedLogs for a main log when appliedTo changes
 * This function finds all logs that match the criteria and updates the main log's relatedLogs
 */
export async function updateRelatedLogsOnAppliedToChange(
  logId: string,
  tripId: string,
  dateTime: string,
  itemType: string,
  newAppliedTo: string[],
): Promise<void> {
  // Only update if this is a main log (isGroupSource === true)
  const log = await DailyLog.findById(logId).lean();
  if (!log || Array.isArray(log) || !(log as any).isGroupSource) {
    return; // Not a main log, no need to update
  }

  // Extract date from dateTime
  const date = dateTime.split("T")[0];

  // Fetch all logs for this trip and date
  const allLogs = await DailyLog.find({
    tripId,
    dateTime: { $regex: new RegExp(`^${date}`) },
    itemType,
  }).lean();

  // Find related logs: same tripId, same dateTime, same itemType, userId in newAppliedTo, and isGroupSource === false
  const relatedLogIds = allLogs
    .filter(
      (log) =>
        log.id && // Must have UUID
        log.tripId === tripId &&
        log.dateTime === dateTime &&
        log.itemType === itemType &&
        newAppliedTo.includes(log.userId) &&
        !log.isGroupSource,
    )
    .map((log) => log.id)
    .filter((id) => id) as string[]; // Filter out undefined/null IDs

  // Update the main log with relatedLogs (even if empty array)
  await DailyLog.findByIdAndUpdate(logId, {
    $set: { relatedLogs: relatedLogIds },
  });
}
