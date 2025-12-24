"use client";

import { Trip } from "@/app/types/Trip";
import { Calendar } from "lucide-react";
import { isoToDateString } from "@/lib/utils/dateConversion";

interface TripInfoCompactGridProps {
  trip: Trip;
}

function formatDate(isoString: string | undefined) {
  if (!isoString) return "—";
  const dateStr = isoToDateString(isoString);
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T12:00:00Z");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function TripInfoCompactGrid({ trip }: TripInfoCompactGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Status Badge */}
      <div className="col-span-2 sm:col-span-1">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <label htmlFor="trip-status" className="text-muted-foreground">
            Status:
          </label>
          <span
            id="trip-status"
            className="font-medium capitalize px-2 py-0.5 rounded bg-muted"
            aria-label={`Trip status: ${trip.status}`}
          >
            {trip.status}
          </span>
        </div>
      </div>

      {/* Start Date */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm">
        <Calendar
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <label
            htmlFor="trip-start-date"
            className="text-muted-foreground block"
          >
            Start
          </label>
          <div
            id="trip-start-date"
            className="font-medium truncate"
            title={formatDate(trip.basicInfo.startDate)}
          >
            {formatDate(trip.basicInfo.startDate)}
          </div>
        </div>
      </div>

      {/* End Date */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm">
        <Calendar
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <label
            htmlFor="trip-end-date"
            className="text-muted-foreground block"
          >
            End
          </label>
          <div
            id="trip-end-date"
            className="font-medium truncate"
            title={
              trip.basicInfo.endDate
                ? formatDate(trip.basicInfo.endDate)
                : "Ongoing"
            }
          >
            {trip.basicInfo.endDate
              ? formatDate(trip.basicInfo.endDate)
              : "Ongoing"}
          </div>
        </div>
      </div>
    </div>
  );
}
