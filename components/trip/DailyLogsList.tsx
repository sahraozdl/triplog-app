"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DailyLogFormState,
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
} from "@/app/types/DailyLog";
import { FileText } from "lucide-react";
import DailyLogCard from "./DailyLogCard";

interface GroupedLog {
  id: string;
  date: string;
  userId: string;
  isGroup: boolean;
  appliedTo: string[];
  travels: TravelLog[];
  works: WorkTimeLog[];
  accommodations: AccommodationLog[];
  additionals: AdditionalLog[];
}

function groupLogs(logs: DailyLogFormState[]): GroupedLog[] {
  const groups: Record<string, GroupedLog> = {};

  logs.forEach((log, index) => {
    if (!log.itemType) {
      console.warn(`Log #${index} skipped: itemType is missing.`, log);
      return;
    }

    if (!log.dateTime) {
      console.warn(`Log #${index} skipped: dateTime is missing.`, log);
      return;
    }

    let dateKey = "unknown-date";
    try {
      dateKey = log.dateTime.split("T")[0];
    } catch (e) {
      console.error(`Error in date format for log #${index}:`, log.dateTime);
      return;
    }

    const groupKey = `${dateKey}_${log.userId}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: groupKey,
        date: log.dateTime,
        userId: log.userId,
        isGroup: log.isGroupSource,
        appliedTo: log.appliedTo || [],
        travels: [],
        works: [],
        accommodations: [],
        additionals: [],
      };
    }

    const group = groups[groupKey];

    const type = log.itemType.toLowerCase();

    if (type === "travel") group.travels.push(log as TravelLog);
    else if (type === "worktime") group.works.push(log as WorkTimeLog);
    else if (type === "accommodation")
      group.accommodations.push(log as AccommodationLog);
    else if (type === "additional")
      group.additionals.push(log as AdditionalLog);
    else console.warn(`Unknown itemType: ${type}`, log);
  });

  return Object.values(groups).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export default function DailyLogsList({ logs }: { logs: DailyLogFormState[] }) {
  const groupedLogs = useMemo(() => groupLogs(logs), [logs]);

  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loadingNames, setLoadingNames] = useState(true);

  useEffect(() => {
    if (!logs || logs.length === 0) {
      setLoadingNames(false);
      return;
    }

    const fetchUserNames = async () => {
      const allIds = new Set<string>();
      logs.forEach((log) => {
        if (log.userId) allIds.add(log.userId);
        if (log.appliedTo) log.appliedTo.forEach((id) => allIds.add(id));
      });

      if (allIds.size === 0) {
        setLoadingNames(false);
        return;
      }

      try {
        const res = await fetch("/api/users/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: Array.from(allIds) }),
        });

        if (res.ok) {
          const data = await res.json();
          setUserNames(data.users);
        }
      } catch (error) {
        console.error("Failed to fetch user names", error);
      } finally {
        setLoadingNames(false);
      }
    };

    fetchUserNames();
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className="mt-12 text-center flex flex-col items-center text-muted-foreground opacity-60">
        <FileText className="h-12 w-12 mb-2" />
        <p>No daily logs recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {groupedLogs.map((group) => (
        <DailyLogCard
          key={group.id}
          group={group}
          userNames={userNames}
          loadingNames={loadingNames}
        />
      ))}
    </div>
  );
}
