"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateAndAppliedToSelector } from "@/components/form-elements/DateAndAppliedToSelector";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TravelFormState } from "@/app/types/Travel";
import { Trip, TripAttendant } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";
import { TravelForm } from "@/components/travel/TravelForm";
import {
  buildTravelPayload,
  validateTravelForm,
  saveTravelEntry,
  loadTripData,
} from "@/lib/utils/travelHelpers";

export function NewTravelPage() {
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
      if (!tripId || typeof tripId !== "string") {
        setLoadingTrip(false);
        return;
      }

      const result = await loadTripData(tripId);
      if (result.success && result.trip) {
        updateTrip(result.trip as Trip);
      } else if (result.error) {
        showToast(result.error, "error");
      }
      setLoadingTrip(false);
    }
    loadTrip();
  }, [tripId, trip, updateTrip, showToast]);

  function handleCancel() {
    router.push(`/trip/${tripId}`);
  }

  async function handleSaveTravel(e: React.FormEvent) {
    e.preventDefault();

    if (!loggedInUserId) {
      showToast("You must be logged in to save travel entries.", "error");
      return;
    }

    // Validate form
    const validation = validateTravelForm(selectedDate, formState);
    if (!validation.isValid) {
      showToast(validation.error || "Please check your form inputs.", "error");
      return;
    }

    setIsSaving(true);

    try {
      const payload = buildTravelPayload(
        tripId as string,
        loggedInUserId,
        selectedDate,
        appliedTo,
        formState,
      );

      const result = await saveTravelEntry(payload);

      if (result.success) {
        showToast("Travel entry saved successfully.", "success");
        router.push(`/trip/${tripId}`);
      } else {
        showToast(result.error || "Failed to save travel entry.", "error");
      }
    } catch (error) {
      console.error("Failed to save travel:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving travel.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loadingTrip) {
    return (
      <AuthGuard>
        <div
          className="p-6 text-center text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-label="Loading trip data"
        >
          <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
          <p>Loading trip data...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="w-full flex justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-background min-h-screen">
        <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground py-2 sm:py-4">
                  New Travel Entry
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Record a shared travel entry for this trip.
                </p>
              </div>

              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                  aria-label="Cancel and return to trip page"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTravel}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                  aria-label="Save travel entry"
                  aria-busy={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Travel"
                  )}
                </Button>
              </div>
            </div>
          </header>

          {/* Date and Applied To Selector */}
          <section aria-labelledby="date-selector-heading">
            <h2 id="date-selector-heading" className="sr-only">
              Date and Applied To Selection
            </h2>
            <DateAndAppliedToSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              appliedTo={appliedTo}
              onAppliedToChange={setAppliedTo}
              inviteOpen={inviteOpen}
              onInviteOpenChange={setInviteOpen}
              attendants={attendants}
            />
          </section>

          {/* Travel Form */}
          <section aria-labelledby="travel-form-heading">
            <h2 id="travel-form-heading" className="sr-only">
              Travel Entry Form
            </h2>
            <form
              id="travelForm"
              onSubmit={handleSaveTravel}
              className="flex flex-col gap-4 sm:gap-6"
              noValidate
              aria-label="Travel entry form"
            >
              <TravelForm
                value={formState}
                onChange={setFormState}
                tripId={tripId as string}
              />
            </form>
          </section>

          {/* Toast Container */}
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      </div>
    </AuthGuard>
  );
}

export default NewTravelPage;
