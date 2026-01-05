import { DailyLogFormState } from "@/app/types/DailyLog";
import { fetchUsersData } from "../fetchers";

export async function validateNoConflictingUsers(
  appliedTo: string[],
  usersWithExistingLogs: Set<string>,
  tripId: string,
  date: string,
  originalLogs: DailyLogFormState[],
  itemTypesBeingEdited: ("worktime" | "accommodation" | "additional")[],
): Promise<{ isValid: boolean; error?: string }> {
  const res = await fetch(
    `/api/daily-logs?tripId=${tripId}&date=${date}&includeRelated=true`,
  );
  const data = await res.json();
  const allLogs: DailyLogFormState[] = data.logs || [];

  const originalLogIds = new Set(
    originalLogs.map((log) => log.id).filter((id): id is string => !!id),
  );

  const mainLogsByItemType = new Map<string, DailyLogFormState[]>();

  itemTypesBeingEdited.forEach((itemType) => {
    const mainLogsInOriginal = originalLogs.filter(
      (log) => log.itemType === itemType && log.isGroupSource === true,
    );

    const mainLogsWithRelated = allLogs.filter(
      (log) =>
        log.itemType === itemType &&
        log.isGroupSource === true &&
        Array.isArray(log.relatedLogs) &&
        log.relatedLogs.some((id) => originalLogIds.has(id)),
    );

    const allMainLogs = [
      ...mainLogsInOriginal,
      ...mainLogsWithRelated.filter(
        (log) => !mainLogsInOriginal.some((ml) => ml.id === log.id),
      ),
    ];

    if (allMainLogs.length > 0) {
      mainLogsByItemType.set(itemType, allMainLogs);
    }
  });

  const relatedLogIds = new Set<string>();
  mainLogsByItemType.forEach((mainLogs) => {
    mainLogs.forEach((mainLog) => {
      if (Array.isArray(mainLog.relatedLogs)) {
        mainLog.relatedLogs.forEach((id: string) => {
          if (id) relatedLogIds.add(id);
        });
      }
    });
  });

  const conflictingUsers: string[] = [];
  appliedTo.forEach((colleagueId) => {
    if (usersWithExistingLogs.has(colleagueId)) {
      const userLogs = allLogs.filter(
        (log) =>
          log.userId === colleagueId &&
          log.dateTime &&
          log.dateTime.split("T")[0] === date,
      );

      const hasNonRelatedLog = userLogs.some(
        (log) => log.id && !relatedLogIds.has(log.id),
      );

      if (hasNonRelatedLog) {
        conflictingUsers.push(colleagueId);
      }
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
