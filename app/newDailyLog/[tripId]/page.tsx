"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import TravelForm from "@/components/forms/TravelForm";
import WorkTimeForm from "@/components/forms/WorkTimeForm";
import AccommodationMealsForm from "@/components/forms/AccommodationMealsForm";
import AdditionalForm from "@/components/forms/AdditionalForm";

import DateAndTimePicker from "@/components/form-elements/DateAndTimePicker";
import { Button } from "@/components/ui/button";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import { useAppUser } from "@/components/providers/AppUserProvider";

import {
  TravelLog,
  AccommodationLog,
  AdditionalLog,
  WorkTimeLog,
} from "@/app/types/DailyLog";
import { Trip, TripAttendant } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";

type TravelFormState = Omit<
  TravelLog,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "files"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
  | "itemType"
>;
type WorkTimeFormState = Omit<
  WorkTimeLog,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "files"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
  | "itemType"
>;
type AccommodationFormState = Omit<
  AccommodationLog,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "files"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
  | "itemType"
>;
type AdditionalFormState = Omit<
  AdditionalLog,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "files"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
  | "itemType"
>;

export default function DailyLogPage() {
  const router = useRouter();
  const { tripId } = useParams();
  const user = useAppUser();
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
        if (data.success) updateTrip(data.trip);
      } catch (err) {
        console.error("Failed to load trip", err);
      } finally {
        setLoadingTrip(false);
      }
    }

    loadTrip();
  }, [tripId, trip, updateTrip]);

  const [dateTime, setDateTime] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [travel, setTravel] = useState<TravelFormState>({
    travelReason: "",
    vehicleType: "",
    departureLocation: "",
    destination: "",
    distance: null,
    isRoundTrip: false,
    startTime: "",
    endTime: "",
  });

  const [workTime, setWorkTime] = useState<WorkTimeFormState>({
    startTime: "",
    endTime: "",
    description: "",
  });

  const [accommodationMeals, setAccommodationMeals] =
    useState<AccommodationFormState>({
      accommodationType: "",
      accommodationCoveredBy: "",
      overnightStay: "",
      meals: {
        breakfast: { eaten: false, coveredBy: "" },
        lunch: { eaten: false, coveredBy: "" },
        dinner: { eaten: false, coveredBy: "" },
      },
    });

  const [additional, setAdditional] = useState<AdditionalFormState>({
    notes: "",
    uploadedFiles: [],
  });

  function cancel() {
    router.push(`/tripDetail/${tripId}`);
  }

  const createLogRequest = (itemType: string, data: any, isoDate: string) => {
    const body = {
      itemType,
      tripId,
      userId: loggedInUserId,
      dateTime: isoDate,
      appliedTo,
      isGroupSource: appliedTo.length > 0,

      data,

      files: [],
    };

    return fetch("/api/daily-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  async function saveDailyLog(e: React.FormEvent) {
    e.preventDefault();

    if (!dateTime) {
      alert("Please select a date and time for this entry at the top.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);
    const isoDateString = dateTime;
    const requests: Promise<Response>[] = [];

    const isTravelFilled =
      travel.travelReason ||
      travel.vehicleType ||
      travel.destination ||
      travel.departureLocation ||
      (travel.distance && travel.distance > 0) ||
      travel.startTime ||
      travel.endTime;

    if (isTravelFilled) {
      requests.push(createLogRequest("travel", travel, isoDateString));
    }

    const isWorkFilled =
      workTime.description || workTime.startTime || workTime.endTime;

    if (isWorkFilled) {
      requests.push(createLogRequest("worktime", workTime, isoDateString));
    }

    const isMealsFilled =
      accommodationMeals.meals.breakfast.eaten ||
      accommodationMeals.meals.lunch.eaten ||
      accommodationMeals.meals.dinner.eaten;

    const isAccFilled =
      accommodationMeals.accommodationType ||
      accommodationMeals.overnightStay !== "";

    if (isAccFilled || isMealsFilled) {
      requests.push(
        createLogRequest("accommodation", accommodationMeals, isoDateString),
      );
    }

    const isAdditionalFilled =
      additional.notes || additional.uploadedFiles.length > 0;

    if (isAdditionalFilled) {
      requests.push(createLogRequest("additional", additional, isoDateString));
    }

    if (requests.length === 0) {
      alert(
        "Please fill in at least one section (Travel, Work, Meals, etc.) to save.",
      );
      setIsSaving(false);
      return;
    }

    try {
      const responses = await Promise.all(requests);

      const failed = responses.filter((r) => !r.ok);
      if (failed.length > 0) {
        for (const res of failed) {
          try {
            const errorData = await res.json();
            console.error("Error in API:", errorData);
          } catch (jsonError) {
            console.error(
              "Error in API (JSON not readable):",
              res.status,
              res.statusText,
            );
          }
        }
        throw new Error("Some logs failed to save. Please check your inputs.");
      }
      invalidate();
      router.push(`/tripDetail/${tripId}`);
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving logs.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loadingTrip)
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading trip data...
      </div>
    );

  return (
    <div className="w-full flex justify-center px-4 py-8 bg-background min-h-screen">
      <div className="w-full max-w-4xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground py-4">
              Daily Log Entry
            </h1>
            <p className="text-muted-foreground">
              Record your activities, expenses, and meals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {attendants.length > 1 && (
              <Button variant="outline" onClick={() => setInviteOpen(true)}>
                {appliedTo.length > 0
                  ? `${appliedTo.length} Colleagues Selected`
                  : "Invite Colleagues"}
              </Button>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={cancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={saveDailyLog} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </div>
        </div>

        {/* GLOBAL DATE SELECTOR */}
        <div className="bg-background p-6 rounded-xl border border-border shadow-sm space-y-2">
          <label className="text-sm font-semibold text-foreground">
            Date of Entry
          </label>
          <div className="max-w-sm">
            <DateAndTimePicker
              value={dateTime ? new Date(dateTime) : undefined}
              onChange={(date) => setDateTime(date ? date.toISOString() : "")}
            />
          </div>
        </div>

        {/* FORMS CONTAINER */}
        <form
          id="dailyLogForm"
          onSubmit={saveDailyLog}
          className="flex flex-col gap-6"
        >
          {/* 1. Travel Form (Accordion) */}
          <TravelForm value={travel} onChange={setTravel} />

          {/* 2. Work Time Form (Accordion) */}
          <WorkTimeForm value={workTime} onChange={setWorkTime} />

          {/* 3. Accommodation & Meals Form (Accordion) */}
          <AccommodationMealsForm
            value={accommodationMeals}
            onChange={setAccommodationMeals}
          />

          {/* 4. Additional Form (Accordion) */}
          <AdditionalForm value={additional} onChange={setAdditional} />
        </form>

        {/* INVITE DIALOG */}
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
