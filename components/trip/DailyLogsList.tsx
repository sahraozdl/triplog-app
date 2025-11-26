"use client";

import { DailyLogFormState } from "@/app/types/DailyLog";

export default function DailyLogsList({ logs }: { logs: DailyLogFormState[] }) {
  if (!logs || logs.length === 0) {
    return <div className="mt-6 text-gray-500">No logs yet.</div>;
  }

  return (
    <div className="mt-8 space-y-6">
      {logs.map((log) => (
        <div
          key={log._id.toString()}
          className="border rounded-lg p-4 shadow-sm  space-y-3"
        >
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Daily Log</h3>
            <span className="text-sm text-gray-500">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="text-sm">
            <p className="font-semibold">User: {log.userId}</p>
            <p>
              Applies To:{" "}
              {log.appliedTo?.length
                ? log.appliedTo.join(", ")
                : "Just the creator"}
            </p>
            <p className="text-gray-600">
              Type: {log.isGroupSource ? "Group Log" : "Individual Log"}
            </p>
          </div>

          <hr />

          {/* TRAVEL SECTION */}
          <div>
            <h4 className="font-semibold mb-1">Travel</h4>
            <div className="text-sm space-y-1">
              <p>Reason: {log.sharedFields?.travel?.travelReason || "-"}</p>
              <p>Vehicle: {log.sharedFields?.travel?.vehicleType || "-"}</p>
              <p>
                Date:{" "}
                {log.sharedFields?.travel?.dateTime?.date
                  ? new Date(
                      log.sharedFields.travel.dateTime.date,
                    ).toLocaleDateString()
                  : "-"}
              </p>
              <p>
                Time: {log.sharedFields?.travel?.dateTime?.startTime || "-"} →{" "}
                {log.sharedFields?.travel?.dateTime?.endTime || "-"}
              </p>
              <p>
                From: {log.sharedFields?.travel?.departureLocation || "-"} →{" "}
                {log.sharedFields?.travel?.destination || "-"}
              </p>
              <p>
                Distance:{" "}
                {log.sharedFields?.travel?.distance
                  ? `${log.sharedFields.travel.distance} km`
                  : "-"}
              </p>
              <p>
                Round Trip:{" "}
                {log.sharedFields?.travel?.isRoundTrip ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <hr />

          {/* WORK TIME SECTION */}
          <div>
            <h4 className="font-semibold mb-1">Work Time</h4>
            <div className="text-sm space-y-1">
              <p>Start: {log.sharedFields?.workTime?.startTime || "-"}</p>
              <p>End: {log.sharedFields?.workTime?.endTime || "-"}</p>
              <p>
                Description:{" "}
                {log.sharedFields?.workTime?.description || "No details"}
              </p>
            </div>
          </div>

          <hr />

          {/* ACCOMMODATION + MEALS */}
          <div>
            <h4 className="font-semibold mb-1">Accommodation & Meals</h4>
            <div className="text-sm space-y-1">
              <p>
                Accommodation Type:{" "}
                {log.sharedFields?.accommodationMeals?.accommodationType}
              </p>
              <p>
                Covered By:{" "}
                {log.sharedFields?.accommodationMeals?.accommodationCoveredBy}
              </p>
              <p>
                Overnight Stay:{" "}
                {log.sharedFields?.accommodationMeals?.overnightStay || "-"}
              </p>

              <div className="mt-1">
                <p className="font-medium">Meals:</p>
                <p>
                  Breakfast:{" "}
                  {log.sharedFields?.accommodationMeals?.meals?.breakfast?.eaten
                    ? `Yes (${log.sharedFields.accommodationMeals.meals.breakfast.coveredBy})`
                    : "No"}
                </p>
                <p>
                  Lunch:{" "}
                  {log.sharedFields?.accommodationMeals?.meals?.lunch?.eaten
                    ? `Yes (${log.sharedFields.accommodationMeals.meals.lunch.coveredBy})`
                    : "No"}
                </p>
                <p>
                  Dinner:{" "}
                  {log.sharedFields?.accommodationMeals?.meals?.dinner?.eaten
                    ? `Yes (${log.sharedFields.accommodationMeals.meals.dinner.coveredBy})`
                    : "No"}
                </p>
              </div>
            </div>
          </div>

          <hr />

          {/* ADDITIONAL NOTES */}
          <div>
            <h4 className="font-semibold mb-1">Additional Notes</h4>
            <p className="text-sm">
              {log.sharedFields?.additional?.notes || "No additional notes"}
            </p>
          </div>

          {/* FILES */}
          {log.files?.length > 0 && (
            <>
              <hr />
              <div>
                <h4 className="font-semibold mb-1">Files</h4>
                <ul className="text-sm list-inside">
                  {log.files.map((f, i) => (
                    <li key={i}>
                      <a
                        href={f.url}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        {f.name}
                      </a>{" "}
                      ({Math.round((f.size || 0) / 1024)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
