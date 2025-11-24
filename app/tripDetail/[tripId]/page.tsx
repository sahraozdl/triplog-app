import TripDetailClient from "./TripDetailClient";
import { Trip } from "@/app/types/Trip";

export default async function TripDetailPage({ params }: { params: { tripId?: string } }) {
  const tripId = params?.tripId;

  if (!tripId) return <div className="p-6">Invalid trip ID</div>;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
const response = await fetch(`${baseUrl}/api/trips/${tripId}`, { cache: "no-store" });

  const data = (await response.json()) as { success: boolean; trip: Trip | null };
  const trip = data.trip ?? null;

  return <TripDetailClient trip={trip} tripId={tripId} />;
}
