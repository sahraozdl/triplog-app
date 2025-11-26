import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { TripBasicInfo } from "@/app/types/Trip";

export default function ActiveTripCard({ trip }: { trip: TripBasicInfo }) {
  const router = useRouter();
  console.log(trip);

  const handleViewTrip = () => {
    router.push(`/tripDetail/${trip._id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{trip.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{trip.startDate || "Start Date"}</p>
        <p>{trip.endDate || "End Date"}</p>
        <p>{trip.country}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleViewTrip}>View Trip</Button>
      </CardFooter>
    </Card>
  );
}
