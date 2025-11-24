import { Trip } from "@/app/types/Trip";

export default async function TripDetailPage({ params }: { params: { tripId?: string } }) {
  const tripId = params?.tripId;
  if (!tripId) return <div className="p-6">Invalid trip ID</div>;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const res = await fetch(`${baseUrl}/api/trips/${tripId}`, { cache: "no-store" });
  const { trip } = (await res.json()) as { trip: Trip | null };

  // Dynamic import to avoid hydration errors
  const TripDetailClient = (await import("./TripDetailClient")).default;

  return <TripDetailClient trip={trip} tripId={tripId} />;
}
