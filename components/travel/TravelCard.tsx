"use client";

import { User, Users, Edit, Trash2, Plane, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Travel } from "@/app/types/Travel";
import { useState } from "react";
import { useAppUser } from "@/components/providers/AppUserProvider";

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
  onDelete,
  onEdit,
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

  return (
    <>
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md relative">
        {/* ACTION BUTTONS */}
        {canEdit && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => onEdit(travel)}
              title="Edit Travel"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => setShowDeleteDialog(true)}
              title="Delete Travel"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* LEFT: DATE & USER INFO */}
        <div className="bg-muted/30 p-4 md:w-48 flex flex-col md:border-r border-b md:border-b-0 gap-3 shrink-0">
          {/* Date */}
          <div className="text-center md:text-left">
            <div className="text-2xl font-black text-foreground">
              {dateObj.getDate()}
            </div>
            <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              {dateObj.toLocaleDateString("en-US", {
                month: "short",
                weekday: "short",
              })}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              {dateObj.getFullYear()}
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Creator */}
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest">
              Created By
            </span>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <User className="h-3 w-3 text-primary" />
              <span className="truncate">{getName(travel.userId)}</span>
            </div>
          </div>

          {/* Participants */}
          {uniqueParticipants.length > 1 && (
            <div className="flex flex-col gap-1.5 mt-0.5">
              <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest flex items-center gap-1">
                <Users className="h-3 w-3" />
                Participants ({uniqueParticipants.length})
              </span>
              <div className="flex flex-col gap-1 pl-0.5">
                {uniqueParticipants.slice(0, 3).map((participantId) => (
                  <span
                    key={participantId}
                    className="text-[10px] text-muted-foreground flex items-center gap-1"
                  >
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                    {getName(participantId)}
                  </span>
                ))}
                {uniqueParticipants.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{uniqueParticipants.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: CONTENT */}
        <div className="flex-1 p-4 bg-card">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
            <Plane className="h-3.5 w-3.5" />
            Travel
          </div>

          <div className="space-y-3">
            {travel.travelReason && (
              <div className="font-semibold text-foreground text-sm">
                {travel.travelReason}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
                  Route
                </div>
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">
                    {travel.departureLocation}{" "}
                    <span className="text-muted-foreground">→</span>{" "}
                    {travel.destination}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
                  Details
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {travel.vehicleType && (
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] capitalize font-medium">
                      {travel.vehicleType}
                    </span>
                  )}
                  {travel.distance && (
                    <span className="text-[10px]">{travel.distance} km</span>
                  )}
                  {travel.isRoundTrip && (
                    <span className="text-[10px] italic text-muted-foreground">
                      (Round Trip)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {(travel.startTime || travel.endTime) && (
              <div className="space-y-1">
                <div className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
                  Time
                </div>
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {travel.startTime || "?"} - {travel.endTime || "?"}
                </div>
              </div>
            )}

            {travel.files && travel.files.length > 0 && (
              <div className="space-y-1 mt-2">
                <div className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
                  Route Images ({travel.files.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {travel.files.slice(0, 3).map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline"
                    >
                      {file.name}
                    </a>
                  ))}
                  {travel.files.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{travel.files.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Travel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this travel entry? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
