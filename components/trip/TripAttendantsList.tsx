"use client";

import { TripAttendant } from "@/app/types/Trip";

interface TripAttendantsListProps {
  attendants: TripAttendant[];
  attendantNames: Record<string, string>;
  loadingNames: boolean;
}

export function TripAttendantsList({
  attendants,
  attendantNames,
  loadingNames,
}: TripAttendantsListProps) {
  if (attendants.length === 0) {
    return (
      <p className="text-muted-foreground text-xs sm:text-sm pl-4 sm:pl-6">
        No attendants
      </p>
    );
  }

  return (
    <div className="space-y-1.5 sm:space-y-2 pl-4 sm:pl-6" role="list">
      {attendants.map((attendant, index) => (
        <div
          key={`${attendant.userId}-${index}`}
          className="p-2 sm:p-2.5 border rounded-md bg-muted/30 text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2"
          role="listitem"
        >
          <div className="font-medium text-foreground truncate sm:col-span-1">
            {loadingNames
              ? "Loading..."
              : attendantNames[attendant.userId] || "Unknown User"}
          </div>
          <div className="flex gap-2 sm:gap-0 sm:flex-col sm:col-span-2 sm:grid sm:grid-cols-2">
            <span className="text-muted-foreground text-xs capitalize">
              {attendant.role}
            </span>
            <span className="text-muted-foreground text-xs capitalize">
              {attendant.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
