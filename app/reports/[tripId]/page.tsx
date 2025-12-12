"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DailyLogFormState,
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
  UploadedFile,
} from "@/app/types/DailyLog";
import { Trip } from "@/app/types/Trip";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import DownloadReportButton from "@/components/trip/DownloadReportButton";
import { effectiveLogForUser, formatMeals } from "@/lib/utils/dailyLogHelpers";

interface UserDetail {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  identityNumber: string;
  homeAddress: any;
  workAddress: any;
}

export default function ReportPage() {
  const { tripId } = useParams();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [logs, setLogs] = useState<DailyLogFormState[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tripRes, logsRes] = await Promise.all([
          fetch(`/api/trips/${tripId}`),
          fetch(`/api/daily-logs?tripId=${tripId}`),
        ]);

        const tripData = await tripRes.json();
        const logsData = await logsRes.json();

        if (!tripData.success) throw new Error("Trip not found");

        setTrip(tripData.trip);
        setLogs(logsData.logs || []);

        const attendantIds =
          tripData.trip.attendants?.map((a: any) => a.userId) || [];
        if (attendantIds.length > 0) {
          const userRes = await fetch("/api/users/lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: attendantIds, detailed: true }),
          });
          const userData = await userRes.json();

          const formattedUsers = attendantIds.map((id: string) => {
            const u = userData.users[id];
            const details = u?.employeeDetail || {};
            return {
              id: id,
              name: u?.name || "Unknown User",
              jobTitle: details.jobTitle || "-",
              department: details.department || "-",
              identityNumber: details.identityNumber || "-",
              homeAddress: details.homeAddress,
              workAddress: details.workAddress,
            };
          });
          setUsers(formattedUsers);
        }
      } catch (error) {
        console.error("Failed to load report data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tripId]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  if (!trip)
    return (
      <div className="p-10 text-center text-destructive">Trip not found.</div>
    );

  const ModuleTable = ({
    title,
    type,
    renderContent,
  }: {
    title: string;
    type: string;
    renderContent: (log: DailyLogFormState) => React.ReactNode;
  }) => {
    const filteredLogs = logs.filter(
      (l) => (l.itemType || "additional") === type,
    );
    if (filteredLogs.length === 0) return null;

    const logsByDateUser: Record<
      string,
      Record<string, DailyLogFormState[]>
    > = {};
    const dates = new Set<string>();

    filteredLogs.forEach((log) => {
      const dateKey = log.dateTime.split("T")[0];
      dates.add(dateKey);
      if (!logsByDateUser[dateKey]) logsByDateUser[dateKey] = {};

      const involvedUsers = new Set([log.userId, ...(log.appliedTo || [])]);
      involvedUsers.forEach((uid) => {
        if (!logsByDateUser[dateKey][uid]) logsByDateUser[dateKey][uid] = [];
        logsByDateUser[dateKey][uid].push(log);
      });
    });

    const sortedDates = Array.from(dates).sort();

    return (
      <div className="mb-8 break-inside-avoid">
        <h3 className="text-lg font-bold mb-3 text-primary flex items-center gap-2">
          {title}
        </h3>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3 w-32 border-r border-border">Date</th>
                {users.map((u) => (
                  <th
                    key={u.id}
                    className="px-4 py-3 border-r border-border last:border-none min-w-[200px]"
                  >
                    {u.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedDates.map((date) => (
                <tr key={date} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium bg-muted/20 border-r border-border align-top">
                    {new Date(date).toLocaleDateString()}
                  </td>
                  {users.map((user) => {
                    let userLogs = logsByDateUser[date]?.[user.id];
                    
                    // For worktime, use effective log computation
                    if (type === "worktime" && userLogs) {
                      const allWorktimeLogs = filteredLogs.filter(
                        (l) => l.itemType === "worktime"
                      ) as WorkTimeLog[];
                      const effectiveLog = effectiveLogForUser(date, user.id, allWorktimeLogs);
                      userLogs = effectiveLog ? [effectiveLog] : [];
                    }
                    
                    return (
                      <td
                        key={user.id}
                        className="px-4 py-3 border-r border-border last:border-none align-top"
                      >
                        {userLogs && userLogs.length > 0 ? (
                          <div className="space-y-4">
                            {userLogs.map((log, idx) => (
                              <div key={idx} className="space-y-1">
                                {renderContent(log)}
                                {/* Dosyalar / Resimler */}
                                {renderAttachments(log)}
                                {idx !== userLogs.length - 1 && (
                                  <hr className="my-2 border-dashed border-border" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAttachments = (log: DailyLogFormState) => {
    const files = [
      ...(log.files || []),
      ...((log as AdditionalLog).uploadedFiles || []),
    ];
    if (files.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-1 gap-2">
        {files.map((file, idx) => {
          const isImage =
            file.type.startsWith("image/") ||
            file.url.match(/\.(jpeg|jpg|gif|png)$/i);
          if (isImage) {
            return (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden border border-border bg-background"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-auto max-h-48 object-contain"
                />
                <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] p-1 truncate px-2">
                  {file.name}
                </div>
              </div>
            );
          }
          return (
            <a
              key={idx}
              href={file.url}
              target="_blank"
              className="flex items-center gap-2 p-2 border border-border rounded hover:bg-accent transition-colors bg-card"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span className="truncate text-xs text-foreground underline decoration-dotted">
                {file.name}
              </span>
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:p-0 print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Trip
        </Button>
        <div className="flex flex-wrap gap-2">
          <DownloadReportButton trip={trip} logs={logs} />
        </div>
      </div>
      <div className="max-w-[210mm] mx-auto bg-card border border-border shadow-lg rounded-xl p-8 md:p-12 print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none">
        <div className="border-b border-border pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {trip.basicInfo.title}
              </h1>
              <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Trip Report
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg text-sm grid grid-cols-1 md:grid-cols-2 gap-4 border border-border">
            <div>
              <span className="font-semibold block text-foreground mb-1">
                Date Range
              </span>
              {new Date(trip.basicInfo.startDate).toLocaleDateString()} —{" "}
              {trip.basicInfo.endDate
                ? new Date(trip.basicInfo.endDate).toLocaleDateString()
                : "Ongoing"}
            </div>
            <div>
              <span className="font-semibold block text-foreground mb-1">
                Destination
              </span>
              {[trip.basicInfo.country, trip.basicInfo.resort]
                .filter(Boolean)
                .join(", ")}
            </div>
            {trip.basicInfo.description && (
              <div className="md:col-span-2">
                <span className="font-semibold block text-foreground mb-1">
                  Description
                </span>
                <p className="text-muted-foreground">
                  {trip.basicInfo.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-bold mb-3 text-primary">
            Participant Details
          </h3>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-2 border-r border-border w-1/4">
                    Detail
                  </th>
                  {users.map((u) => (
                    <th
                      key={u.id}
                      className="px-4 py-2 border-r border-border last:border-none"
                    >
                      {u.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { label: "Position", key: "jobTitle" },
                  { label: "Department", key: "department" },
                  { label: "ID Number", key: "identityNumber" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2 font-medium bg-muted/20 border-r border-border">
                      {row.label}
                    </td>
                    {users.map((u) => (
                      <td
                        key={u.id}
                        className="px-4 py-2 border-r border-border last:border-none"
                      >
                        {(u as any)[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-2 font-medium bg-muted/20 border-r border-border">
                    Home Address
                  </td>
                  {users.map((u) => (
                    <td
                      key={u.id}
                      className="px-4 py-2 border-r border-border last:border-none"
                    >
                      {[
                        u.homeAddress?.street,
                        u.homeAddress?.city,
                        u.homeAddress?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-2 font-medium bg-muted/20 border-r border-border">
                    Work Address
                  </td>
                  {users.map((u) => (
                    <td
                      key={u.id}
                      className="px-4 py-2 border-r border-border last:border-none"
                    >
                      {[
                        u.workAddress?.street,
                        u.workAddress?.city,
                        u.workAddress?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <ModuleTable
            title="1. Travel Records"
            type="travel"
            renderContent={(log) => {
              const t = log as TravelLog;
              return (
                <div className="text-sm">
                  <div className="font-semibold text-foreground mb-1">
                    {t.travelReason || "Travel"}
                  </div>
                  <div className="text-muted-foreground">
                    {t.departureLocation} ➝ {t.destination}
                  </div>
                  {t.distance && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Distance: {t.distance} km
                    </div>
                  )}
                </div>
              );
            }}
          />

          <ModuleTable
            title="2. Work Time Records"
            type="worktime"
            renderContent={(log) => {
              const w = log as WorkTimeLog;
              return (
                <div className="text-sm">
                  <div className="font-mono text-xs bg-muted inline-block px-1.5 py-0.5 rounded mb-1 border border-border">
                    {w.startTime} - {w.endTime}
                  </div>
                  <div className="whitespace-pre-wrap text-muted-foreground">
                    {w.description}
                  </div>
                </div>
              );
            }}
          />

          <ModuleTable
            title="3. Accommodation & Meals"
            type="accommodation"
            renderContent={(log) => {
              const a = log as AccommodationLog;
              const mealsText = formatMeals(a);
              return (
                <div className="text-sm">
                  <div className="font-semibold text-foreground">
                    {a.accommodationType || "-"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <div>
                      Paid by:{" "}
                      <span className="capitalize">
                        {a.accommodationCoveredBy || "-"}
                      </span>
                    </div>
                    <div>
                      Overnight: {a.overnightStay === "yes" ? "Yes" : a.overnightStay === "no" ? "No" : "-"}
                    </div>
                    {mealsText && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="font-semibold mb-1">Meals:</div>
                        <div className="whitespace-pre-line text-xs">
                          {mealsText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />

          <ModuleTable
            title="4. Additional Notes & Files"
            type="additional"
            renderContent={(log) => {
              const ad = log as AdditionalLog;
              return (
                <div className="text-sm italic text-muted-foreground">
                  {ad.notes || "No notes."}
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
