"use client";

import { useUser } from "@/components/providers/UserProvider";
import ActiveTripCard from "@/components/trip/ActiveTripCard";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTripStore } from "@/lib/store/useTripStore";

export default function Dashboard() {
  const user = useUser();
  const router = useRouter();

  const trips = useTripStore((s) => s.trips);
  const initialized = useTripStore((s) => s.initialized);
  const setTrips = useTripStore((s) => s.setTrips);

  const tripIds = useMemo(() => user?.activeTrips || [], [user]);

  useEffect(() => {
    if (initialized) return;

    async function loadTrips() {
      if (tripIds.length === 0) {
        setTrips([]);
        return;
      }

      const res = await fetch(`/api/trips?ids=${tripIds.join(",")}`);
      const data = await res.json();

      if (data.success && data.trips) {
        setTrips(data.trips);
      }
    }

    loadTrips();
  }, [initialized, tripIds, setTrips]);

  const tripList = Object.values(trips);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header + Button Row */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <Button
          className="w-full sm:w-auto"
          onClick={() => router.push("/newTrip")}
        >
          Start New Trip
        </Button>
      </div>

      {/* Active Trips */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Active Trips</h2>

        <div id="active-trips" className="flex flex-wrap gap-4">
          {tripList.length > 0 ? (
            tripList.map((trip) => (
              <ActiveTripCard key={trip._id} trip={trip} />
            ))
          ) : (
            <div className="text-muted-foreground">
              {!initialized ? "Loading..." : "No active trips"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
