"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import WorkTimeForm, {
  WorkTimeOverride,
} from "@/components/workTime/WorkTimeForm";
import AccommodationMealsForm from "@/components/accommodationMeal/AccommodationMealsForm";
import AdditionalForm from "@/components/additional/AdditionalForm";

import { Button } from "@/components/ui/button";
import { DateAndAppliedToSelector } from "@/components/form-elements/DateAndAppliedToSelector";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth/AuthGuard";

import { UploadedFile } from "@/app/types/DailyLog";
import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import { Trip, TripAttendant } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";
import {
  getInitialSharedFields,
  updateSharedFieldsOnAppliedToChange,
} from "@/lib/utils/shareFieldLogic";

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

  // Track which fields are shared - default based on appliedTo
  const [sharedFields, setSharedFields] = useState<Set<string>>(() =>
    getInitialSharedFields(appliedTo),
  );

  // Update shared fields when appliedTo changes
  useEffect(() => {
    setSharedFields((prev) =>
      updateSharedFieldsOnAppliedToChange(prev, appliedTo),
    );
  }, [appliedTo]);

  function cancel() {
    router.push(`/trips/${tripId}`);
  }

  const createLogRequest = (
    itemType: string,
    data: WorkTimeFormState | AccommodationFormState | AdditionalFormState,
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

    const forms = [
      {
        type: "worktime" as const,
        data: workTime,
        isFilled:
          workTime.description || workTime.startTime || workTime.endTime,
      },
      {
        type: "accommodation" as const,
        data: accommodationMeals,
        isFilled:
          accommodationMeals.accommodationType ||
          accommodationMeals.overnightStay !== "" ||
          accommodationMeals.meals.breakfast.eaten,
      },
      {
        type: "additional" as const,
        data: additional,
        isFilled: additional.notes || additional.uploadedFiles.length > 0,
      },
    ];

    forms.forEach((form) => {
      if (!form.isFilled) return;

      // Create owner's log
      requests.push(createLogRequest(form.type, form.data, isoDateString, []));

      // Create real logs for each colleague in appliedTo only if this field is shared
      if (appliedTo.length > 0 && sharedFields.has(form.type)) {
        appliedTo.forEach((colleagueId) => {
          // For worktime, use override if available, otherwise use base data
          let colleagueData = form.data;
          if (form.type === "worktime") {
            const override = workTimeOverrides[colleagueId];
            colleagueData = {
              startTime: override?.startTime || workTime.startTime,
              endTime: override?.endTime || workTime.endTime,
              description: override?.description || workTime.description,
            } as WorkTimeFormState;
          }

          const colleagueBody = {
            itemType: form.type,
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
    });

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

          {/* Date and Applied To Selector */}
          <DateAndAppliedToSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            appliedTo={appliedTo}
            onAppliedToChange={setAppliedTo}
            inviteOpen={inviteOpen}
            onInviteOpenChange={setInviteOpen}
            attendants={attendants}
          />

          {/* Forms Container */}
          <form
            id="dailyLogForm"
            onSubmit={saveDailyLog}
            className="flex flex-col gap-6"
          >
            {/* WORK TIME FORM */}
            <WorkTimeForm
              value={workTime}
              onChange={setWorkTime}
              appliedTo={appliedTo}
              attendants={attendants}
              onOverridesChange={setWorkTimeOverrides}
              overrides={workTimeOverrides}
              shareEnabled={sharedFields.has("worktime")}
              onShareChange={(enabled) => {
                setSharedFields((prev) => {
                  const next = new Set(prev);
                  if (enabled) {
                    next.add("worktime");
                  } else {
                    next.delete("worktime");
                  }
                  return next;
                });
              }}
            />

            <AccommodationMealsForm
              value={accommodationMeals}
              onChange={setAccommodationMeals}
              shareEnabled={sharedFields.has("accommodation")}
              onShareChange={(enabled) => {
                setSharedFields((prev) => {
                  const next = new Set(prev);
                  if (enabled) {
                    next.add("accommodation");
                  } else {
                    next.delete("accommodation");
                  }
                  return next;
                });
              }}
              appliedTo={appliedTo}
            />
            <AdditionalForm
              value={additional}
              onChange={setAdditional}
              shareEnabled={sharedFields.has("additional")}
              onShareChange={(enabled) => {
                setSharedFields((prev) => {
                  const next = new Set(prev);
                  if (enabled) {
                    next.add("additional");
                  } else {
                    next.delete("additional");
                  }
                  return next;
                });
              }}
              appliedTo={appliedTo}
            />
          </form>

          {/* Toast Container */}
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      </div>
    </AuthGuard>
  );
}
