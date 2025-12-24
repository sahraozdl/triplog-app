"use client";

import { TripAttendant } from "@/app/types/Trip";
import { Filter, User, Layers, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { fetchUsersData } from "@/lib/utils/fetchers";
import { Label } from "../ui/label";

export interface FilterState {
  userId: string;
  itemType: string;
  showGroupOnly: boolean;
}

interface Props {
  attendants: TripAttendant[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export default function LogFilters({
  attendants,
  filters,
  onFilterChange,
}: Props) {
  const [names, setNames] = useState<Record<string, string>>({});

  // Extract user IDs from attendants
  const userIds = useMemo(() => attendants.map((a) => a.userId), [attendants]);

  useEffect(() => {
    if (userIds.length === 0) {
      setNames({});
      return;
    }

    let cancelled = false;

    fetchUsersData(userIds, false).then((result) => {
      if (!cancelled) {
        if (result.success && result.users) {
          setNames(result.users);
        } else {
          setNames({});
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userIds]);

  const handleChange = (key: keyof FilterState, value: string | boolean) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-5 flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-start justify-between shadow-sm mb-4 sm:mb-6">
      {/* Filter Selects Section */}
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-1/2">
        <div className="relative flex-1 sm:flex-none">
          <Label htmlFor="filter-item-type" className="sr-only">
            Filter by item type
          </Label>
          <Layers
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
            aria-hidden="true"
          />
          <select
            id="filter-item-type"
            value={filters.itemType}
            onChange={(e) => handleChange("itemType", e.target.value)}
            aria-label="Filter by item type"
            className="pl-9 pr-8 py-2.5 h-11 w-full sm:w-[160px] md:w-[180px] bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none appearance-none cursor-pointer transition-colors hover:border-primary/50"
          >
            <option value="all">All Types</option>
            <option value="worktime">Work Time</option>
            <option value="accommodation">Accommodation</option>
            <option value="additional">Notes/Files</option>
          </select>
        </div>

        <div className="relative flex-1 sm:flex-none">
          <Label htmlFor="filter-user" className="sr-only">
            Filter by user
          </Label>
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
            aria-hidden="true"
          />
          <select
            id="filter-user"
            value={filters.userId}
            onChange={(e) => handleChange("userId", e.target.value)}
            aria-label="Filter by user"
            className="pl-9 pr-8 py-2.5 h-11 w-full sm:w-[180px] md:w-[200px] bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none appearance-none cursor-pointer transition-colors hover:border-primary/50"
          >
            <option value="all">All Colleagues</option>
            {attendants.map((a) => (
              <option key={a.userId} value={a.userId}>
                {names[a.userId] || a.userId.slice(0, 8) + "..."}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Checkbox and Status Section */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-1/2 justify-between lg:justify-end lg:self-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border">
        <Label
          htmlFor="filter-shared-only"
          className="flex items-center gap-2.5 cursor-pointer group select-none flex-1 sm:flex-none min-w-0"
        >
          <input
            id="filter-shared-only"
            type="checkbox"
            className="sr-only"
            checked={filters.showGroupOnly}
            onChange={(e) => handleChange("showGroupOnly", e.target.checked)}
            aria-label="Show shared logs only"
          />
          <div
            className={`
            w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
            ${
              filters.showGroupOnly
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background border-input group-hover:border-primary group-focus-within:ring-2 group-focus-within:ring-primary group-focus-within:ring-offset-1"
            }
          `}
            aria-hidden="true"
          >
            {filters.showGroupOnly && <CheckCircle2 className="w-3.5 h-3.5" />}
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
            Shared Only
          </span>
        </Label>

        <div
          className="h-4 w-px bg-border hidden lg:block"
          aria-hidden="true"
        ></div>

        <div
          className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
          aria-label="Filters are active"
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Filters Active</span>
        </div>
      </div>
    </div>
  );
}
