"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DailyLogFormState,
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
} from "@/app/types/DailyLog";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import DailyLogCard from "./DailyLogCard";
import LogFilters, { FilterState } from "./LogFilters";
import { TripAttendant } from "@/app/types/Trip";
import { Button } from "@/components/ui/button";

export interface GroupedLog {
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

  logs.forEach((log) => {
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
        travels: [],
        works: [],
        accommodations: [],
        additionals: [],
      };
    }

    const group = groups[groupKey];
    const type = (log.itemType || "additional").toLowerCase();

    if (type === "travel") group.travels.push(log as TravelLog);
    else if (type === "worktime") group.works.push(log as WorkTimeLog);
    else if (type === "accommodation")
      group.accommodations.push(log as AccommodationLog);
    else group.additionals.push(log as AdditionalLog);
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
        const isCreator = log.userId === filters.userId;
        const isIncluded = log.appliedTo?.includes(filters.userId);
        if (!isCreator && !isIncluded) return false;
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

  useEffect(() => {
    if (!logs.length) {
      setLoadingNames(false);
      return;
    }
    const allIds = new Set<string>();
    logs.forEach((l) => {
      if (l.userId) allIds.add(l.userId);
      if (l.appliedTo) l.appliedTo.forEach((id) => allIds.add(id));
    });

    fetch("/api/users/lookup", {
      method: "POST",
      body: JSON.stringify({ userIds: Array.from(allIds) }),
    })
      .then((res) => res.json())
      .then((data) => setUserNames(data.users))
      .finally(() => setLoadingNames(false));
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
