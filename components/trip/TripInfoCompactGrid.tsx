"use client";

import { Trip } from "@/app/types/Trip";
import { Calendar } from "lucide-react";
import { isoToDateString } from "@/lib/utils/dateConversion";
import { TripInfoField } from "./TripInfoField";
import { Label } from "../ui/label";

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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 pb-3 sm:pb-4 border-b mb-1">
      {/* Status Badge */}
      <div className="flex flex-row items-center gap-1.5 text-xs sm:text-sm">
        <Label
          htmlFor="trip-status"
          className="text-muted-foreground py-0.5 whitespace-nowrap"
        >
          Status:
        </Label>
        <span
          id="trip-status"
          className="font-medium capitalize px-2 py-0.5 rounded bg-muted/50 text-muted-foreground whitespace-nowrap"
          aria-label={`Trip status: ${trip.status}`}
        >
          {trip.status}
        </span>
      </div>

      {/* Start Date */}
      <TripInfoField
        label="Start"
        value={formatDate(trip.basicInfo.startDate)}
        icon={
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        }
        title={formatDate(trip.basicInfo.startDate)}
      />

      {/* End Date */}
      <TripInfoField
        label="End"
        value={
          trip.basicInfo.endDate
            ? formatDate(trip.basicInfo.endDate)
            : "Ongoing"
        }
        icon={
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        }
        title={
          trip.basicInfo.endDate
            ? formatDate(trip.basicInfo.endDate)
            : "Ongoing"
        }
      />
    </div>
  );
}
