"use client";

import { TripAttendant } from "@/app/types/Trip";
import { Filter, User, Layers, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { fetchUsersData } from "@/lib/utils/fetchers";

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
    <div className="bg-card border border-border rounded-lg p-3 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <div className="relative">
          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={filters.itemType}
            onChange={(e) => handleChange("itemType", e.target.value)}
            className="pl-9 pr-4 py-2 h-10 w-full sm:w-[160px] bg-background border border-input rounded-md text-sm focus:ring-1 focus:ring-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="travel">Travel</option>
            <option value="worktime">Work Time</option>
            <option value="accommodation">Accommodation</option>
            <option value="additional">Notes/Files</option>
          </select>
        </div>

        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={filters.userId}
            onChange={(e) => handleChange("userId", e.target.value)}
            className="pl-9 pr-4 py-2 h-10 w-full sm:w-[180px] bg-background border border-input rounded-md text-sm focus:ring-1 focus:ring-primary focus:outline-none appearance-none cursor-pointer"
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

      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
        <label className="flex items-center gap-2 cursor-pointer group select-none">
          <div
            className={`
            w-5 h-5 rounded border flex items-center justify-center transition-colors
            ${filters.showGroupOnly ? "bg-primary border-primary text-primary-foreground" : "bg-background border-input group-hover:border-primary"}
          `}
          >
            {filters.showGroupOnly && <CheckCircle2 className="w-3.5 h-3.5" />}
          </div>
          <input
            type="checkbox"
            className="hidden"
            checked={filters.showGroupOnly}
            onChange={(e) => handleChange("showGroupOnly", e.target.checked)}
          />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Shared Only
          </span>
        </label>

        <div className="h-4 w-px bg-border hidden md:block"></div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" />
          <span>Filters Active</span>
        </div>
      </div>
    </div>
  );
}
