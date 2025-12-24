"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DailyLogFormState,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
} from "@/app/types/DailyLog";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import DailyLogCard from "./DailyLogCard";
import LogFilters, { FilterState } from "./LogFilters";
import { TripAttendant } from "@/app/types/Trip";
import { Button } from "@/components/ui/button";
import { fetchUsersData } from "@/lib/utils/fetchers";

export interface GroupedLog {
  id: string;
  date: string;
  userId: string;
  isGroup: boolean;
  appliedTo: string[];
  works: WorkTimeLog[];
  accommodations: AccommodationLog[];
  additionals: AdditionalLog[];
}

function groupLogs(logs: DailyLogFormState[]): GroupedLog[] {
  const groups: Record<string, GroupedLog> = {};

  // Separate worktime logs for effective log computation
  const worktimeLogs = logs.filter(
    (log) => log.itemType === "worktime",
  ) as WorkTimeLog[];
  const nonWorktimeLogs = logs.filter((log) => log.itemType !== "worktime");

  // Process non-worktime logs first
  nonWorktimeLogs.forEach((log) => {
    const validDate = log.dateTime || log.createdAt || new Date().toISOString();
    let dateKey = "";
    try {
      dateKey = validDate.split("T")[0];
    } catch {
      dateKey = "unknown";
    }

    const userId = log.userId || "unknown";
    const groupKey = `${dateKey}_${userId}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: groupKey,
        date: validDate,
        userId: userId,
        isGroup: log.isGroupSource || false,
        appliedTo: log.appliedTo || [],
        works: [],
        accommodations: [],
        additionals: [],
      };
    }

    const group = groups[groupKey];
    const type = (log.itemType || "additional").toLowerCase();

    if (type === "accommodation")
      group.accommodations.push(log as AccommodationLog);
    else group.additionals.push(log as AdditionalLog);
  });

  // Process worktime logs - only create groups for users who have actual database records
  // (i.e., log.userId === userId, not just users in appliedTo)
  worktimeLogs.forEach((log) => {
    const validDate = log.dateTime || log.createdAt || new Date().toISOString();
    let dateKey = "";
    try {
      dateKey = validDate.split("T")[0];
    } catch {
      dateKey = "unknown";
    }

    // Only create groups for the actual owner of the log (log.userId)
    // Don't create groups for users who are only in appliedTo
    const userId = log.userId || "unknown";
    const groupKey = `${dateKey}_${userId}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: groupKey,
        date: validDate,
        userId: userId,
        isGroup: log.isGroupSource || false,
        appliedTo: log.appliedTo || [],
        works: [],
        accommodations: [],
        additionals: [],
      };
    }

    // Add the worktime log to the owner's group
    const existingWorkId = groups[groupKey].works.find(
      (w) => w._id.toString() === log._id.toString(),
    );
    if (!existingWorkId) {
      groups[groupKey].works.push(log);
    }
  });

  return Object.values(groups).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export default function DailyLogsList({
  logs,
  attendants = [],
  tripId,
  onLogsChange,
}: {
  logs: DailyLogFormState[];
  attendants?: TripAttendant[];
  tripId: string;
  onLogsChange: () => void;
}) {
  const [filters, setFilters] = useState<FilterState>({
    userId: "all",
    itemType: "all",
    showGroupOnly: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const processedData = useMemo(() => {
    const filteredRawLogs = logs.filter((log) => {
      if (filters.itemType !== "all" && log.itemType !== filters.itemType)
        return false;

      if (filters.showGroupOnly && !log.isGroupSource) return false;

      if (filters.userId !== "all") {
        if (log.userId !== filters.userId) return false;
      }

      return true;
    });

    const grouped = groupLogs(filteredRawLogs);

    const totalPages = Math.ceil(grouped.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = grouped.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { totalPages, currentItems, totalCount: grouped.length };
  }, [logs, filters, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loadingNames, setLoadingNames] = useState(true);

  // Extract unique user IDs from logs
  const userIds = useMemo(() => {
    const allIds = new Set<string>();
    logs.forEach((l) => {
      if (l.userId) allIds.add(l.userId);
    });
    return Array.from(allIds);
  }, [logs]);

  // Fetch user names when logs change
  useEffect(() => {
    if (userIds.length === 0) {
      setLoadingNames(false);
      setUserNames({});
      return;
    }

    let cancelled = false;
    setLoadingNames(true);

    fetchUsersData(userIds, false).then((result) => {
      if (!cancelled) {
        if (result.success && result.users) {
          setUserNames(result.users);
        } else {
          setUserNames({});
        }
        setLoadingNames(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userIds]);

  if (!logs || logs.length === 0) {
    return (
      <div className="mt-12 text-center flex flex-col items-center text-muted-foreground opacity-60">
        <FileText className="h-12 w-12 mb-2" />
        <p>No daily logs recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <LogFilters
        attendants={attendants}
        filters={filters}
        onFilterChange={setFilters}
      />

      <div className="mb-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Showing {processedData.currentItems.length} of{" "}
        {processedData.totalCount} Entries
      </div>

      <div className="space-y-6">
        {processedData.currentItems.length > 0 ? (
          processedData.currentItems.map((group) => (
            <DailyLogCard
              key={group.id}
              group={group}
              userNames={userNames}
              loadingNames={loadingNames}
              tripId={tripId}
              onDelete={onLogsChange}
            />
          ))
        ) : (
          <div className="p-8 border border-dashed rounded-xl text-center text-muted-foreground bg-muted/5">
            No logs match your filters.
          </div>
        )}
      </div>

      {processedData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium text-foreground">
            Page {currentPage} of {processedData.totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((p) => Math.min(processedData.totalPages, p + 1))
            }
            disabled={currentPage === processedData.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
