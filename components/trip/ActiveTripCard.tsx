import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Trip } from "@/app/types/Trip";

export default function ActiveTripCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  console.log(trip);

  const handleViewTrip = () => {
    router.push(`/tripDetail/${trip._id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{trip.basicInfo.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{trip.basicInfo.startDate || "Start Date"}</p>
        <p>{trip.basicInfo.endDate || "End Date"}</p>
        <p>{trip.basicInfo.country}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleViewTrip}>View Trip</Button>
      </CardFooter>
    </Card>
  );
}
