import TripDetailClient from "./TripDetailClient";
import { Trip } from "@/app/types/Trip";

export default async function TripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  const { tripId } = params;

  const response = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
  const data = (await response.json()) as { success: boolean; trip: Trip };
  const trip = data.trip;

  return <TripDetailClient trip={trip} tripId={tripId} />;
}
