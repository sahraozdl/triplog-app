"use client";

import { useTripStore } from "@/lib/store/useTripStore";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyLogFormState } from "@/app/types/DailyLog";
import DailyLogsList from "@/components/trip/DailyLogsList";

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

      if (data.success) {
        updateTrip(data.trip);
      }
      setLoading(false);
    }

    fetchTrip();
  }, [tripId, trip, updateTrip]);

  if (!trip || loading) return <div>Loading…</div>;

  return (
    <div className="flex flex-col gap-4">
      <h1>{trip.basicInfo.title}</h1>
      <p>{trip.basicInfo.description}</p>
      <div className="flex flex-row gap-4">
        <Button className="border-4 border-input" onClick={handleEndTrip}>
          End Trip
        </Button>
        <Button
          className="border-4 border-input"
          onClick={() => router.push(`/newDailyLog/${tripId}`)}
        >
          New Daily Log
        </Button>
      </div>
      <div>
        <DailyLogsList logs={logs} />
      </div>
    </div>
  );
}
