import {
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
  MealFields,
} from "@/app/types/DailyLog";
import { Plane, Briefcase, Hotel, FileText, MapPin, Clock } from "lucide-react";

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 text-muted-foreground uppercase tracking-widest text-[11px] font-bold">
      {icon}
      {title}
    </div>
  );
}

function MealBadge({ label, meal }: { label: string; meal: MealFields }) {
  if (!meal?.eaten) return null;

  let variantClass = "bg-muted text-muted-foreground border-border";
  if (meal.coveredBy === "company")
    variantClass =
      "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
  else if (meal.coveredBy === "employee")
    variantClass =
      "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
  else if (meal.coveredBy === "included in accommodation")
    variantClass =
      "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  else if (meal.coveredBy === "partner")
    variantClass =
      "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800";

  return (
    <div
      className={`px-2.5 py-1.5 rounded-md text-xs border ${variantClass} flex flex-col items-start min-w-[80px]`}
    >
      <span className="font-bold">{label}</span>
      <span className="text-[10px] opacity-80 capitalize mt-0.5">
        {meal.coveredBy}
      </span>
    </div>
  );
}

export function TravelSection({ logs }: { logs: TravelLog[] }) {
  if (logs.length === 0) return null;
  return (
    <div>
      <SectionHeader title="Travel" icon={<Plane className="h-4 w-4" />} />
      {logs.map((t) => (
        <div
          key={t._id.toString()}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4 last:mb-0 border-l-2 border-blue-500/20 pl-4 py-1"
        >
          <div className="col-span-1 sm:col-span-2 font-semibold text-foreground text-base">
            {t.travelReason || "Travel"}
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
              Route
            </div>
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {t.departureLocation}{" "}
              <span className="text-muted-foreground">→</span> {t.destination}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
              Details
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-muted px-2 py-0.5 rounded text-xs capitalize font-medium">
                {t.vehicleType}
              </span>
              {t.distance && <span className="text-xs">{t.distance} km</span>}
              {t.isRoundTrip && (
                <span className="text-xs italic text-muted-foreground">
                  (Round Trip)
                </span>
              )}
            </div>
          </div>

          {(t.startTime || t.endTime) && (
            <div className="space-y-1 col-span-1 sm:col-span-2">
              <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                Time
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {t.startTime || "?"} - {t.endTime || "?"}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function WorkSection({ logs }: { logs: WorkTimeLog[] }) {
  if (logs.length === 0) return null;
  return (
    <div>
      <SectionHeader
        title="Work Time"
        icon={<Briefcase className="h-4 w-4" />}
      />
      {logs.map((w) => (
        <div
          key={w._id.toString()}
          className="text-sm mb-4 last:mb-0 border-l-2 border-orange-500/20 pl-4 py-1"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded text-xs font-semibold border border-orange-200 dark:border-orange-800">
              {w.startTime} - {w.endTime}
            </span>
          </div>
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {w.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AccommodationSection({ logs }: { logs: AccommodationLog[] }) {
  if (logs.length === 0) return null;
  return (
    <div>
      <SectionHeader
        title="Accommodation & Meals"
        icon={<Hotel className="h-4 w-4" />}
      />
      {logs.map((a) => (
        <div
          key={a._id.toString()}
          className="text-sm border-l-2 border-purple-500/20 pl-4 py-1 mb-4 last:mb-0"
        >
          {a.accommodationType && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground text-base">
                {a.accommodationType}
              </span>
              {a.accommodationCoveredBy && (
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                  Paid by {a.accommodationCoveredBy}
                </span>
              )}
              {a.overnightStay === "yes" && (
                <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800 font-medium">
                  Overnight Stay
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <MealBadge label="Breakfast" meal={a.meals.breakfast} />
            <MealBadge label="Lunch" meal={a.meals.lunch} />
            <MealBadge label="Dinner" meal={a.meals.dinner} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdditionalSection({ logs }: { logs: AdditionalLog[] }) {
  if (logs.length === 0) return null;
  return (
    <div>
      <SectionHeader
        title="Notes & Files"
        icon={<FileText className="h-4 w-4" />}
      />
      {logs.map((add) => (
        <div
          key={add._id.toString()}
          className="text-sm border-l-2 border-gray-500/20 pl-4 py-1 mb-4 last:mb-0"
        >
          {add.notes && (
            <p className="text-foreground/80 mb-3 italic">"{add.notes}"</p>
          )}

          {add.uploadedFiles?.length > 0 && (
            <ul className="space-y-2">
              {add.uploadedFiles.map((f, i) => (
                <li key={i}>
                  <a
                    href={f.url}
                    target="_blank"
                    className="text-primary hover:underline text-xs flex items-center gap-2 font-medium transition-colors"
                  >
                    <div className="bg-primary/10 p-1 rounded">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {f.name}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({Math.round(f.size / 1024)} KB)
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
