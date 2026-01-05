import type { CreatedLogInfo } from "./types";

/**
 * Fetches all related logs from the database for given trip/date combinations
 */
export async function fetchRelatedLogs(
  tripDateMap: Map<string, Set<string>>,
): Promise<CreatedLogInfo[]> {
  const allRelatedLogs: CreatedLogInfo[] = [];

  for (const [key, itemTypes] of tripDateMap.entries()) {
    const [tripId, dateTime] = key.split("|");
    const date = dateTime.split("T")[0];
    const res = await fetch(`/api/daily-logs?tripId=${tripId}&date=${date}`);
    if (res.ok) {
      const data = await res.json();
      const logs: any[] = data.logs || [];
      logs.forEach((log) => {
        if (itemTypes.has(log.itemType) && log.id) {
          allRelatedLogs.push({
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
      });
    }
  }

  return allRelatedLogs;
}

/**
 * Updates main logs with relatedLogs
 */
export async function updateMainLogsWithRelatedLogs(
  mainLogs: CreatedLogInfo[],
  allRelatedLogs: CreatedLogInfo[],
): Promise<void> {
  for (const mainLog of mainLogs) {
    // Find related logs: same tripId, same dateTime, same itemType, userId in appliedTo
    const relatedLogIds = allRelatedLogs
      .filter(
        (log) =>
          log.tripId === mainLog.tripId &&
          log.dateTime === mainLog.dateTime &&
          log.itemType === mainLog.itemType &&
          mainLog.appliedTo.includes(log.userId) &&
          !log.isGroupSource &&
          log.id,
      )
      .map((log) => log.id)
      .filter((id) => id); // Filter out undefined/null IDs

    // Update the main log with relatedLogs (even if empty array)
    await fetch(`/api/daily-logs/${mainLog._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        relatedLogs: relatedLogIds,
      }),
    });
  }
}

/**
 * Creates a trip/date map from logs for efficient fetching
 */
export function createTripDateMap(
  logs: CreatedLogInfo[],
): Map<string, Set<string>> {
  const tripDateMap = new Map<string, Set<string>>();
  logs.forEach((log) => {
    const key = `${log.tripId}|${log.dateTime}`;
    if (!tripDateMap.has(key)) {
      tripDateMap.set(key, new Set());
    }
    tripDateMap.get(key)!.add(log.itemType);
  });
  return tripDateMap;
}
