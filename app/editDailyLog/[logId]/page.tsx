"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TravelForm from "@/components/forms/TravelForm";
import WorkTimeForm from "@/components/forms/WorkTimeForm";
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
import { Trip, TripAttendant } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import { Save, Loader2, ArrowLeft } from "lucide-react";

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
        vehicleType: "personal-car",
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
  const user = useAppUser();
  const loggedInUserId = user?.userId;

  const { invalidate } = useTripStore();

  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [logIds, setLogIds] = useState<{
    travel?: string;
    worktime?: string;
    accommodation?: string;
    additional?: string;
  }>({});

  const [originalLogs, setOriginalLogs] = useState<DailyLogFormState[]>([]);
  const [tripId, setTripId] = useState<string>("");

  const [dateTime, setDateTime] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  const [travel, setTravel] = useState<TravelFormState>(
    getInitialState("travel"),
  );
  const [workTime, setWorkTime] = useState<WorkTimeFormState>(
    getInitialState("worktime"),
  );
  const [accommodationMeals, setAccommodationMeals] =
    useState<AccommodationFormState>(getInitialState("accommodation"));
  const [additional, setAdditional] = useState<AdditionalFormState>(
    getInitialState("additional"),
  );

  useEffect(() => {
    if (!logId) return;

    async function fetchAndFillLogs() {
      setLoadingLogs(true);
      const newLogIds: typeof logIds = {};

      try {
        const initialLogRes = await fetch(`/api/daily-logs/${logId}`, {
          cache: "no-store",
        });
        if (!initialLogRes.ok) throw new Error("Could not find initial log.");
        const initialLog = (await initialLogRes.json()) as DailyLogFormState;

        const tripIdToFetch = initialLog.tripId;
        const logUserId = initialLog.userId;
        const logDate = initialLog.dateTime.split("T")[0];

        setTripId(tripIdToFetch);

        const groupRes = await fetch(
          `/api/daily-logs?tripId=${tripIdToFetch}&userId=${logUserId}&date=${logDate}`,
        );
        if (!groupRes.ok) throw new Error("Could not find related logs.");
        const data = await groupRes.json();
        const logs: DailyLogFormState[] = data.logs || [];

        setOriginalLogs(logs);

        logs.forEach((log) => {
          const type = log.itemType;
          const logData = log as any;

          newLogIds[type as keyof typeof logIds] = log._id.toString();

          const formPayload = { ...logData };

          delete formPayload.__v;
          delete formPayload._id;
          delete formPayload.itemType;

          if (type === "travel") setTravel(formPayload as TravelFormState);
          else if (type === "worktime")
            setWorkTime(formPayload as WorkTimeFormState);
          else if (type === "accommodation")
            setAccommodationMeals(formPayload as AccommodationFormState);
          else if (type === "additional")
            setAdditional(formPayload as AdditionalFormState);
        });

        setLogIds(newLogIds);
        setDateTime(initialLog.dateTime);
        setAppliedTo(initialLog.appliedTo || []);
      } catch (error) {
        console.error("Failed to load logs for editing:", error);
        alert("Error loading log data for editing.");
      } finally {
        setLoadingLogs(false);
      }
    }

    fetchAndFillLogs();
  }, [logId]);

  async function handleUpdateLog(e: React.FormEvent) {
    e.preventDefault();

    if (!dateTime) return alert("Date is required.");
    if (!loggedInUserId || !tripId)
      return alert("User or Trip context missing.");

    setIsSaving(true);
    const isoDateString = dateTime;

    const logsToUpdate: DailyLogFormState[] = [];

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
      if (form.id) {
        const updatedLog: DailyLogFormState = {
          _id: form.id as any,
          userId: loggedInUserId,
          tripId: tripId,
          dateTime: isoDateString,
          appliedTo: appliedTo,
          itemType: form.type,
          ...(form.data as any),
        } as DailyLogFormState;

        logsToUpdate.push(updatedLog);
      }
    });

    try {
      const res = await fetch(`/api/daily-logs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: logsToUpdate }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Update Failed:", errorData);
        throw new Error(
          `API returned status ${res.status}: ${errorData.error || "Unknown Error"}`,
        );
      }

      invalidate();
      router.push(`/tripDetail/${tripId}`);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Update failed. Please check the console.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loadingLogs)
    return (
      <div className="p-6 text-center text-lg">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />{" "}
        Loading log edit data...
      </div>
    );
  if (!tripId)
    return (
      <div className="p-6 text-center text-lg text-red-500">
        <ArrowLeft className="h-4 w-4 inline mr-2" /> Trip context not found.
      </div>
    );

  return (
    <div className="w-full flex justify-center px-4 py-8 bg-background min-h-screen">
      <div className="w-full max-w-4xl space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">
            Günlük Kayıt Düzenleme
          </h1>
          <Button
            variant="ghost"
            onClick={() => router.push(`/tripDetail/${tripId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Seyahate Geri Dön
          </Button>
        </div>

        {/* GLOBAL DATE SELECTOR */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-2">
          <div className="max-w-sm w-full relative">
            <Label
              htmlFor="logDate"
              className="mb-2 block font-semibold text-foreground"
            >
              Kayıt Tarihi ve Saati (Orijinal:{" "}
              {new Date(dateTime).toLocaleDateString()})
            </Label>
            <Input
              id="logDate"
              type="datetime-local"
              onClick={(e) => e.currentTarget.showPicker()}
              value={
                dateTime ? new Date(dateTime).toISOString().slice(0, 16) : ""
              }
              onChange={(e) => {
                const val = e.target.value;
                setDateTime(val ? new Date(val).toISOString() : "");
              }}
              className="w-full pl-3 h-12 text-base cursor-pointer hover:bg-muted/50 transition-colors"
            />
          </div>
          {/* Note: AppliedTo and InviteColleaguesDialog will be added here later. */}
        </div>

        {/* FORMS CONTAINER */}
        <form
          id="dailyLogForm"
          onSubmit={handleUpdateLog}
          className="flex flex-col gap-6"
        >
          <TravelForm value={travel} onChange={setTravel} />
          <WorkTimeForm value={workTime} onChange={setWorkTime} />
          <AccommodationMealsForm
            value={accommodationMeals}
            onChange={setAccommodationMeals}
          />
          <AdditionalForm value={additional} onChange={setAdditional} />

          <Button type="submit" disabled={isSaving} className="mt-6">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Güncellemeleri Kaydet
          </Button>
        </form>
      </div>
    </div>
  );
}
