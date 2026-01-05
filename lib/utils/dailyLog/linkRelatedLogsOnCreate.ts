import { DailyLog } from "@/app/models/DailyLog";

/**
 * Links related logs after a log is created
 * - If main log (isGroupSource === true): finds all attendant logs and updates relatedLogs
 * - If attendant log (isGroupSource === false): finds the main log and adds this log's id to its relatedLogs
 */
export async function linkRelatedLogsOnCreate(
  createdLogId: string,
  tripId: string,
  dateTime: string,
  itemType: string,
  userId: string,
  isGroupSource: boolean,
  appliedTo: string[],
): Promise<void> {
  // Extract date from dateTime for querying
  const date = dateTime.split("T")[0];

  if (isGroupSource) {
    // This is a main log - find all attendant logs that match the criteria
    const allLogs = await DailyLog.find({
      tripId,
      dateTime: { $regex: new RegExp(`^${date}`) },
      itemType,
    }).lean();

    // Find attendant logs: same tripId, same dateTime, same itemType, userId in appliedTo, isGroupSource === false
    const relatedLogIds = allLogs
      .filter(
        (log) =>
          log.id && // Must have UUID
          log.tripId === tripId &&
          log.dateTime === dateTime &&
          log.itemType === itemType &&
          appliedTo.includes(log.userId) &&
          !log.isGroupSource,
      )
      .map((log) => log.id)
      .filter((id) => id) as string[]; // Filter out undefined/null IDs

    // Update the main log with relatedLogs
    await DailyLog.findByIdAndUpdate(createdLogId, {
      $set: { relatedLogs: relatedLogIds },
    });
  } else {
    // This is an attendant log - find the main log that should reference it
    const allLogs = await DailyLog.find({
      tripId,
      dateTime: { $regex: new RegExp(`^${date}`) },
      itemType,
      isGroupSource: true,
    }).lean();

    // Find the main log where this userId is in appliedTo
    const mainLog = allLogs.find(
      (log) =>
        log.tripId === tripId &&
        log.dateTime === dateTime &&
        log.itemType === itemType &&
        Array.isArray(log.appliedTo) &&
        log.appliedTo.includes(userId),
    );

    if (mainLog && mainLog._id) {
      // Get the created log's id
      const createdLog = await DailyLog.findById(createdLogId).lean();
      if (createdLog && createdLog.id) {
        // Get current relatedLogs from main log
        const currentRelatedLogs = (mainLog.relatedLogs || []) as string[];

        // Add this attendant log's id if not already present
        if (!currentRelatedLogs.includes(createdLog.id)) {
          const updatedRelatedLogs = [...currentRelatedLogs, createdLog.id];

          // Update the main log with the new relatedLogs
          await DailyLog.findByIdAndUpdate(mainLog._id, {
            $set: { relatedLogs: updatedRelatedLogs },
          });
        }
      }
    }
  }
}
