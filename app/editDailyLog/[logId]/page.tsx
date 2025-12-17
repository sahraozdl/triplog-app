"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TravelForm from "@/components/forms/TravelForm";
import WorkTimeForm, {
  WorkTimeOverride,
} from "@/components/forms/WorkTimeForm";
import AccommodationMealsForm from "@/components/forms/AccommodationMealsForm";
import AdditionalForm from "@/components/forms/AdditionalForm";
import { Button } from "@/components/ui/button";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { DailyLogFormState } from "@/app/types/DailyLog";
import {
  TravelFormState,
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import { LogCreationPayload } from "@/app/types/LogCreation";
import { useTripStore } from "@/lib/store/useTripStore";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { hasNonEmptyOverride } from "@/lib/utils/dailyLogHelpers";
import { getInitialFormState } from "@/lib/utils/formInitialStates";
import {
  transformLogToFormState,
  extractWorkTimeOverride,
} from "@/lib/utils/logDataTransformers";
import { DateAndAppliedToSelector } from "@/components/daily-log/DateAndAppliedToSelector";

export default function EditDailyLogPage() {
  const router = useRouter();
  const { logId } = useParams();
  const appUser = useAppUser();
  const loggedInUserId = appUser?.userId;

  const { invalidate, getTrip, updateTrip } = useTripStore();

  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [originalLogs, setOriginalLogs] = useState<DailyLogFormState[]>([]);
  const [tripId, setTripId] = useState<string>("");

  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  const trip = getTrip(tripId);
  const attendants = trip?.attendants ?? [];

  const [travel, setTravel] = useState<TravelFormState>(
    getInitialFormState("travel"),
  );
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
    travel?: string;
    worktime?: string;
    accommodation?: string;
    additional?: string;
  }>({});

  useEffect(() => {
    if (!logId) return;

    async function fetchAndFillLogs() {
      setLoadingLogs(true);
      const newLogIds: typeof logIds = {};
      const foundAppliedTo = new Set<string>();
      const foundOverrides: Record<string, WorkTimeOverride> = {};

      try {
        const initialLogRes = await fetch(`/api/daily-logs/${logId}`);
        if (!initialLogRes.ok) throw new Error("Could not find initial log.");
        const initialLog = (await initialLogRes.json()) as DailyLogFormState;

        const tripIdToFetch = initialLog.tripId;
        const logUserId = initialLog.userId;
        setOwnerUserId(logUserId);

        const logDate = initialLog.dateTime
          ? initialLog.dateTime.split("T")[0]
          : "";

        setTripId(tripIdToFetch);

        const groupRes = await fetch(
          `/api/daily-logs?tripId=${tripIdToFetch}&date=${logDate}`,
        );
        const data = await groupRes.json();
        const logs: DailyLogFormState[] = data.logs || [];

        setOriginalLogs(logs);

        logs.forEach((log) => {
          const type = log.itemType;

          const ownerId = logUserId;
          const logData = log;

          if (type === "worktime") {
            const workTimeLog = log as DailyLogFormState & {
              itemType: "worktime";
            };
            if (log.userId === ownerId) {
              newLogIds.worktime = log._id.toString();
              setWorkTime({
                startTime: workTimeLog.startTime || "",
                endTime: workTimeLog.endTime || "",
                description: workTimeLog.description || "",
              });

              if (Array.isArray(log.appliedTo)) {
                log.appliedTo.forEach((uid: string) => foundAppliedTo.add(uid));
              }
            } else {
              foundOverrides[log.userId] = extractWorkTimeOverride(
                log as DailyLogFormState & { itemType: "worktime" },
              );
              foundAppliedTo.add(log.userId);
            }

            return;
          }
          if (log.userId === ownerId) {
            newLogIds[type as keyof typeof logIds] = log._id.toString();

            const formPayload = transformLogToFormState(log);

            if (type === "travel") setTravel(formPayload as TravelFormState);
            else if (type === "accommodation")
              setAccommodationMeals(formPayload as AccommodationFormState);
            else if (type === "additional")
              setAdditional(formPayload as AdditionalFormState);
          }
        });

        setLogIds(newLogIds);
        setWorkTimeOverrides(foundOverrides);
        setSelectedDate(logDate);
        setAppliedTo(Array.from(foundAppliedTo));
      } catch (error) {
        console.error("Failed to load logs for editing:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        alert(`Error: ${errorMessage}`);
      } finally {
        setLoadingLogs(false);
      }
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
        const data = await res.json();
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

    setIsSaving(true);

    const [year, month, day] = selectedDate.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const isoDateString = utcDate.toISOString();

    const logsToUpdate: DailyLogFormState[] = [];
    const logsToCreate: LogCreationPayload[] = [];

    const forms = [
      { type: "travel" as const, data: travel, id: logIds.travel },
      { type: "worktime" as const, data: workTime, id: logIds.worktime },
      {
        type: "accommodation" as const,
        data: accommodationMeals,
        id: logIds.accommodation,
      },
      { type: "additional" as const, data: additional, id: logIds.additional },
    ];

    forms.forEach((form) => {
      const hasData = Object.values(form.data).some(
        (val) => val && val !== "" && val !== 0 && val !== false,
      );

      const appliedToForThis = appliedTo;
      const isGroupSourceForThis = appliedToForThis.length > 0;

      if (form.id) {
        const updatedLog: DailyLogFormState = {
          _id: form.id,
          userId: effectiveUserId,
          tripId,
          dateTime: isoDateString,
          appliedTo: appliedToForThis,
          isGroupSource: isGroupSourceForThis,
          itemType: form.type,
          ...form.data,
        } as DailyLogFormState;

        logsToUpdate.push(updatedLog);
      } else if (hasData) {
        const newLog: LogCreationPayload = {
          itemType: form.type,
          tripId,
          userId: effectiveUserId,
          dateTime: isoDateString,
          appliedTo: appliedToForThis,
          isGroupSource: isGroupSourceForThis,
          data: form.data,
          files: [],
        };

        logsToCreate.push(newLog);
      }
    });

    const existingColleagueWorklogs = new Map<string, DailyLogFormState>();

    originalLogs.forEach((log) => {
      if (log.itemType !== "worktime") return;
      if (log.userId === effectiveUserId) return;
      if (log.tripId !== tripId) return;

      const logDate = log.dateTime ? log.dateTime.split("T")[0] : "";
      if (logDate !== selectedDate) return;

      existingColleagueWorklogs.set(log.userId, log);
    });

    const logsToDelete: string[] = [];
    const currentColleagueIds = new Set(appliedTo);

    existingColleagueWorklogs.forEach((log, colleagueId) => {
      if (
        !currentColleagueIds.has(colleagueId) ||
        !hasNonEmptyOverride(workTimeOverrides[colleagueId])
      ) {
        logsToDelete.push(log._id.toString());
      }
    });

    appliedTo.forEach((colleagueId) => {
      const override = workTimeOverrides[colleagueId];

      if (!hasNonEmptyOverride(override)) {
        return;
      }

      const base = {
        startTime: override?.startTime || workTime.startTime,
        endTime: override?.endTime || workTime.endTime,
        description: override?.description || workTime.description,
      };

      const existing = existingColleagueWorklogs.get(colleagueId);

      if (existing) {
        const updatedColleagueLog: DailyLogFormState = {
          _id: existing._id,
          userId: colleagueId,
          tripId,
          dateTime: isoDateString,
          appliedTo: [],
          isGroupSource: false,
          itemType: "worktime",
          ...(base as any),
        };

        logsToUpdate.push(updatedColleagueLog);
      } else {
        const newColleagueLog: LogCreationPayload = {
          itemType: "worktime",
          tripId,
          userId: colleagueId,
          dateTime: isoDateString,
          appliedTo: [],
          isGroupSource: false,
          data: base,
          files: [],
        };

        logsToCreate.push(newColleagueLog);
      }
    });

    try {
      if (logsToDelete.length > 0) {
        for (const logId of logsToDelete) {
          await fetch(`/api/daily-logs/${logId}`, {
            method: "DELETE",
          });
        }
      }

      if (logsToUpdate.length > 0) {
        const res = await fetch(`/api/daily-logs`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logs: logsToUpdate }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            `Update error: ${errorData.error || "Unknown Error"}`,
          );
        }
      }

      if (logsToCreate.length > 0) {
        for (const newLog of logsToCreate) {
          await fetch("/api/daily-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemType: newLog.itemType,
              tripId: newLog.tripId,
              userId: newLog.userId,
              dateTime: newLog.dateTime,
              appliedTo: newLog.appliedTo,
              isGroupSource: newLog.isGroupSource,
              data: newLog.data,
              files: [],
            }),
          });
        }
      }

      invalidate();
      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Update failed.");
    } finally {
      setIsSaving(false);
    }
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

        {/* GLOBAL DATE SELECTOR + APPLIED TO */}
        <DateAndAppliedToSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          appliedTo={appliedTo}
          onAppliedToChange={setAppliedTo}
          inviteOpen={inviteOpen}
          onInviteOpenChange={setInviteOpen}
          attendants={attendants}
        />

        {/* FORMS */}
        <form
          id="dailyLogForm"
          onSubmit={handleUpdateLog}
          className="flex flex-col gap-6"
        >
          <TravelForm
            value={travel}
            onChange={setTravel}
            onAddMapImage={(file) => {
              setAdditional((prev) => {
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
