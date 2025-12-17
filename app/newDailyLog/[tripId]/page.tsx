"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import TravelForm from "@/components/forms/TravelForm";
import WorkTimeForm, {
  WorkTimeOverride,
} from "@/components/forms/WorkTimeForm";
import AccommodationMealsForm from "@/components/forms/AccommodationMealsForm";
import AdditionalForm from "@/components/forms/AdditionalForm";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth/AuthGuard";

import { UploadedFile } from "@/app/types/DailyLog";
import {
  TravelFormState,
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import { Trip, TripAttendant } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";
import { hasNonEmptyOverride } from "@/lib/utils/dailyLogHelpers";

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

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

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

  const [workTimeOverrides, setWorkTimeOverrides] = useState<
    Record<string, WorkTimeOverride>
  >({});

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
    router.push(`/trips/${tripId}`);
  }

  const createLogRequest = (
    itemType: string,
    data:
      | TravelFormState
      | WorkTimeFormState
      | AccommodationFormState
      | AdditionalFormState,
    isoDate: string,
    files: UploadedFile[] = [],
  ) => {
    const body = {
      itemType,
      tripId,
      userId: loggedInUserId,
      dateTime: isoDate,
      appliedTo,
      isGroupSource: appliedTo.length > 0,
      data,
      files,
    };

    return fetch("/api/daily-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  async function saveDailyLog(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDate) {
      alert("Please select a date for this entry.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);

    const [year, month, day] = selectedDate.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const isoDateString = utcDate.toISOString();

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
      requests.push(createLogRequest("travel", travel, isoDateString, []));
    }

    const isWorkFilled =
      workTime.description || workTime.startTime || workTime.endTime;

    if (isWorkFilled) {
      const myLogBody = {
        itemType: "worktime",
        tripId,
        userId: loggedInUserId,
        dateTime: isoDateString,
        appliedTo,
        isGroupSource: appliedTo.length > 0,
        data: workTime,
        files: [],
      };

      requests.push(
        fetch("/api/daily-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(myLogBody),
        }),
      );

      if (appliedTo.length > 0) {
        appliedTo.forEach((colleagueId) => {
          const override = workTimeOverrides[colleagueId];

          // Only create colleague log if override has at least one non-empty field
          if (!hasNonEmptyOverride(override)) {
            return;
          }

          const description = override?.description || workTime.description;
          const startTime = override?.startTime || workTime.startTime;
          const endTime = override?.endTime || workTime.endTime;

          const colleagueData = {
            description,
            startTime,
            endTime,
          };

          const colleagueBody = {
            itemType: "worktime",
            tripId,
            userId: colleagueId,
            dateTime: isoDateString,
            appliedTo: [],
            isGroupSource: false,
            data: colleagueData,
            files: [],
          };

          requests.push(
            fetch("/api/daily-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(colleagueBody),
            }),
          );
        });
      }
    }

    const isAccFilled =
      accommodationMeals.accommodationType ||
      accommodationMeals.overnightStay !== "" ||
      accommodationMeals.meals.breakfast.eaten;

    if (isAccFilled) {
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
      alert("Please fill in at least one section to save.");
      setIsSaving(false);
      return;
    }

    try {
      const responses = await Promise.all(requests);
      const failed = responses.some((r) => !r.ok);

      if (failed) {
        throw new Error("Some logs failed to save.");
      }

      invalidate();
      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving logs.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loadingTrip)
    return (
      <AuthGuard>
        <div className="p-6 text-center text-muted-foreground">
          Loading trip data...
        </div>
      </AuthGuard>
    );

  return (
    <AuthGuard>
      <div className="w-full flex justify-center px-4 py-8 bg-background min-h-screen">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header */}
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={saveDailyLog} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Entry"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Global Date */}
          <div
            className="bg-sidebar p-6 rounded-xl border border-border shadow-sm space-y-2 dark:border-gray-800 
        rounded-b-md max-w-full md:max-w-3/4 mx-auto
        px-4 md:px-8 py-4"
          >
            <div className="w-full flex flex-row items-center justify-between gap-2">
              <Label
                htmlFor="logDate"
                className="font-semibold text-foreground w-1/2"
              >
                Date
              </Label>
              <div className="group w-1/2">
                <Input
                  id="logDate"
                  type="date"
                  onClick={(e) => e.currentTarget.showPicker()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 h-12 text-base cursor-pointer hover:bg-muted/50 transition-colors 
                [&::-webkit-calendar-picker-indicator]:invert 
                [&::-webkit-calendar-picker-indicator]:opacity-80
              "
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 pl-1">
              Select the date for these activities.
            </p>
          </div>

          {/* Forms Container */}
          <form
            id="dailyLogForm"
            onSubmit={saveDailyLog}
            className="flex flex-col gap-6"
          >
            <InviteColleaguesDialog
              mode="select"
              attendants={attendants.map((a) => a.userId)}
              open={inviteOpen}
              onOpenChange={setInviteOpen}
              selected={appliedTo}
              onSelect={setAppliedTo}
            />
            <TravelForm
              value={travel}
              onChange={setTravel}
              onAddMapImage={(file) => {
                setAdditional((prev) => {
                  // Check if file already exists to avoid duplicates
                  if (prev.uploadedFiles.find((f) => f.url === file.url)) {
                    return prev;
                  }
                  return {
                    ...prev,
                    uploadedFiles: [...prev.uploadedFiles, file],
                  };
                });
              }}
            />

            {/* UPDATED WORK TIME FORM CALL */}
            <WorkTimeForm
              value={workTime}
              onChange={setWorkTime}
              appliedTo={appliedTo}
              attendants={attendants}
              onOverridesChange={setWorkTimeOverrides}
              overrides={workTimeOverrides}
            />

            <AccommodationMealsForm
              value={accommodationMeals}
              onChange={setAccommodationMeals}
            />
            <AdditionalForm value={additional} onChange={setAdditional} />
          </form>

          {/* Toast Container */}
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      </div>
    </AuthGuard>
  );
}
