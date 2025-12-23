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
import {
  getInitialSharedFields,
  updateSharedFieldsOnAppliedToChange,
} from "@/lib/utils/shareFieldLogic";
import { getInitialFormState } from "@/lib/utils/formInitialStates";
import {
  transformLogToFormState,
  extractWorkTimeOverride,
} from "@/lib/utils/logDataTransformers";
import { DateAndAppliedToSelector } from "@/components/daily-log/DateAndAppliedToSelector";
import {
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
} from "@/app/types/DailyLog";

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

        // Track users who already have logs for this date (excluding the owner)
        const existingLogUsers = new Set<string>();
        logs.forEach((log) => {
          if (log.userId !== logUserId) {
            const logDateStr = log.dateTime ? log.dateTime.split("T")[0] : "";
            if (logDateStr === logDate) {
              existingLogUsers.add(log.userId);
            }
          }
        });
        setUsersWithExistingLogs(existingLogUsers);

        logs.forEach((log) => {
          const type = log.itemType;

          const ownerId = logUserId;

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
            } else {
              // Track existing colleague worktime logs for overrides
              foundOverrides[log.userId] = extractWorkTimeOverride(
                log as DailyLogFormState & { itemType: "worktime" },
              );
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
        // Initialize appliedTo from existing log's metadata
        // This preserves users who are already shared, even if they have existing logs
        setAppliedTo(initialLog.appliedTo || []);
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
    setValidationError("");

    // Validation: Check if any selected colleagues already have logs for this date
    const conflictingUsers: string[] = [];
    appliedTo.forEach((colleagueId) => {
      if (usersWithExistingLogs.has(colleagueId)) {
        conflictingUsers.push(colleagueId);
      }
    });

    if (conflictingUsers.length > 0) {
      const userNames = await fetch("/api/users/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: conflictingUsers }),
      })
        .then((res) => res.json())
        .then((data) => data.users || {})
        .catch(() => ({}));

      const names = conflictingUsers
        .map((id) => userNames[id] || id.slice(0, 8))
        .join(", ");
      setValidationError(
        `Cannot share with ${names}. They already have logs for this date.`,
      );
      setIsSaving(false);
      return;
    }

    setIsSaving(true);

    const [year, month, day] = selectedDate.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const isoDateString = utcDate.toISOString();

    const logsToUpdate: DailyLogFormState[] = [];
    const logsToCreate: LogCreationPayload[] = [];

    // Track existing colleague logs for all field types
    const existingColleagueLogs = new Map<
      string,
      Map<string, DailyLogFormState>
    >(); // Map<itemType, Map<colleagueId, log>>

    originalLogs.forEach((log) => {
      if (log.userId === effectiveUserId) return;
      if (log.tripId !== tripId) return;

      const logDate = log.dateTime ? log.dateTime.split("T")[0] : "";
      if (logDate !== selectedDate) return;

      const type = log.itemType;
      if (!existingColleagueLogs.has(type)) {
        existingColleagueLogs.set(type, new Map());
      }
      existingColleagueLogs.get(type)!.set(log.userId, log);
    });

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

    const logsToDelete: string[] = [];
    const currentColleagueIds = new Set(appliedTo);

    // Validate: Block sharing with users who already have logs for this date
    // (They should be excluded from selection, but double-check here as safeguard)
    if (appliedTo.length > 0) {
      const usersWithLogs: string[] = [];
      for (const colleagueId of appliedTo) {
        if (usersWithExistingLogs.has(colleagueId)) {
          usersWithLogs.push(colleagueId);
        }
      }

      if (usersWithLogs.length > 0) {
        const userNames = await fetch("/api/users/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: usersWithLogs }),
        })
          .then((res) => res.json())
          .then((data) => data.users || {})
          .catch(() => ({}));
        const names = usersWithLogs
          .map((id) => userNames[id] || id.slice(0, 8))
          .join(", ");
        setValidationError(
          `Cannot share with ${names}. They already have logs for this date.`,
        );
        setIsSaving(false);
        return;
      }
    }

    forms.forEach((form) => {
      const hasData = Object.values(form.data).some(
        (val) => val && val !== "" && val !== 0 && val !== false,
      );

      const appliedToForThis = appliedTo;
      const isGroupSourceForThis = appliedToForThis.length > 0;

      // Update owner's log (never create new in edit mode)
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
        // In edit mode, we should never create new logs - only update existing ones
        // If form.id is missing, it means the log was deleted or doesn't exist
        // This is an error condition in edit mode
        console.warn(
          `Attempted to create new ${form.type} log in edit mode. This should not happen.`,
        );
        // Still allow it for now, but log the warning
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

      // Update or create real logs for each colleague in appliedTo
      // Only if this field is shared
      if (
        hasData &&
        appliedToForThis.length > 0 &&
        sharedFields.has(form.type)
      ) {
        const colleagueLogsMap =
          existingColleagueLogs.get(form.type) || new Map();

        for (const colleagueId of appliedToForThis) {
          const existing = colleagueLogsMap.get(colleagueId);

          // For worktime, use override if available, otherwise use base data
          let colleagueData:
            | WorkTimeFormState
            | TravelFormState
            | AccommodationFormState
            | AdditionalFormState = form.data;
          if (form.type === "worktime") {
            const override = workTimeOverrides[colleagueId];
            colleagueData = {
              startTime: override?.startTime || workTime.startTime,
              endTime: override?.endTime || workTime.endTime,
              description: override?.description || workTime.description,
            };
          }

          if (existing) {
            // Update existing log - preserve metadata
            const baseLogFields = {
              _id: existing._id,
              userId: colleagueId,
              tripId,
              dateTime: isoDateString,
              appliedTo: [],
              isGroupSource: false,
              files: existing.files,
              sealed: existing.sealed,
              createdAt: existing.createdAt,
              updatedAt: new Date().toISOString(),
            };

            let updatedColleagueLog: DailyLogFormState;
            if (form.type === "travel") {
              updatedColleagueLog = {
                ...baseLogFields,
                itemType: "travel",
                ...(colleagueData as TravelFormState),
              } as TravelLog;
            } else if (form.type === "worktime") {
              updatedColleagueLog = {
                ...baseLogFields,
                itemType: "worktime",
                ...(colleagueData as WorkTimeFormState),
              } as WorkTimeLog;
            } else if (form.type === "accommodation") {
              updatedColleagueLog = {
                ...baseLogFields,
                itemType: "accommodation",
                ...(colleagueData as AccommodationFormState),
              } as AccommodationLog;
            } else {
              // form.type === "additional"
              updatedColleagueLog = {
                ...baseLogFields,
                itemType: "additional",
                ...(colleagueData as AdditionalFormState),
              } as AdditionalLog;
            }

            logsToUpdate.push(updatedColleagueLog);
          } else {
            // Create new log for colleague who doesn't have one yet
            const newColleagueLog: LogCreationPayload = {
              itemType: form.type,
              tripId,
              userId: colleagueId,
              dateTime: isoDateString,
              appliedTo: [],
              isGroupSource: false,
              data: colleagueData,
              files: [],
            };

            logsToCreate.push(newColleagueLog);
          }
        }

        // Delete colleague logs that are no longer in appliedTo or if field is no longer shared
        colleagueLogsMap.forEach((log, colleagueId) => {
          if (
            !currentColleagueIds.has(colleagueId) ||
            !sharedFields.has(form.type)
          ) {
            logsToDelete.push(log._id.toString());
          }
        });
      } else if (hasData && !sharedFields.has(form.type)) {
        // If field is no longer shared, delete all existing colleague logs for this type
        const colleagueLogsMap = existingColleagueLogs.get(form.type);
        if (colleagueLogsMap) {
          colleagueLogsMap.forEach((log) => {
            logsToDelete.push(log._id.toString());
          });
        }
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
        // Update each log individually, strictly scoped to its ID
        for (const log of logsToUpdate) {
          const logId = log._id.toString();
          const res = await fetch(`/api/daily-logs/${logId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(log),
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
              `Update error for log ${logId}: ${errorData.error || "Unknown Error"}`,
            );
          }
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

        {/* VALIDATION ERROR */}
        {validationError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        )}

        {/* GLOBAL DATE SELECTOR + APPLIED TO */}
        <DateAndAppliedToSelector
          selectedDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
            setValidationError("");
            // Refresh excluded users when date changes
            if (date && tripId) {
              fetch(`/api/daily-logs?tripId=${tripId}&date=${date}`)
                .then((res) => res.json())
                .then((data) => {
                  const logs: DailyLogFormState[] = data.logs || [];
                  const effectiveUserId = ownerUserId ?? loggedInUserId!;
                  const existingLogUsers = new Set<string>();
                  logs.forEach((log) => {
                    if (log.userId !== effectiveUserId) {
                      const logDateStr = log.dateTime
                        ? log.dateTime.split("T")[0]
                        : "";
                      if (logDateStr === date) {
                        existingLogUsers.add(log.userId);
                      }
                    }
                  });
                  setUsersWithExistingLogs(existingLogUsers);
                })
                .catch((err) =>
                  console.error("Failed to refresh excluded users", err),
                );
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
            shareEnabled={sharedFields.has("travel")}
            onShareChange={(enabled) => {
              setSharedFields((prev) => {
                const next = new Set(prev);
                if (enabled) {
                  next.add("travel");
                } else {
                  next.delete("travel");
                }
                return next;
              });
            }}
            appliedTo={appliedTo}
          />

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
