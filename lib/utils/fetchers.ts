import { DailyLogFormState } from "@/app/types/DailyLog";
import { Travel } from "@/app/types/Travel";

/**
 * Core API function to fetch daily logs for a trip
 */
export async function fetchLogsData(
  tripId: string,
): Promise<{ success: boolean; logs?: DailyLogFormState[]; error?: string }> {
  try {
    const res = await fetch(`/api/daily-logs?tripId=${tripId}`);

    if (!res.ok) {
      console.error("Logs could not be fetched, Status:", res.status);
      return {
        success: false,
        logs: [],
        error: `Failed to fetch logs: ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      logs: (data.logs || []) as DailyLogFormState[],
    };
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return {
      success: false,
      logs: [],
      error: error instanceof Error ? error.message : "Failed to fetch logs",
    };
  }
}

/**
 * Core API function to fetch travels for a trip
 */
export async function fetchTravelsData(
  tripId: string,
): Promise<{ success: boolean; travels?: Travel[]; error?: string }> {
  try {
    const res = await fetch(`/api/travels?tripId=${tripId}`);

    if (!res.ok) {
      console.error("Travels could not be fetched, Status:", res.status);
      return {
        success: false,
        travels: [],
        error: `Failed to fetch travels: ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      travels: (data.travels || []) as Travel[],
    };
  } catch (error) {
    console.error("Failed to fetch travels:", error);
    return {
      success: false,
      travels: [],
      error: error instanceof Error ? error.message : "Failed to fetch travels",
    };
  }
}

/**
 * Core API function to fetch user names by user IDs
 */
export async function fetchUserNamesData(
  userIds: string[],
): Promise<{
  success: boolean;
  users?: Record<string, string>;
  error?: string;
}> {
  try {
    if (userIds.length === 0) {
      return {
        success: true,
        users: {},
      };
    }

    const res = await fetch("/api/users/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });

    if (!res.ok) {
      console.error("Failed to fetch user names");
      return {
        success: false,
        users: {},
        error: "Failed to fetch user names",
      };
    }

    const data = await res.json();
    return {
      success: true,
      users: data.users || {},
    };
  } catch (error) {
    console.error("Failed to fetch user names:", error);
    return {
      success: false,
      users: {},
      error:
        error instanceof Error ? error.message : "Failed to fetch user names",
    };
  }
}

/**
 * Extract user IDs from logs and travels
 */
export function extractUserIdsFromLogsAndTravels(
  logs: DailyLogFormState[],
  travels: Travel[],
): string[] {
  const userIds = new Set<string>();

  logs.forEach((log) => {
    userIds.add(log.userId);
    log.appliedTo?.forEach((id) => userIds.add(id));
  });

  travels.forEach((travel) => {
    userIds.add(travel.userId);
    travel.appliedTo?.forEach((id) => userIds.add(id));
  });

  return Array.from(userIds);
}

/**
 * Factory function to create a fetchLogs handler
 */
export function createFetchLogs(
  tripId: string,
  setLogs: (logs: DailyLogFormState[]) => void,
) {
  return async () => {
    const result = await fetchLogsData(tripId);
    if (result.success && result.logs) {
      setLogs(result.logs);
    } else {
      setLogs([]);
    }
  };
}

/**
 * Factory function to create a fetchTravels handler
 */
export function createFetchTravels(
  tripId: string,
  setTravels: (travels: Travel[]) => void,
) {
  return async () => {
    const result = await fetchTravelsData(tripId);
    if (result.success && result.travels) {
      setTravels(result.travels);
    } else {
      setTravels([]);
    }
  };
}

/**
 * Factory function to create a fetchUserNames handler
 */
export function createFetchUserNames(
  logs: DailyLogFormState[],
  travels: Travel[],
  setUserNames: (names: Record<string, string>) => void,
  setLoadingNames?: (loading: boolean) => void,
) {
  return async () => {
    if (setLoadingNames) {
      setLoadingNames(true);
    }

    try {
      const userIds = extractUserIdsFromLogsAndTravels(logs, travels);
      const result = await fetchUserNamesData(userIds);

      if (result.success && result.users) {
        setUserNames(result.users);
      } else {
        setUserNames({});
      }
    } catch (error) {
      console.error("Failed to fetch user names:", error);
      setUserNames({});
    } finally {
      if (setLoadingNames) {
        setLoadingNames(false);
      }
    }
  };
}

/**
 * Fetch user names with localStorage caching
 * Returns a function that can be used in useEffect
 */
export function createFetchAttendantNames(
  attendants: { userId: string }[],
  setNameMap: (names: Record<string, string>) => void,
) {
  return async () => {
    // First try to load from cache
    try {
      const raw = localStorage.getItem("tripAttendantNames");
      if (raw) {
        setNameMap(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Failed to read cached names", e);
    }

    // Then fetch from API if we have attendants
    if (attendants && attendants.length > 0) {
      const userIds = attendants.map((a) => a.userId);
      const result = await fetchUserNamesData(userIds);

      if (result.success && result.users) {
        setNameMap(result.users);
        // Update cache
        try {
          localStorage.setItem(
            "tripAttendantNames",
            JSON.stringify(result.users),
          );
        } catch (e) {
          console.error("Failed to cache names", e);
        }
      }
    }
  };
}
