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

export default function DailyLogPage() {
  const router = useRouter();
  const { tripId } = useParams();
  const user = useUser();
  const loggedInUserId = user.user?.userId;

  const [attendants, setAttendants] = useState<TripAttendant[]>([]);
  const [loadingTrip, setLoadingTrip] = useState(true);

  useEffect(() => {
    async function loadTrip() {
      try {
        const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
        const data = (await res.json()) as { success: boolean; trip: Trip };

        if (data.success) {
          setAttendants(data.trip.attendants);
        }
      } catch (err) {
        console.error("Failed to load trip", err);
      } finally {
        setLoadingTrip(false);
      }
    }

    loadTrip();
  }, [tripId]);

  const [travel, setTravel] = useState<TravelFields>({
    travelReason: "",
    vehicleType: "",
    departureLocation: "",
    destination: "",
    distance: null,
    isRoundTrip: false,
    dateTime: { date: "", time: "" },
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
    if (data.success) router.push(`/daily-logs/${data.log._id}`);
  }

  if (loadingTrip) return <div className="p-6">Loading trip data...</div>;

  return (
    <div className="flex flex-col justify-between items-center px-12 py-4 w-full">
      <div className="flex flex-row justify-between items-center gap-4 py-6 w-3/4">
        <h1 className="text-4xl font-black">Daily Log Entry</h1>

        <div className="flex flex-row gap-4">
          {attendants.length > 1 && (
            <Button
              variant="outline"
              type="button"
              onClick={() => setInviteOpen(true)}
            >
              Invite Colleagues
            </Button>
          )}

          <Button variant="outline" type="button" onClick={cancel}>
            Cancel
          </Button>
          <Button variant="outline" type="submit" form="dailyLogForm">
            Save
          </Button>
        </div>
      </div>

      <form
        id="dailyLogForm"
        className="flex flex-col gap-4 w-full"
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
  );
}
