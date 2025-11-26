"use client";

import { DailyLogFormState } from "@/app/types/DailyLog";

export default function DailyLogsList({ logs }: { logs: DailyLogFormState[] }) {
  if (!logs || logs.length === 0) {
    return <div className="mt-6 text-gray-500 text-sm">No logs yet.</div>;
  }

  return (
    <div className="mt-8 space-y-6">
      {logs.map((log) => (
        <div
          key={log._id.toString()}
          className="border rounded-lg p-5 shadow-sm bg-white dark:bg-neutral-900 space-y-4"
        >
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Daily Log</h3>
            <span className="text-xs text-gray-500">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>

          {/* BASIC INFO */}
          <div className="text-sm space-y-0.5">
            <p>
              <span className="font-medium">User:</span> {log.userId}
            </p>
            <p>
              <span className="font-medium">Applies To:</span>{" "}
              {log.appliedTo?.length
                ? log.appliedTo.join(", ")
                : "Just the creator"}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Type:</span>{" "}
              {log.isGroupSource ? "Group Log" : "Individual Log"}
            </p>
          </div>

          <Section title="Travel">
            <Field
              label="Reason"
              value={log.sharedFields?.travel?.travelReason}
            />
            <Field
              label="Vehicle"
              value={log.sharedFields?.travel?.vehicleType}
            />
            <Field
              label="Date"
              value={
                log.sharedFields?.travel?.dateTime?.date
                  ? new Date(
                      log.sharedFields.travel.dateTime.date,
                    ).toLocaleDateString()
                  : "-"
              }
            />
            <Field
              label="Time"
              value={`${log.sharedFields?.travel?.dateTime?.startTime || "-"} → ${
                log.sharedFields?.travel?.dateTime?.endTime || "-"
              }`}
            />
            <Field
              label="Route"
              value={`${log.sharedFields?.travel?.departureLocation || "-"} → ${
                log.sharedFields?.travel?.destination || "-"
              }`}
            />
            <Field
              label="Distance"
              value={
                log.sharedFields?.travel?.distance
                  ? `${log.sharedFields.travel.distance} km`
                  : "-"
              }
            />
            <Field
              label="Round Trip"
              value={log.sharedFields?.travel?.isRoundTrip ? "Yes" : "No"}
            />
          </Section>

          <Section title="Work Time">
            <Field
              label="Start"
              value={log.sharedFields?.workTime?.startTime}
            />
            <Field label="End" value={log.sharedFields?.workTime?.endTime} />
            <Field
              label="Description"
              value={log.sharedFields?.workTime?.description || "No details"}
            />
          </Section>

          <Section title="Accommodation & Meals">
            <Field
              label="Accommodation Type"
              value={log.sharedFields?.accommodationMeals?.accommodationType}
            />
            <Field
              label="Covered By"
              value={
                log.sharedFields?.accommodationMeals?.accommodationCoveredBy
              }
            />
            <Field
              label="Overnight Stay"
              value={log.sharedFields?.accommodationMeals?.overnightStay}
            />

            {/* Meals */}
            <div className="mt-2 space-y-0.5">
              <p className="font-medium text-sm">Meals</p>
              {renderMeal(
                "Breakfast",
                log.sharedFields?.accommodationMeals?.meals?.breakfast,
              )}
              {renderMeal(
                "Lunch",
                log.sharedFields?.accommodationMeals?.meals?.lunch,
              )}
              {renderMeal(
                "Dinner",
                log.sharedFields?.accommodationMeals?.meals?.dinner,
              )}
            </div>
          </Section>

          <Section title="Additional Notes">
            <p className="text-sm">
              {log.sharedFields?.additional?.notes || "No additional notes"}
            </p>
          </Section>

          {log.files?.length > 0 && (
            <Section title="Files">
              <ul className="text-sm list-inside space-y-1">
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
            </Section>
          )}
        </div>
      ))}
    </div>
  );
}

/* SMALL HELPER COMPONENTS */

function Section({ title, children }: any) {
  return (
    <div className="space-y-1">
      <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">
        {title}
      </h4>
      <div className="pl-1 space-y-0.5">{children}</div>
      <hr className="my-2 opacity-40" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <p className="text-sm">
      <span className="font-medium">{label}:</span> {value || "-"}
    </p>
  );
}

function renderMeal(label: string, meal: any) {
  if (!meal) return null;
  return (
    <p className="text-sm">
      {label}: {meal.eaten ? `Yes (${meal.coveredBy || "-"})` : "No"}
    </p>
  );
}
