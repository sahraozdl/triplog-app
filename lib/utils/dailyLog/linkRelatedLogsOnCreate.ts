import { DailyLog } from "@/app/models/DailyLog";

export async function linkRelatedLogsOnCreate(
  createdLogId: string,
  tripId: string,
  dateTime: string,
  itemType: string,
  userId: string,
  isGroupSource: boolean,
  appliedTo: string[],
): Promise<void> {
  if (!tripId || !dateTime || !itemType || !userId) {
    console.warn("linkRelatedLogsOnCreate: Missing required parameters", {
      tripId,
      dateTime,
      itemType,
      userId,
    });
    return;
  }

  const date = dateTime.split("T")[0];

  if (isGroupSource) {
    if (!appliedTo || appliedTo.length === 0) {
      return;
    }

    const allLogs = await DailyLog.find({
      tripId,
      dateTime: { $regex: new RegExp(`^${date}`) },
      itemType,
    }).lean();

    const relatedLogIds = allLogs
      .filter(
        (log) =>
          log.id &&
          log.tripId === tripId &&
          log.dateTime === dateTime &&
          log.itemType === itemType &&
          Array.isArray(appliedTo) &&
          appliedTo.includes(log.userId) &&
          !log.isGroupSource,
      )
      .map((log) => log.id)
      .filter((id) => id) as string[];

    await DailyLog.findByIdAndUpdate(createdLogId, {
      $set: { relatedLogs: relatedLogIds },
    });
  } else {
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
      const createdLog = await DailyLog.findById(createdLogId).lean();
      if (createdLog && !Array.isArray(createdLog) && (createdLog as any).id) {
        const createdLogIdValue = (createdLog as any).id as string;
        const currentRelatedLogs = (mainLog.relatedLogs || []) as string[];

        if (!currentRelatedLogs.includes(createdLogIdValue)) {
          const updatedRelatedLogs = [...currentRelatedLogs, createdLogIdValue];

          await DailyLog.findByIdAndUpdate(mainLog._id, {
            $set: { relatedLogs: updatedRelatedLogs },
          });
        }
      }
    }
  }
}
