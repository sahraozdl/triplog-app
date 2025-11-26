"use client";

import { TripAttendant } from "@/app/types/Trip";

// will be improved later

export default function UserFilter({
  attendants,
}: {
  attendants: TripAttendant[];
}) {
  return (
    <div className="border p-4 rounded-lg bg-muted/20 shadow-sm">
      <p className="text-sm mb-2 font-medium">Filter by user</p>

      <div className="relative">
        <select
          className="
            border border-input-border bg-background rounded-md
            p-2 pr-8 w-full text-sm
            focus:outline-none focus:ring-2 focus:ring-primary
            truncate
          "
        >
          <option value="">All Users</option>

          {attendants.map((a) => (
            <option key={a.userId} value={a.userId} className="truncate">
              {a.userId}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
