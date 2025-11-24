import { Trip } from "@/app/types/Trip";
import Calendar05 from "@/components/calendar-05";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import AttendantsList from "@/components/trip/AttendantsList";
import UserFilter from "@/components/trip/UserFilter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  const { tripId } = params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/trips/${tripId}`,
    { cache: "no-store" }
  );

  const data = (await response.json()) as { success: boolean; trip: Trip };
  const trip = data.trip;

  if (!trip) {
    return <div className="p-6">Trip not found.</div>;
  }

  return (
    <div className="p-6 space-y-10">
      <section className="space-y-2">
        <h1 className="text-4xl font-bold">{trip.basicInfo.title}</h1>
        <p className="text-gray-600">{trip.basicInfo.description}</p>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <p>
            <strong>Start:</strong> {trip.basicInfo.startDate}
          </p>
          <p>
            <strong>End:</strong> {trip.basicInfo.endDate || "Ongoing"}
          </p>
          <p>
            <strong>Country:</strong> {trip.basicInfo.country}
          </p>
          <p>
            <strong>Resort:</strong> {trip.basicInfo.resort || "-"}
          </p>
          <p>
            <strong>Origin:</strong> {trip.basicInfo.origin}
          </p>
          <p>
            <strong>Destination:</strong> {trip.basicInfo.primaryDestination}
          </p>
        </div>

        <div className="pt-4">
          <Link href={`/newDailyLog/${tripId}`}>
            <Button>Enter Daily Log</Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Attendants</h2>
        <AttendantsList attendants={trip.attendants} />

        <InviteColleaguesDialog
          mode="invite"
          tripId={tripId}
          attendants={trip.attendants.map((a) => a.userId)}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Filter Logs</h2>
        <div className="grid grid-cols-2 gap-6">
          <Calendar05 />
          <UserFilter attendants={trip.attendants} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Daily Logs</h2>
      </section>
    </div>
  );
}
