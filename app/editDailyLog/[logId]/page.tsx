"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppUser } from "@/components/providers/AppUserProvider";
import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import { DailyLogFormState } from "@/app/types/DailyLog";
import { Trip } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import {
  getInitialSharedFields,
  updateSharedFieldsOnAppliedToChange,
} from "@/lib/utils/shareFieldLogic";
import { getInitialFormState } from "@/lib/utils/formInitialStates";
import { DateAndAppliedToSelector } from "@/components/form-elements/DateAndAppliedToSelector";
import { WorkTimeOverride } from "@/components/workTime/WorkTimeForm";
import { DailyLogEditForms } from "@/components/daily-log/DailyLogEditForms";
import {
  loadLogsForEditing,
  validateNoConflictingUsers,
  refreshUsersWithExistingLogs,
  planLogUpdates,
  executeLogUpdates,
} from "@/lib/utils/dailyLogEditHelpers";

export default function EditDailyLogPage() {
  const router = useRouter();
  const params = useParams();
  const logId = typeof params.logId === "string" ? params.logId : undefined;
  const appUser = useAppUser();
  const loggedInUserId = appUser?.userId;

  const { invalidate, getTrip, updateTrip } = useTripStore();

  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [tripId, setTripId] = useState<string>("");
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [originalLogs, setOriginalLogs] = useState<DailyLogFormState[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [usersWithExistingLogs, setUsersWithExistingLogs] = useState<
    Set<string>
  >(new Set());
  const [validationError, setValidationError] = useState<string>("");

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

  const trip = getTrip(tripId);
  const attendants = trip?.attendants ?? [];

  const [workTime, setWorkTime] = useState<WorkTimeFormState>(
    getInitialFormState("worktime"),
  );

  const [workTimeOverrides, setWorkTimeOverrides] = useState<
    Record<string, WorkTimeOverride>
  >({});

  const [accommodationMeals, setAccommodationMeals] =
    useState<AccommodationFormState>(getInitialFormState("accommodation"));
  const [additional, setAdditional] = useState<AdditionalFormState>(
    getInitialFormState("additional"),
  );

  const [logIds, setLogIds] = useState<{
    worktime?: string;
    accommodation?: string;
    additional?: string;
  }>({});

  useEffect(() => {
    if (!logId) return;

    async function fetchAndFillLogs() {
      if (!logId) return; // Type guard
      setLoadingLogs(true);
      const result = await loadLogsForEditing(logId);

      if (!result.success || !result.data) {
        alert(`Error: ${result.error || "Failed to load logs"}`);
        setLoadingLogs(false);
        return;
      }

      const data = result.data;
      setLogIds(data.logIds);
      setWorkTime(data.workTime);
      setAccommodationMeals(data.accommodationMeals);
      setAdditional(data.additional);
      setWorkTimeOverrides(data.workTimeOverrides);
      setSelectedDate(data.selectedDate);
      setAppliedTo(data.appliedTo);
      setOwnerUserId(data.ownerUserId);
      setTripId(data.tripId);
      setOriginalLogs(data.originalLogs);
      setUsersWithExistingLogs(data.usersWithExistingLogs);
      setLoadingLogs(false);
    }

    fetchAndFillLogs();
  }, [logId]);

  useEffect(() => {
    if (!tripId) return;

    const existingTrip = getTrip(tripId);
    if (existingTrip) return;

    async function loadTrip() {
      try {
        const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          success?: boolean;
          trip?: Trip;
        };
        if (data?.success && data?.trip) {
          updateTrip(data.trip);
        }
      } catch (err) {
        console.error("Failed to load trip in edit page", err);
      }
    }

    loadTrip();
  }, [tripId, getTrip, updateTrip]);

  async function handleUpdateLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !tripId || (!ownerUserId && !loggedInUserId)) {
      return alert("Missing context.");
    }

    const effectiveUserId = ownerUserId ?? loggedInUserId!;
    setValidationError("");

    // Validate: Check if any selected colleagues already have logs for this date
    const validationResult = await validateNoConflictingUsers(
      appliedTo,
      usersWithExistingLogs,
    );

    if (!validationResult.isValid) {
      setValidationError(validationResult.error || "Validation failed");
      setIsSaving(false);
      return;
    }

    setIsSaving(true);

    const forms = [
      { type: "worktime" as const, data: workTime, id: logIds.worktime },
      {
        type: "accommodation" as const,
        data: accommodationMeals,
        id: logIds.accommodation,
      },
      { type: "additional" as const, data: additional, id: logIds.additional },
    ];

    const updatePlan = planLogUpdates(
      forms,
      appliedTo,
      sharedFields,
      workTimeOverrides,
      workTime,
      originalLogs,
      tripId,
      effectiveUserId,
      selectedDate,
    );

    const result = await executeLogUpdates(updatePlan);

    if (!result.success) {
      alert(result.error || "Update failed.");
      setIsSaving(false);
      return;
    }

    invalidate();
    router.push(`/trips/${tripId}`);
    setIsSaving(false);
  }

  if (loadingLogs)
    return (
      <div className="p-6 text-center text-lg">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />{" "}
        Loading logs...
      </div>
    );
  if (!tripId && !loadingLogs)
    return (
      <div className="p-6 text-center text-lg text-red-500">
        <ArrowLeft className="h-4 w-4 inline mr-2" /> Trip context missing.
      </div>
    );

  return (
    <div className="w-full flex justify-center px-4 py-8 bg-background min-h-screen">
      <div className="w-full max-w-4xl space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Edit Daily Log</h1>
          <Button
            variant="ghost"
            onClick={() => router.push(`/trips/${tripId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Trip
          </Button>
        </div>

        {/* VALIDATION ERROR */}
        {validationError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        )}

        {/* GLOBAL DATE SELECTOR + APPLIED TO */}
        <DateAndAppliedToSelector
          selectedDate={selectedDate}
          onDateChange={async (date) => {
            setSelectedDate(date);
            setValidationError("");
            // Refresh excluded users when date changes
            if (date && tripId) {
              const effectiveUserId = ownerUserId ?? loggedInUserId;
              if (effectiveUserId) {
                const existingUsers = await refreshUsersWithExistingLogs(
                  tripId,
                  date,
                  effectiveUserId,
                );
                setUsersWithExistingLogs(existingUsers);
              }
            }
          }}
          appliedTo={appliedTo}
          onAppliedToChange={(userIds) => {
            setAppliedTo(userIds);
            setValidationError("");
          }}
          inviteOpen={inviteOpen}
          onInviteOpenChange={setInviteOpen}
          attendants={attendants}
          excludedUserIds={usersWithExistingLogs}
          ownerUserId={ownerUserId ?? loggedInUserId ?? undefined}
        />

        {/* FORMS */}
        <form
          id="dailyLogForm"
          onSubmit={handleUpdateLog}
          className="flex flex-col gap-6"
        >
          <DailyLogEditForms
            workTime={workTime}
            onWorkTimeChange={setWorkTime}
            accommodationMeals={accommodationMeals}
            onAccommodationMealsChange={setAccommodationMeals}
            additional={additional}
            onAdditionalChange={setAdditional}
            appliedTo={appliedTo}
            attendants={attendants}
            workTimeOverrides={workTimeOverrides}
            onWorkTimeOverridesChange={setWorkTimeOverrides}
            sharedFields={sharedFields}
            onSharedFieldsChange={setSharedFields}
            tripId={tripId}
          />

          <Button
            type="submit"
            disabled={isSaving}
            className="mt-6 h-12 text-base"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
