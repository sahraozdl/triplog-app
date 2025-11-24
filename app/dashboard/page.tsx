"use client";

import { useUser } from "@/components/providers/UserProvider";
import ActiveTripCard from "@/components/trip/ActiveTripCard";
import { useEffect, useMemo, useState } from "react";
import { TripBasicInfo } from "@/app/types/Trip";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const user = useUser();
  const tripIds = useMemo(() => user?.activeTrips || [], [user]);
  const router = useRouter();

  const [trips, setTrips] = useState<TripBasicInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      if (tripIds.length === 0) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/trips?ids=${tripIds.join(",")}`);
      const data = await res.json();
      setTrips(data.trips);
      setLoading(false);
    }

    loadTrips();
  }, [tripIds]);

  return (
    <div>
      <h1>Dashboard</h1>
      <Button onClick={() => router.push("/newTrip")}>Start a new trip</Button>
      {loading && <div>Loading trips...</div>}

      <div className="flex flex-row gap-4" id="active-trips">
        {trips.length > 0 ? (
          trips.map((trip) => (
            <ActiveTripCard key={trip._id} trip={trip} />
          ))
        ) : (
          <div>No active trips</div>
        )}
      </div>      
    </div>
  );
}
