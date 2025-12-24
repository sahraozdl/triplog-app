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
      <p className="text-muted-foreground text-xs sm:text-sm pl-6">
        No attendants
      </p>
    );
  }

  return (
    <div className="space-y-1.5 pl-6" role="list">
      {attendants.map((attendant, index) => (
        <div
          key={`${attendant.userId}-${index}`}
          className="p-2 border rounded-md bg-muted/30 text-xs sm:text-sm"
          role="listitem"
        >
          <div className="font-medium text-foreground">
            {loadingNames
              ? "Loading..."
              : attendantNames[attendant.userId] || "Unknown User"}
          </div>
          <div className="text-muted-foreground text-xs">
            {attendant.role} • {attendant.status}
          </div>
        </div>
      ))}
    </div>
  );
}
