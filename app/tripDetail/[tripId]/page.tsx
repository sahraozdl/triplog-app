"use client";

import { useTripStore } from "@/lib/store/useTripStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyLogFormState } from "@/app/types/DailyLog";
import DailyLogsList from "@/components/trip/DailyLogsList";

export default function TripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  const router = useRouter();

  const { updateTrip } = useTripStore();
  const [loading, setLoading] = useState(false);

  const trip = useTripStore((state) => state.getTrip(params.tripId));
  const [logs, setLogs] = useState<DailyLogFormState[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const res = await fetch(`/api/daily-logs?tripId=${params.tripId}`);
      const data = await res.json();
      setLogs(data.logs as DailyLogFormState[]);
    }
    fetchLogs();
  }, [params.tripId]);

  async function handleEndTrip() {
    await fetch(`/api/trips/${params.tripId}/end`, {
      method: "POST",
    });
    useTripStore.getState().removeTrip(params.tripId);
    router.push("/dashboard");
  }

  useEffect(() => {
    if (trip) return;

    async function fetchTrip() {
      setLoading(true);
      const res = await fetch(`/api/trips/${params.tripId}`);
      const data = await res.json();

      if (data.success) {
        updateTrip(data.trip);
      }
      setLoading(false);
    }

    fetchTrip();
  }, [params.tripId, trip, updateTrip]);

  if (!trip || loading) return <div>Loading…</div>;

  return (
    <div>
      <h1>{trip.basicInfo.title}</h1>
      <p>{trip.basicInfo.description}</p>
      <Button onClick={handleEndTrip}>End Trip</Button>
      <Button onClick={() => router.push(`/newDailyLog/${params.tripId}`)}>
        New Daily Log
      </Button>
      <DailyLogsList logs={logs} />
    </div>
  );
}
