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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppUser } from "@/components/providers/AppUserProvider";
import {
  TravelLog,
  AccommodationLog,
  AdditionalLog,
  WorkTimeLog,
  DailyLogFormState,
} from "@/app/types/DailyLog";
import { useTripStore } from "@/lib/store/useTripStore";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import { Save, Loader2, ArrowLeft, CalendarIcon } from "lucide-react";

// Type Helpers
type FormState<T> = Omit<
  T,
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
type TravelFormState = FormState<TravelLog>;
type WorkTimeFormState = FormState<WorkTimeLog>;
type AccommodationFormState = FormState<AccommodationLog>;
type AdditionalFormState = FormState<AdditionalLog>;

const getInitialState = <T extends {}>(itemType: string): T => {
  switch (itemType) {
    case "travel":
      return {
        travelReason: "",
        vehicleType: "",
        startTime: "",
        endTime: "",
        departureLocation: "",
        destination: "",
        distance: 0,
        isRoundTrip: false,
      } as unknown as T;
    case "worktime":
      return {
        startTime: "",
        endTime: "",
        description: "",
      } as unknown as T;
    case "accommodation":
      return {
        accommodationType: "",
        accommodationCoveredBy: "",
        overnightStay: "",
        meals: {
          breakfast: { eaten: false, coveredBy: "" },
          lunch: { eaten: false, coveredBy: "" },
          dinner: { eaten: false, coveredBy: "" },
        },
      } as unknown as T;
    case "additional":
      return {
        notes: "",
        uploadedFiles: [],
      } as unknown as T;
    default:
      return {} as T;
  }
};

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

  // Trip data for Invite Dialog
  const trip = getTrip(tripId);
  const attendants = trip?.attendants ?? [];

  // --- FORM STATES ---
  const [travel, setTravel] = useState<TravelFormState>(
    getInitialState("travel"),
  );
  const [workTime, setWorkTime] = useState<WorkTimeFormState>(
    getInitialState("worktime"),
  );

  const [workTimeOverrides, setWorkTimeOverrides] = useState<
    Record<string, WorkTimeOverride>
  >({});

  const [accommodationMeals, setAccommodationMeals] =
    useState<AccommodationFormState>(getInitialState("accommodation"));
  const [additional, setAdditional] = useState<AdditionalFormState>(
    getInitialState("additional"),
  );

  const [logIds, setLogIds] = useState<{
    travel?: string;
    worktime?: string;
    accommodation?: string;
    additional?: string;
  }>({});

  // --- HELPER: Date Input Value (YYYY-MM-DD) ---
  const toInputDateValue = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

          // OWNER bu ekranın sahibiydi
          const ownerId = logUserId;
          const logData = log as any;

          if (type === "worktime") {
            if (log.userId === ownerId) {
              // Bu kullanıcının kendi worktime'ı
              newLogIds.worktime = log._id.toString();
              setWorkTime({
                startTime: logData.startTime || "",
                endTime: logData.endTime || "",
                description: logData.description || "",
              });

              // Group source ise appliedTo'dan da ekle
              if (Array.isArray(log.appliedTo)) {
                log.appliedTo.forEach((uid: string) => foundAppliedTo.add(uid));
              }
            } else {
              // Diğer attendants → override olarak kaydediyoruz
              foundOverrides[log.userId] = {
                startTime: logData.startTime || "",
                endTime: logData.endTime || "",
                description: logData.description || "",
              };
              foundAppliedTo.add(log.userId);
            }

            return; // diğer tiplere geçmeden skip
          }

          // --- DİĞER TİPLER (travel, accommodation, additional) ---
          if (log.userId === ownerId) {
            newLogIds[type as keyof typeof logIds] = log._id.toString();

            const formPayload = { ...(logData as any) };
            delete formPayload.__v;
            delete formPayload._id;
            delete formPayload.itemType;
            delete formPayload.userId;
            delete formPayload.tripId;
            delete formPayload.dateTime;
            delete formPayload.appliedTo;
            delete formPayload.isGroupSource;
            delete formPayload.createdAt;
            delete formPayload.updatedAt;
            delete formPayload.sealed;

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
      } catch (error: any) {
        console.error("Failed to load logs for editing:", error);
        alert(`Error: ${error.message}`);
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

  // EditDailyLogPage içinde
  async function handleUpdateLog(e: React.FormEvent) {
    e.preventDefault();

    // context kontrolü
    if (!selectedDate || !tripId || (!ownerUserId && !loggedInUserId)) {
      return alert("Missing context.");
    }

    // Bu edit ekranındaki log setinin “sahibi” kimse (ilk açtığın log)
    const effectiveUserId = ownerUserId ?? loggedInUserId!;

    setIsSaving(true);

    // YYYY-MM-DD -> ISO
    const [year, month, day] = selectedDate.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const isoDateString = utcDate.toISOString();

    const logsToUpdate: DailyLogFormState[] = [];
    const logsToCreate: any[] = [];

    // 1) OWNER'ın kendi travel/worktime/accommodation/additional logları
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

      // bütün tipler için appliedTo aynı set’ten gidiyor (istersen worktime'a özel boş da yapabilirsin)
      const appliedToForThis = appliedTo;
      const isGroupSourceForThis = appliedToForThis.length > 0;

      if (form.id) {
        // EXISTING LOG → UPDATE
        const updatedLog: DailyLogFormState = {
          _id: form.id as any,
          userId: effectiveUserId,
          tripId,
          dateTime: isoDateString,
          appliedTo: appliedToForThis,
          isGroupSource: isGroupSourceForThis,
          itemType: form.type,
          ...(form.data as any),
        } as DailyLogFormState;

        logsToUpdate.push(updatedLog);
      } else if (hasData) {
        // YENİ LOG → CREATE
        const newLog = {
          itemType: form.type,
          tripId,
          userId: effectiveUserId,
          dateTime: isoDateString,
          appliedTo: appliedToForThis,
          isGroupSource: isGroupSourceForThis,
          // travel / worktime / accommodation / additional alanları:
          ...(form.data as any),
          files: [],
          sealed: false,
        };

        logsToCreate.push(newLog);
      }
    });

    // 2) MESAI ARKADAŞLARININ WORKTIME LOG'LARI  (ASIL EKSİK OLAN KISIM)

    // Bu gün + trip için, owner olmayan worktime loglarını topla
    const existingColleagueWorklogs = new Map<string, DailyLogFormState>();

    originalLogs.forEach((log) => {
      if (log.itemType !== "worktime") return;
      if (log.userId === effectiveUserId) return;
      if (log.tripId !== tripId) return;

      const logDate = log.dateTime ? log.dateTime.split("T")[0] : "";
      if (logDate !== selectedDate) return;

      existingColleagueWorklogs.set(log.userId, log);
    });

    // appliedTo içindeki HER bir mesai arkadaşı için update/create hazırla
    appliedTo.forEach((colleagueId) => {
      const override = workTimeOverrides[colleagueId];

      // override varsa onu, yoksa owner'ın default workTime'ını kullan
      const base = {
        startTime: override?.startTime || workTime.startTime,
        endTime: override?.endTime || workTime.endTime,
        description: override?.description || workTime.description,
      };

      const existing = existingColleagueWorklogs.get(colleagueId);

      if (existing) {
        // Bu mesai arkadaşına ait bir log zaten var → UPDATE
        const updatedColleagueLog: DailyLogFormState = {
          _id: existing._id,
          userId: colleagueId, // 🔴 owner değil, colleague
          tripId,
          dateTime: isoDateString,
          appliedTo: [], // onların kendisi group source değil
          isGroupSource: false,
          itemType: "worktime",
          ...(base as any),
        };

        logsToUpdate.push(updatedColleagueLog);
      } else {
        // Bu mesai arkadaşına ait log yok → CREATE
        const newColleagueLog = {
          itemType: "worktime",
          tripId,
          userId: colleagueId,
          dateTime: isoDateString,
          appliedTo: [],
          isGroupSource: false,
          ...(base as any),
          files: [],
          sealed: false,
        };

        logsToCreate.push(newColleagueLog);
      }
    });

    try {
      // UPDATE istekleri
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

      // CREATE istekleri
      if (logsToCreate.length > 0) {
        for (const newLog of logsToCreate) {
          await fetch("/api/daily-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // backend’in create’de beklediği shape'e göre:
              itemType: newLog.itemType,
              tripId: newLog.tripId,
              userId: newLog.userId,
              dateTime: newLog.dateTime,
              appliedTo: newLog.appliedTo,
              isGroupSource: newLog.isGroupSource,
              data: {
                startTime: newLog.startTime,
                endTime: newLog.endTime,
                description: newLog.description,
                accommodationType: (newLog as any).accommodationType,
                accommodationCoveredBy: (newLog as any).accommodationCoveredBy,
                overnightStay: (newLog as any).overnightStay,
                meals: (newLog as any).meals,
                travelReason: (newLog as any).travelReason,
                vehicleType: (newLog as any).vehicleType,
                departureLocation: (newLog as any).departureLocation,
                destination: (newLog as any).destination,
                distance: (newLog as any).distance,
                isRoundTrip: (newLog as any).isRoundTrip,
                notes: (newLog as any).notes,
                uploadedFiles: (newLog as any).uploadedFiles,
              },
              files: [],
            }),
          });
        }
      }

      invalidate();
      router.push(`/tripDetail/${tripId}`);
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
            onClick={() => router.push(`/tripDetail/${tripId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Trip
          </Button>
        </div>

        {/* GLOBAL DATE SELECTOR + APPLIED TO */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
          <div className="max-w-sm w-full relative">
            <Label
              htmlFor="logDate"
              className="mb-2 block font-semibold text-foreground"
            >
              Date
            </Label>
            <div className="relative group">
              <Input
                id="logDate"
                type="date"
                onClick={(e) => e.currentTarget.showPicker()}
                value={toInputDateValue(selectedDate)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedDate("");
                    return;
                  }
                  const [year, month, day] = val.split("-").map(Number);
                  const safeDate = new Date(year, month - 1, day, 12, 0, 0);
                  setSelectedDate(safeDate.toISOString().split("T")[0]);
                }}
                className="w-full pl-10 h-12 text-base cursor-pointer hover:bg-muted/50 transition-colors"
              />
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
            </div>
          </div>

          {attendants.length > 0 && (
            <div className="max-w-sm w-full">
              <Label className="mb-2 block font-semibold text-foreground">
                Applied To
              </Label>

              <InviteColleaguesDialog
                mode="select"
                attendants={attendants.map((a) => a.userId)}
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                selected={appliedTo}
                onSelect={setAppliedTo}
              />

              <p className="text-xs text-muted-foreground mt-1">
                {appliedTo.length} selected.
              </p>
            </div>
          )}
        </div>

        {/* FORMS */}
        <form
          id="dailyLogForm"
          onSubmit={handleUpdateLog}
          className="flex flex-col gap-6"
        >
          <TravelForm value={travel} onChange={setTravel} />

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
