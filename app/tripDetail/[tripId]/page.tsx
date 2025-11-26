"use client";

import { useTripStore } from "@/lib/store/useTripStore";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyLogFormState } from "@/app/types/DailyLog";
import DailyLogsList from "@/components/trip/DailyLogsList";
import AttendantsList from "@/components/trip/AttendantsList";
import { TripAttendant } from "@/app/types/Trip";
import UserFilter from "@/components/trip/UserFilter";

export default function TripDetailPage() {
  const router = useRouter();
  const { tripId } = useParams();
  const { updateTrip } = useTripStore();
  const [loading, setLoading] = useState(false);

  const trip = useTripStore((state) => state.getTrip(tripId as string));
  const [logs, setLogs] = useState<DailyLogFormState[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const res = await fetch(`/api/daily-logs?tripId=${tripId}`);
      const data = await res.json();
      setLogs(data.logs as DailyLogFormState[]);
    }
    fetchLogs();
  }, [tripId]);

  async function handleEndTrip() {
    await fetch(`/api/trips/${tripId}/end`, {
      method: "POST",
    });
    useTripStore.getState().removeTrip(tripId as string);
    router.push("/dashboard");
  }

  useEffect(() => {
    if (trip) return;

    async function fetchTrip() {
      setLoading(true);
      const res = await fetch(`/api/trips/${tripId}`);
      const data = await res.json();

      if (data.success) updateTrip(data.trip);

      setLoading(false);
    }

    fetchTrip();
  }, [tripId, trip, updateTrip]);

  if (!trip || loading)
    return <div className="p-6 text-center text-lg">Loading…</div>;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold">
          {trip.basicInfo.title}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {trip.basicInfo.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row justify-between  gap-4 ">
        <Button
          variant="destructive"
          className="w-1/2 sm:w-auto"
          onClick={handleEndTrip}
        >
          End Trip
        </Button>
        <Button
          className="w-1/2 sm:w-auto"
          onClick={() => router.push(`/newDailyLog/${tripId}`)}
        >
          New Daily Log
        </Button>
      </div>

      <AttendantsList attendants={trip.attendants as TripAttendant[]} />

      <UserFilter attendants={trip.attendants as TripAttendant[]} />

      {/* Logs Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Daily Logs</h2>

        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No logs yet.</p>
        ) : (
          <DailyLogsList logs={logs} />
        )}
      </div>
    </div>
  );
}
