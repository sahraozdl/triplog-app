"use client";

import { useTripStore } from "@/lib/store/useTripStore";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyLogFormState } from "@/app/types/DailyLog";
import DailyLogsList from "@/components/trip/DailyLogsList";
import AttendantsList from "@/components/trip/AttendantsList";
import { TripAttendant } from "@/app/types/Trip";
import DownloadReportButton from "@/components/trip/DownloadReportButton";

export default function TripDetailPage() {
  const router = useRouter();
  const { tripId } = useParams();
  const { updateTrip } = useTripStore();
  const [loading, setLoading] = useState(false);

  const trip = useTripStore((state) => state.getTrip(tripId as string));
  const [logs, setLogs] = useState<DailyLogFormState[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/daily-logs?tripId=${tripId}`);

        if (!res.ok) {
          console.error("Logs could not be fetched, Status:", res.status);
          setLogs([]);
          return;
        }

        const data = await res.json();
        setLogs((data.logs || []) as DailyLogFormState[]);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
        setLogs([]);
      }
    }

    if (tripId) {
      fetchLogs();
    }
  }, [tripId]);

  async function handleEndTrip() {
    try {
      await fetch(`/api/trips/${tripId}/end`, { method: "POST" });
      useTripStore.getState().removeTrip(tripId as string);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to end trip", error);
    }
  }

  useEffect(() => {
    if (trip) return;

    async function fetchTrip() {
      setLoading(true);
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) updateTrip(data.trip);
        }
      } catch (e) {
        console.error("Trip load failed", e);
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId, trip, updateTrip]);

  if (!trip || loading)
    return (
      <div className="p-6 text-center text-lg text-muted-foreground">
        Loading trip details...
      </div>
    );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          {trip.basicInfo.title}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {trip.basicInfo.description}
        </p>
      </div>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Start Date:</span>{" "}
          {trip.basicInfo.startDate
            ? new Date(trip.basicInfo.startDate).toLocaleDateString()
            : "-"}
        </p>
        <p>
          <span className="font-medium text-foreground">End Date:</span>{" "}
          {trip.basicInfo.endDate
            ? new Date(trip.basicInfo.endDate).toLocaleDateString()
            : "Ongoing"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4 w-full sm:w-auto">
          <Button
            variant="destructive"
            className="flex-1 sm:flex-none"
            onClick={handleEndTrip}
          >
            End Trip
          </Button>

          <DownloadReportButton trip={trip} logs={logs} />
          <Button
            variant="outline"
            onClick={() => router.push(`/reports/${tripId}`)}
          >
            View Report
          </Button>
        </div>

        <Button
          className="w-full sm:w-auto"
          onClick={() => router.push(`/newDailyLog/${tripId}`)}
        >
          New Daily Log
        </Button>
      </div>

      <AttendantsList attendants={trip.attendants as TripAttendant[]} />

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">Daily Logs</h2>

        {logs.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg bg-muted/10">
            <p className="text-muted-foreground text-sm">
              No logs recorded yet.
            </p>
          </div>
        ) : (
          <DailyLogsList
            logs={logs}
            attendants={trip.attendants as TripAttendant[]}
          />
        )}
      </div>
    </div>
  );
}
