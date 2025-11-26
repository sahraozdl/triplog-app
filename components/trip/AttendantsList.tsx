"use client";

import { TripAttendant } from "@/app/types/Trip";

export default function AttendantsList({
  attendants,
}: {
  attendants: TripAttendant[];
}) {
  if (!attendants || attendants.length === 0) {
    return (
      <div className="border p-4 rounded-lg bg-muted/20 text-sm text-gray-500">
        No attendants.
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-lg bg-muted/20">
      <ul className="space-y-3">
        {attendants.map((a) => (
          <li
            key={a.userId}
            className="
              grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4
              text-sm p-3 bg-white dark:bg-neutral-900 rounded-md shadow-sm
            "
          >
            <span className="font-medium break-all">{a.userId}</span>
            <span className="text-gray-600">{a.role}</span>
            <span className="text-gray-600">{a.status}</span>
            <span className="text-gray-600">
              {a.joinedAt ? new Date(a.joinedAt).toLocaleDateString() : "-"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
