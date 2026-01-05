import { DailyLogFormState } from "@/app/types/DailyLog";
import { fetchUsersData } from "../fetchers";

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
