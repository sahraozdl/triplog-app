import { DailyLogFormState } from "@/app/types/DailyLog";
import { Travel } from "@/app/types/Travel";

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

export async function fetchUsersData<T extends boolean = false>(
  userIds: string[],
  detailed?: T,
): Promise<{
  success: boolean;
  users?: T extends true
    ? Record<
        string,
        {
          name?: string;
          email?: string;
          employeeDetail?: any;
          jobTitle?: string;
        }
      >
    : Record<string, string>;
  error?: string;
}> {
  try {
    if (userIds.length === 0) {
      return {
        success: true,
        users: {} as any,
      };
    }

    const res = await fetch("/api/users/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds, detailed: detailed === true }),
    });

    if (!res.ok) {
      console.error("Failed to fetch user data");
      return {
        success: false,
        users: {} as any,
        error: "Failed to fetch user data",
      };
    }

    const data = await res.json();
    return {
      success: true,
      users: (data.users || {}) as any,
    };
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    return {
      success: false,
      users: {} as any,
      error:
        error instanceof Error ? error.message : "Failed to fetch user data",
    };
  }
}

export async function fetchUserNamesData(userIds: string[]): Promise<{
  success: boolean;
  users?: Record<string, string>;
  error?: string;
}> {
  const result = await fetchUsersData(userIds, false);
  return result as {
    success: boolean;
    users?: Record<string, string>;
    error?: string;
  };
}

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

export function createFetchAttendantNames(
  attendants: { userId: string }[],
  setNameMap: (names: Record<string, string>) => void,
) {
  return async () => {
    try {
      const raw = localStorage.getItem("tripAttendantNames");
      if (raw) {
        setNameMap(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Failed to read cached names", e);
    }

    if (attendants && attendants.length > 0) {
      const userIds = attendants.map((a) => a.userId);
      const result = await fetchUserNamesData(userIds);

      if (result.success && result.users) {
        setNameMap(result.users);
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
