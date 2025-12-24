"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateAndAppliedToSelector } from "@/components/form-elements/DateAndAppliedToSelector";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Loader2, ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Travel, TravelFormState } from "@/app/types/Travel";
import { Trip, TripAttendant } from "@/app/types/Trip";
import { useTripStore } from "@/lib/store/useTripStore";
import { TravelForm } from "@/components/travel/TravelForm";

export default function EditTravelPage() {
  const router = useRouter();
  const { travelId } = useParams();
  const user = useAppUser();

  const { getTrip, updateTrip } = useTripStore();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [travel, setTravel] = useState<Travel | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
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
    if (!travelId) return;

    async function fetchTravel() {
      setLoading(true);
      try {
        const res = await fetch(`/api/travels/${travelId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch travel");
        }
        const travelData = (await res.json()) as Travel;
        setTravel(travelData);

        const tripRes = await fetch(`/api/trips/${travelData.tripId}`, {
          cache: "no-store",
        });
        if (tripRes.ok) {
          const tripData = (await tripRes.json()) as {
            success: boolean;
            trip: Trip;
          };
          if (tripData.success) {
            setTrip(tripData.trip);
            updateTrip(tripData.trip);
          }
        }

        setSelectedDate(travelData.dateTime.split("T")[0]);
        setAppliedTo(travelData.appliedTo || []);
        setFormState({
          travelReason: travelData.travelReason || "",
          vehicleType: travelData.vehicleType || "",
          departureLocation: travelData.departureLocation || "",
          destination: travelData.destination || "",
          distance: travelData.distance || null,
          isRoundTrip: travelData.isRoundTrip || false,
          startTime: travelData.startTime || "",
          endTime: travelData.endTime || "",
          files: travelData.files || [],
        });
      } catch (error) {
        console.error("Failed to load travel:", error);
        alert("Failed to load travel entry.");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchTravel();
  }, [travelId, router, updateTrip]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!travel || !selectedDate) return;

    setIsSaving(true);
    try {
      const [year, month, day] = selectedDate.split("-").map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const isoDateString = utcDate.toISOString();
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

      const payload = {
        tripId: travel.tripId,
        userId: travel.userId,
        dateTime: isoDateString,
        appliedTo,
        isGroupSource: appliedTo.length > 0,
        travelReason: formState.travelReason || "",
        vehicleType: formState.vehicleType || "",
        departureLocation: formState.departureLocation || "",
        destination: formState.destination || "",
        distance: formState.distance || null,
        isRoundTrip: formState.isRoundTrip || false,
        startTime: formState.startTime || "",
        endTime: formState.endTime || "",
        files: files,
      };

      const response = await fetch(`/api/travels/${travel._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update travel");
      }

      router.push(`/trips/${travel.tripId}`);
    } catch (error) {
      console.error("Failed to save travel:", error);
      alert("An error occurred while saving travel.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading || !travel || !trip) {
    return (
      <AuthGuard>
        <div className="p-6 text-center text-muted-foreground">
          Loading travel entry...
        </div>
      </AuthGuard>
    );
  }

  const attendants: TripAttendant[] = trip.attendants ?? [];
  const attendantUserIds = attendants.map((a) => a.userId);
  const canEdit = user?.userId === travel.userId;

  if (!canEdit) {
    return (
      <AuthGuard>
        <div className="p-6 text-center text-muted-foreground">
          You don't have permission to edit this travel entry.
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="w-full flex justify-center px-4 py-8 bg-background min-h-screen">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/trips/${travel.tripId}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-foreground py-4">
                Edit Travel Entry
              </h1>
              <p className="text-muted-foreground">
                Update travel details for this trip.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/trips/${travel.tripId}`)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Update Travel"
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
            onSubmit={handleSave}
            className="flex flex-col gap-6"
          >
            <TravelForm
              value={formState}
              onChange={setFormState}
              tripId={travel.tripId}
            />
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
