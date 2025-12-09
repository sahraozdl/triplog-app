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
import { useTripStore } from "@/lib/store/useTripStore";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import { Save, Loader2, ArrowLeft, CalendarIcon } from "lucide-react";

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
  const user = useAppUser();
  const loggedInUserId = user?.userId;

  const { invalidate, getTrip } = useTripStore();

  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [originalLogs, setOriginalLogs] = useState<DailyLogFormState[]>([]);
  const [tripId, setTripId] = useState<string>("");

  const [date, setDate] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  const trip = getTrip(tripId);
  const attendants = trip?.attendants ?? [];

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
  const [logIds, setLogIds] = useState<{
    travel?: string;
    worktime?: string;
    accommodation?: string;
    additional?: string;
  }>({});

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

      try {
        const initialLogRes = await fetch(`/api/daily-logs/${logId}`);

        if (!initialLogRes.ok) {
          const errorData = await initialLogRes.json().catch(() => ({}));
          console.error(
            "Initial log fetch failed:",
            initialLogRes.status,
            errorData,
          );
          throw new Error(
            `Could not find initial log (Status: ${initialLogRes.status})`,
          );
        }

        const initialLog = (await initialLogRes.json()) as DailyLogFormState;

        const tripIdToFetch = initialLog.tripId;
        const logUserId = initialLog.userId;
        const logDate = initialLog.dateTime
          ? initialLog.dateTime.split("T")[0]
          : "";

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
          delete formPayload.userId;
          delete formPayload.tripId;
          delete formPayload.dateTime;
          delete formPayload.appliedTo;
          delete formPayload.isGroupSource;
          delete formPayload.createdAt;
          delete formPayload.updatedAt;
          delete formPayload.sealed;

          if (type === "travel") setTravel(formPayload as TravelFormState);
          else if (type === "worktime")
            setWorkTime(formPayload as WorkTimeFormState);
          else if (type === "accommodation")
            setAccommodationMeals(formPayload as AccommodationFormState);
          else if (type === "additional")
            setAdditional(formPayload as AdditionalFormState);
        });

        setLogIds(newLogIds);
        setDate(logDate);
        setAppliedTo(initialLog.appliedTo || []);
      } catch (error: any) {
        console.error("Failed to load logs for editing:", error);
        alert(`Error loading log data: ${error.message}`);
      } finally {
        setLoadingLogs(false);
      }
    }

    fetchAndFillLogs();
  }, [logId]);

  async function handleUpdateLog(e: React.FormEvent) {
    e.preventDefault();

    if (!date) return alert("Date is required.");
    if (!loggedInUserId || !tripId)
      return alert("User or Trip context missing.");

    setIsSaving(true);

    const [year, month, day] = date.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const isoDateString = utcDate.toISOString();

    const logsToUpdate: DailyLogFormState[] = [];
    const logsToCreate: any[] = [];

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

      if (form.id) {
        const updatedLog: DailyLogFormState = {
          _id: form.id as any,
          userId: loggedInUserId,
          tripId: tripId,
          dateTime: isoDateString,
          appliedTo: appliedTo,
          isGroupSource: appliedTo.length > 0,
          itemType: form.type,
          ...(form.data as any),
        } as DailyLogFormState;

        logsToUpdate.push(updatedLog);
      } else if (hasData) {
        const newLog = {
          itemType: form.type,
          tripId: tripId,
          userId: loggedInUserId,
          dateTime: isoDateString,
          appliedTo: appliedTo,
          isGroupSource: appliedTo.length > 0,
          ...form.data,
          files: [],
          sealed: false,
        };
        logsToCreate.push(newLog);
      }
    });

    try {
      if (logsToUpdate.length > 0) {
        const res = await fetch(`/api/daily-logs`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logs: logsToUpdate }),
        });

        if (!res.ok) {
          const errorData = await res.json();
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
              data: newLog,
            }),
          });
        }
      }

      invalidate();
      router.push(`/tripDetail/${tripId}`);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Update failed. Check console.");
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

        {/* GLOBAL DATE SELECTOR */}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
          <WorkTimeForm value={workTime} onChange={setWorkTime} />
          <AccommodationMealsForm
            value={accommodationMeals}
            onChange={setAccommodationMeals}
          />
          <AdditionalForm value={additional} onChange={setAdditional} />

          <Button type="submit" disabled={isSaving} className="w-1/3 mx-auto">
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
