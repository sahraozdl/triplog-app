"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TravelForm from "@/components/forms/TravelForm";
import WorkTimeForm from "@/components/forms/WorkTimeForm";
import AccommodationMealsForm from "@/components/forms/AccommodationMealsForm";
import AdditionalForm from "@/components/forms/AdditionalForm";
import { Button } from "@/components/ui/button";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import { useUser } from "@/components/providers/UserProvider";

import {
  TravelFields,
  AccommodationMealsFields,
  AdditionalFields,
  WorkTimeFields,
} from "@/app/types/DailyLog";
import { Trip, TripAttendant } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";

export default function DailyLogPage() {
  const router = useRouter();
  const { tripId } = useParams();
  const user = useUser();
  const loggedInUserId = user?.userId;

  const { getTrip, updateTrip, invalidate } = useTripStore();

  const trip = getTrip(tripId as string);
  const attendants: TripAttendant[] = trip?.attendants ?? [];

  const [loadingTrip, setLoadingTrip] = useState(true);

  useEffect(() => {
    if (trip) {
      setLoadingTrip(false);
      return;
    }

    async function loadTrip() {
      try {
        const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
        const data = (await res.json()) as { success: boolean; trip: Trip };

        if (data.success) {
          updateTrip(data.trip);
        }
      } catch (err) {
        console.error("Failed to load trip", err);
      } finally {
        setLoadingTrip(false);
      }
    }

    loadTrip();
  }, [tripId, trip, updateTrip]);

  const [travel, setTravel] = useState<TravelFields>({
    travelReason: "",
    vehicleType: "",
    departureLocation: "",
    destination: "",
    distance: null,
    isRoundTrip: false,
    dateTime: { date: "", startTime: "", endTime: "" },
  });

  const [workTime, setWorkTime] = useState<WorkTimeFields>({
    startTime: "",
    endTime: "",
    description: "",
  });

  const [accommodationMeals, setAccommodationMeals] =
    useState<AccommodationMealsFields>({
      accommodationType: "",
      accommodationCoveredBy: "",
      overnightStay: "",
      meals: {
        breakfast: { eaten: false, coveredBy: "" },
        lunch: { eaten: false, coveredBy: "" },
        dinner: { eaten: false, coveredBy: "" },
      },
    });

  const [additional, setAdditional] = useState<AdditionalFields>({
    notes: "",
    uploadedFiles: [],
  });

  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  function cancel() {
    router.push(`/tripDetail/${tripId}`);
  }

  async function saveDailyLog(e: React.FormEvent) {
    e.preventDefault();

    const body = {
      date: new Date().toISOString(),
      tripId,
      userId: loggedInUserId,
      sharedFields: { travel, workTime, accommodationMeals, additional },
      personalFields: {},
      appliedTo,
      isGroupSource: appliedTo.length > 1,
    };

    const response = await fetch("/api/daily-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.success) {
      invalidate();
      router.push(`/tripDetail/${tripId}`);
    }
  }

  if (loadingTrip) return <div className="p-6">Loading trip data...</div>;

  return (
    <div className="w-full flex justify-center px-4 py-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
          <h1 className="text-3xl md:text-4xl font-black">Daily Log Entry</h1>

          <div className="flex flex-col sm:flex-row gap-3">
            {attendants.length > 1 && (
              <Button
                variant="outline"
                type="button"
                onClick={() => setInviteOpen(true)}
              >
                Invite Colleagues
              </Button>
            )}
            <div className="flex flex-row sm:items-center gap-3 w-full sm:w-auto sm:justify-end px-2">
              <Button
                variant="outline"
                type="button"
                onClick={cancel}
                className="w-1/2 sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                variant="outline"
                type="submit"
                form="dailyLogForm"
                className="w-1/2 sm:w-auto"
              >
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          id="dailyLogForm"
          className="flex flex-col gap-6"
          onSubmit={saveDailyLog}
        >
          <TravelForm value={travel} onChange={setTravel} />
          <WorkTimeForm value={workTime} onChange={setWorkTime} />
          <AccommodationMealsForm
            value={accommodationMeals}
            onChange={setAccommodationMeals}
          />
          <AdditionalForm value={additional} onChange={setAdditional} />
        </form>

        <InviteColleaguesDialog
          mode="select"
          attendants={attendants.map((a) => a.userId)}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          selected={appliedTo}
          onSelect={setAppliedTo}
        />
      </div>
    </div>
  );
}
