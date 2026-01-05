import { DailyLogFormState } from "@/app/types/DailyLog";
import { Travel } from "@/app/types/Travel";
import { handleApiRequest } from "./apiErrorHandler";

export async function fetchLogsData(
  tripId: string,
): Promise<{ success: boolean; logs?: DailyLogFormState[]; error?: string }> {
  const result = await handleApiRequest<{ logs?: DailyLogFormState[] }>(
    `/api/daily-logs?tripId=${tripId}`,
    {
      errorPrefix: "Failed to fetch logs",
    },
  );

  if (result.success && result.data) {
    return {
      success: true,
      logs: (result.data.logs || []) as DailyLogFormState[],
    };
  }

  return {
    success: false,
    logs: [],
    error: result.error || "Failed to fetch logs",
  };
}

export async function fetchTravelsData(
  tripId: string,
): Promise<{ success: boolean; travels?: Travel[]; error?: string }> {
  const result = await handleApiRequest<{ travels?: Travel[] }>(
    `/api/travels?tripId=${tripId}`,
    {
      errorPrefix: "Failed to fetch travels",
    },
  );

  if (result.success && result.data) {
    return {
      success: true,
      travels: (result.data.travels || []) as Travel[],
    };
  }

  return {
    success: false,
    travels: [],
    error: result.error || "Failed to fetch travels",
  };
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
  if (userIds.length === 0) {
    return {
      success: true,
      users: {} as any,
    };
  }

  const result = await handleApiRequest<{ users?: Record<string, unknown> }>(
    "/api/users/lookup",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds, detailed: detailed === true }),
      errorPrefix: "Failed to fetch user data",
    },
  );

  if (result.success && result.data) {
    return {
      success: true,
      users: (result.data.users || {}) as any,
    };
  }

  return {
    success: false,
    users: {} as any,
    error: result.error || "Failed to fetch user data",
  };
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
