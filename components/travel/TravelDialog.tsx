"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TravelForm } from "./TravelForm";
import { DateAndAppliedToSelector } from "@/components/daily-log/DateAndAppliedToSelector";
import { Travel, TravelFormState } from "@/app/types/Travel";
import { TripAttendant } from "@/app/types/Trip";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Loader2 } from "lucide-react";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";

interface TravelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  attendants: TripAttendant[];
  travel?: Travel | null;
  onSuccess: () => void;
}

export function TravelDialog({
  open,
  onOpenChange,
  tripId,
  attendants,
  travel,
  onSuccess,
}: TravelDialogProps) {
  const user = useAppUser();
  const [isSaving, setIsSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [formState, setFormState] = useState<TravelFormState>({
    travelReason: "",
    vehicleType: "",
    departureLocation: "",
    destination: "",
    distance: null,
    isRoundTrip: false,
    startTime: "",
    endTime: "",
    appliedTo: [],
    isGroupSource: false,
    files: [],
  });

  // Initialize form when travel is provided (edit mode)
  useEffect(() => {
    if (travel) {
      setSelectedDate(travel.dateTime.split("T")[0]);
      setAppliedTo(travel.appliedTo || []);
      setFormState({
        travelReason: travel.travelReason || "",
        vehicleType: travel.vehicleType || "",
        departureLocation: travel.departureLocation || "",
        destination: travel.destination || "",
        distance: travel.distance || null,
        isRoundTrip: travel.isRoundTrip || false,
        startTime: travel.startTime || "",
        endTime: travel.endTime || "",
        appliedTo: travel.appliedTo || [],
        isGroupSource: travel.isGroupSource || false,
        files: travel.files || [],
      });
    } else {
      // Reset for new travel
      setSelectedDate("");
      setAppliedTo([]);
      setFormState({
        travelReason: "",
        vehicleType: "",
        departureLocation: "",
        destination: "",
        distance: null,
        isRoundTrip: false,
        startTime: "",
        endTime: "",
        appliedTo: [],
        isGroupSource: false,
        files: [],
      });
    }
  }, [travel, open]);

  const handleSave = async () => {
    if (!selectedDate) {
      alert("Please select a date for this travel entry.");
      return;
    }

    setIsSaving(true);

    try {
      const [year, month, day] = selectedDate.split("-").map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const isoDateString = utcDate.toISOString();

      const payload = {
        tripId,
        userId: user?.userId,
        dateTime: isoDateString,
        appliedTo,
        isGroupSource: appliedTo.length > 0,
        ...formState,
        files: formState.files || [],
      };

      if (travel) {
        // Update existing travel
        const response = await fetch(`/api/travels/${travel._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to update travel");
        }
      } else {
        // Create new travel
        const response = await fetch("/api/travels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to create travel");
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save travel:", error);
      alert("An error occurred while saving travel.");
    } finally {
      setIsSaving(false);
    }
  };

  const attendantUserIds = attendants.map((a) => a.userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {travel ? "Edit Travel" : "New Travel Entry"}
          </DialogTitle>
          <DialogDescription>
            Record a shared travel entry for this trip.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
          <TravelForm
            value={formState}
            onChange={setFormState}
            tripId={tripId}
            attendants={attendantUserIds}
            appliedTo={appliedTo}
            onAppliedToChange={setAppliedTo}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : travel ? (
              "Update Travel"
            ) : (
              "Create Travel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
