import { User, Users, Edit, Trash2 } from "lucide-react";
import {
  TravelSection,
  WorkSection,
  AccommodationSection,
  AdditionalSection,
} from "./LogSections";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
} from "@/app/types/DailyLog";
import { useState } from "react";

interface GroupedLog {
  id: string;
  date: string;
  userId: string;
  isGroup: boolean;
  appliedTo: string[];
  travels: TravelLog[];
  works: WorkTimeLog[];
  accommodations: AccommodationLog[];
  additionals: AdditionalLog[];
}

export default function DailyLogCard({
  group,
  userNames,
  loadingNames,
  tripId,
  onDelete,
}: {
  group: GroupedLog;
  userNames: Record<string, string>;
  loadingNames: boolean;
  tripId: string;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dateObj = new Date(group.date);

  const getName = (id: string) =>
    loadingNames ? "..." : userNames[id] || "Unknown";

  const firstLogId =
    group.travels[0]?._id ||
    group.works[0]?._id ||
    group.accommodations[0]?._id ||
    group.additionals[0]?._id;

  const handleEdit = () => {
    if (firstLogId) {
      router.push(`/editDailyLog/${firstLogId}`);
    } else {
      console.error("No log ID found to edit this group.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Extract date part (YYYY-MM-DD) from the date string
      const datePart = group.date.split("T")[0];

      const response = await fetch(
        `/api/logs?tripId=${tripId}&date=${datePart}&userId=${group.userId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete logs");
      }

      // Close dialog and refresh logs
      setShowDeleteDialog(false);
      onDelete();
    } catch (error) {
      console.error("Failed to delete logs:", error);
      alert("Failed to delete logs. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md relative">
        {/* ACTION BUTTONS */}
        {firstLogId && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
              onClick={handleEdit}
              title="Edit Log Group"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => setShowDeleteDialog(true)}
              title="Delete Log Group"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* LEFT: DATE & USER INFO */}
        <div className="bg-muted/30 p-5 md:w-64 flex flex-col md:border-r border-b md:border-b-0 gap-4 shrink-0">
          {/* Date */}
          <div className="text-center md:text-left">
            <div className="text-3xl font-black text-foreground">
              {dateObj.getDate()}
            </div>
            <div className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
              {dateObj.toLocaleDateString("en-US", {
                month: "short",
                weekday: "short",
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">
              {dateObj.getFullYear()}
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Creator */}
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
              Created By
            </span>
            <div className="flex items-center gap-2 font-medium text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span className="truncate">{getName(group.userId)}</span>
            </div>
          </div>

          {/* Attendants */}
          {group.appliedTo && group.appliedTo.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest flex items-center gap-1">
                <Users className="h-3 w-3" />
                Included ({group.appliedTo.length})
              </span>
              <div className="flex flex-col gap-1 pl-1">
                {group.appliedTo.map((attendantId) => (
                  <span
                    key={attendantId}
                    className="text-xs text-muted-foreground flex items-center gap-1.5"
                  >
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                    {getName(attendantId)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: CONTENT SECTIONS */}
        <div className="flex-1 p-6 space-y-8 bg-card">
          <TravelSection logs={group.travels} />
          <WorkSection logs={group.works} />
          <AccommodationSection logs={group.accommodations} />
          <AdditionalSection logs={group.additionals} />
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Logs</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your logs for this date? Logs from
              other users will remain.
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
