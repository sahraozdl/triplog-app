"use client";

import { DailyLogFormState } from "@/app/types/DailyLog";

export default function DailyLogsList({ logs }: { logs: DailyLogFormState[] }) {
  return (
    <div>
      {logs.map((log) => (
        <div key={log._id.toString()}>
          <h3>{log.tripId}</h3>
          <p>{log.loggedInUserId}</p>
          <p>{log.appliedTo.join(", ")}</p>
          <p>{log.isGroupSource ? "Group" : "Individual"}</p>
          <p>{log.sharedFields.travel.travelReason}</p>
          <p>{log.sharedFields.travel.vehicleType}</p>
          <p>{log.sharedFields.travel.departureLocation}</p>
          <p>{log.sharedFields.travel.destination}</p>
          <p>{log.sharedFields.travel.distance}</p>
        </div>
      ))}
    </div>
  );
}
