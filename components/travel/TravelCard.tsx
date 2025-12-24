"use client";

import { Plane } from "lucide-react";
import { Travel } from "@/app/types/Travel";
import { useState } from "react";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { TravelCardHeader } from "./TravelCardHeader";
import { TravelCardMetadata } from "./TravelCardMetadata";
import { TravelCardActions } from "./TravelCardActions";
import { TravelCardRoute } from "./TravelCardRoute";
import { TravelCardDetails } from "./TravelCardDetails";
import { TravelCardTime } from "./TravelCardTime";
import { TravelCardFiles } from "./TravelCardFiles";
import { TravelDeleteDialog } from "./TravelDeleteDialog";

interface TravelCardProps {
  travel: Travel;
  userNames: Record<string, string>;
  loadingNames: boolean;
  tripId: string;
  onDelete: () => void;
  onEdit: (travel: Travel) => void;
}

export function TravelCard({
  travel,
  userNames,
  loadingNames,
  tripId,
  onEdit,
  onDelete,
}: TravelCardProps) {
  const user = useAppUser();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dateObj = new Date(travel.dateTime);

  const canEdit = user?.userId === travel.userId;

  const getName = (id: string) =>
    loadingNames ? "..." : userNames[id] || "Unknown";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/travels/${travel._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete travel");
      }

      setShowDeleteDialog(false);
      onDelete();
    } catch (error) {
      console.error("Failed to delete travel:", error);
      alert("Failed to delete travel. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const participants = [travel.userId, ...travel.appliedTo];
  const uniqueParticipants = Array.from(new Set(participants));
  const participantNames = uniqueParticipants.map(getName);

  return (
    <>
      <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md relative">
        <TravelCardActions
          canEdit={canEdit}
          onEdit={() => onEdit(travel)}
          onDelete={() => setShowDeleteDialog(true)}
        />

        {/* LEFT: DATE & USER INFO */}
        <div className="bg-muted/30 p-3 sm:p-4 md:w-44 lg:w-48 flex flex-col md:border-r border-b md:border-b-0 gap-2.5 sm:gap-3 shrink-0">
          <TravelCardHeader date={dateObj} />
          <hr className="border-border/60" />
          <TravelCardMetadata
            creatorName={getName(travel.userId)}
            participants={uniqueParticipants}
            participantNames={participantNames}
          />
        </div>

        {/* RIGHT: CONTENT */}
        <div className="flex-1 p-3 sm:p-4 md:p-5 bg-card">
          <div className="flex items-center gap-2 mb-2.5 sm:mb-3 text-muted-foreground uppercase tracking-widest text-[10px] sm:text-xs font-bold">
            <Plane className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>Travel</span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {travel.travelReason && (
              <div className="font-semibold text-foreground text-sm sm:text-base">
                {travel.travelReason}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <TravelCardRoute
                departureLocation={travel.departureLocation}
                destination={travel.destination}
              />
              <TravelCardDetails
                vehicleType={travel.vehicleType}
                distance={travel.distance ?? undefined}
                isRoundTrip={travel.isRoundTrip}
              />
            </div>

            <TravelCardTime
              startTime={travel.startTime}
              endTime={travel.endTime}
            />

            {travel.files && travel.files.length > 0 && (
              <TravelCardFiles files={travel.files} />
            )}
          </div>
        </div>
      </div>

      <TravelDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
