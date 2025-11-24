"use client";

import { TripAttendant } from "@/app/types/Trip";

export default function UserFilter({
  attendants,
}: {
  attendants: TripAttendant[];
}) {
  return (
    <div className="border p-4 rounded-lg bg-muted/20">
      <p className="text-sm mb-2">Filter by user:</p>
      <select className="border p-2 rounded w-full">
        <option value="">All</option>
        {attendants.map((a) => (
          <option key={a.userId} value={a.userId}>
            {a.userId}
          </option>
        ))}
      </select>
    </div>
  );
}
