"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Trip } from "@/app/types/Trip";

export default function ActiveTripCard({ trip }: { trip: Trip }) {
  const router = useRouter();

  const handleViewTrip = () => {
    router.push(`/tripDetail/${trip._id}`);
  };

  return (
    <Card className="w-full max-w-full sm:max-w-sm md:max-w-md flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-semibold">
          {trip.basicInfo.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-1 text-sm sm:text-base">
        <p>
          <span className="font-medium">Start:</span>{" "}
          {trip.basicInfo.startDate || "—"}
        </p>
        <p>
          <span className="font-medium">End:</span>{" "}
          {trip.basicInfo.endDate || "—"}
        </p>
        <p>
          <span className="font-medium">Country:</span>{" "}
          {trip.basicInfo.country || "—"}
        </p>
      </CardContent>

      <CardFooter>
        <Button className="w-full sm:w-auto" onClick={handleViewTrip}>
          View Trip
        </Button>
      </CardFooter>
    </Card>
  );
}
