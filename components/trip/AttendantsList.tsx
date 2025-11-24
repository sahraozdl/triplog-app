"use client";

import { TripAttendant } from "@/app/types/Trip";

export default function AttendantsList({
  attendants,
}: {
  attendants: TripAttendant[];
}) {
  return (
    <div className="border p-4 rounded-lg bg-muted/20">
      <ul className="space-y-2">
        {attendants.map((a) => (
          <li key={a.userId} className="flex justify-between text-sm">
            <span>{a.userId}</span>
            <span className="text-gray-600">{a.role}</span>
            <span className="text-gray-600">{a.status}</span>
            <span className="text-gray-600">{a.joinedAt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
