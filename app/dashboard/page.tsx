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
        setTrips([]); // boş
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
    <div>
      <h1>Dashboard</h1>

      <Button onClick={() => router.push("/newTrip")}>Start a new trip</Button>

      <div className="flex flex-row gap-4 mt-4" id="active-trips">
        {tripList.length > 0 ? (
          tripList.map((trip) => <ActiveTripCard key={trip._id} trip={trip} />)
        ) : (
          <div>No active trips</div>
        )}
      </div>
    </div>
  );
}
