import { Trip } from "@/app/types/Trip";

export default async function TripDetailPage({ params }: { params: { tripId: string } }) {
  const { tripId } = params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const res = await fetch(`${baseUrl}/api/trips/${tripId}`, { cache: "no-store" });
  const data = await res.json();

  if (!data.success || !data.trip) {
    return <div className="p-6 text-red-500">Trip not found.</div>;
  }

  const trip = data.trip as Trip;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold">{trip.basicInfo.title}</h1>
      <p className="text-gray-600">{trip.basicInfo.description}</p>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <p><strong>Start:</strong> {trip.basicInfo.startDate}</p>
        <p><strong>End:</strong> {trip.basicInfo.endDate || "Ongoing"}</p>
        <p><strong>Country:</strong> {trip.basicInfo.country || "-"}</p>
        <p><strong>Resort:</strong> {trip.basicInfo.resort || "-"}</p>
        <p><strong>Origin:</strong> {trip.basicInfo.origin}</p>
        <p><strong>Destination:</strong> {trip.basicInfo.primaryDestination}</p>
      </div>
    </div>
  );
}
