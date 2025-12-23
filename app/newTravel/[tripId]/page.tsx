"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateAndAppliedToSelector } from "@/components/daily-log/DateAndAppliedToSelector";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TravelFormState } from "@/app/types/Travel";
import { Trip, TripAttendant } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";
import { TravelForm } from "@/components/travel/TravelForm";

export default function NewTravelPage() {
  const router = useRouter();
  const { tripId } = useParams();
  const user = useAppUser();
  const loggedInUserId = user?.userId;

  const { getTrip, updateTrip } = useTripStore();
  const trip = getTrip(tripId as string);
  const attendants: TripAttendant[] = trip?.attendants ?? [];

  const [loadingTrip, setLoadingTrip] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const [formState, setFormState] = useState<TravelFormState>({
    travelReason: "",
    vehicleType: "",
    departureLocation: "",
    destination: "",
    distance: null,
    isRoundTrip: false,
    startTime: "",
    endTime: "",
    files: [],
  });

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

  function cancel() {
    router.push(`/trips/${tripId}`);
  }

  async function saveTravel(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDate) {
      alert("Please select a date for this travel entry.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);

    try {
      const [year, month, day] = selectedDate.split("-").map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const isoDateString = utcDate.toISOString();

      // Ensure files is properly formatted as an array
      const files: Array<{
        url: string;
        name: string;
        type: string;
        size: number;
      }> = [];
      if (Array.isArray(formState.files)) {
        formState.files.forEach((file) => {
          if (file && typeof file === "object" && "url" in file) {
            files.push({
              url: String(file.url || ""),
              name: String(file.name || ""),
              type: String(file.type || ""),
              size: Number(file.size || 0),
            });
          }
        });
      }

      // Ensure files is a proper array before sending
      const filesArray = Array.isArray(files) ? files : [];

      // Validate each file object
      const validatedFiles = filesArray.map((file) => ({
        url: String(file?.url || ""),
        name: String(file?.name || ""),
        type: String(file?.type || ""),
        size: Number(file?.size || 0),
      }));

      const payload = {
        tripId,
        userId: loggedInUserId,
        dateTime: isoDateString,
        appliedTo: Array.isArray(appliedTo) ? appliedTo : [],
        isGroupSource: appliedTo.length > 0,
        travelReason: formState.travelReason || "",
        vehicleType: formState.vehicleType || "",
        departureLocation: formState.departureLocation || "",
        destination: formState.destination || "",
        distance:
          formState.distance !== null && formState.distance !== undefined
            ? Number(formState.distance)
            : null,
        isRoundTrip: Boolean(formState.isRoundTrip),
        startTime: formState.startTime || "",
        endTime: formState.endTime || "",
        files: validatedFiles, // Use validated files array
      };

      // Debug: Log before sending
      console.log(
        "Sending payload - files type:",
        typeof payload.files,
        "isArray:",
        Array.isArray(payload.files),
        "length:",
        payload.files.length,
      );
      if (payload.files.length > 0) {
        console.log(
          "First file:",
          JSON.stringify(payload.files[0]).substring(0, 100),
        );
      }

      const response = await fetch("/api/travels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create travel");
      }

      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error("Failed to save travel:", error);
      alert("An error occurred while saving travel.");
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

  const attendantUserIds = attendants.map((a) => a.userId);

  return (
    <AuthGuard>
      <div className="w-full flex justify-center px-4 py-8 bg-background min-h-screen">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground py-4">
                New Travel Entry
              </h1>
              <p className="text-muted-foreground">
                Record a shared travel entry for this trip.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={saveTravel} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Travel"
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

          {/* Travel Form */}
          <form
            id="travelForm"
            onSubmit={saveTravel}
            className="flex flex-col gap-6"
          >
            <TravelForm
              value={formState}
              onChange={setFormState}
              tripId={tripId as string}
              attendants={attendantUserIds}
              appliedTo={appliedTo}
              onAppliedToChange={setAppliedTo}
            />
          </form>

          {/* Toast Container */}
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      </div>
    </AuthGuard>
  );
}
