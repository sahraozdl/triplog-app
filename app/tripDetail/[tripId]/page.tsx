"use client";

import { useTripStore } from "@/lib/store/useTripStore";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyLogFormState } from "@/app/types/DailyLog";
import DailyLogsList from "@/components/trip/DailyLogsList";
import { TripAttendant } from "@/app/types/Trip";
import DownloadReportButton from "@/components/trip/DownloadReportButton";
import { TripInfoCard } from "@/components/trip/TripInfoCard";
import { TripEditInline } from "@/components/trip/TripEditInline";
import { formDataToPayload } from "@/components/trip/TripEditForm";
import { Edit } from "lucide-react";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { TripFileUpload } from "@/components/trip/TripFileUpload";
import { TripFilesList } from "@/components/trip/TripFilesList";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, FileText } from "lucide-react";

type EditMode = "display" | "inline";

export default function TripDetailPage() {
  const router = useRouter();
  const { tripId } = useParams();
  const { updateTrip } = useTripStore();
  const user = useAppUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>("display");
  const { toasts, showToast, removeToast } = useToast();

  const trip = useTripStore((state) => state.getTrip(tripId as string));
  const [logs, setLogs] = useState<DailyLogFormState[]>([]);
  const [filesOpen, setFilesOpen] = useState(false);

  // Check if user can edit (creator or moderator)
  const canEdit =
    trip &&
    user &&
    (trip.creatorId === user.userId ||
      trip.attendants?.some(
        (a) => a.userId === user.userId && a.role === "moderator",
      ));

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/daily-logs?tripId=${tripId}`);

      if (!res.ok) {
        console.error("Logs could not be fetched, Status:", res.status);
        setLogs([]);
        return;
      }

      const data = await res.json();
      setLogs((data.logs || []) as DailyLogFormState[]);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([]);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchLogs();
    }
  }, [tripId]);

  async function handleEndTrip() {
    try {
      await fetch(`/api/trips/${tripId}/end`, { method: "POST" });
      useTripStore.getState().removeTrip(tripId as string);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to end trip", error);
      alert("Failed to end trip");
    }
  }

  useEffect(() => {
    if (trip) return;

    async function fetchTrip() {
      setLoading(true);
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) updateTrip(data.trip);
        }
      } catch (e) {
        console.error("Trip load failed", e);
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId, trip, updateTrip]);

  const handleSave = async (payload: ReturnType<typeof formDataToPayload>) => {
    if (!tripId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          updateTrip(data.trip);
          // Refresh the trip data
          const refreshRes = await fetch(`/api/trips/${tripId}`);
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.success) {
              updateTrip(refreshData.trip);
              // Exit edit mode
              setEditMode("display");
            }
          }
        }
      } else {
        const errorData = await res.json();
        alert("Failed to save: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to save trip:", error);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setEditMode("inline");
  };

  const handleCancel = () => {
    setEditMode("display");
  };

  const handleUploadSuccess = async () => {
    showToast("File uploaded", "success");
    // Refresh trip data to get updated additionalFiles
    await refreshTrip();
  };

  const refreshTrip = async () => {
    if (tripId) {
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            updateTrip(data.trip);
          }
        }
      } catch (error) {
        console.error("Failed to refresh trip:", error);
      }
    }
  };

  const handleUploadError = (error: string) => {
    showToast(error, "error");
  };

  if (!trip || loading)
    return (
      <div className="p-6 text-center text-lg text-muted-foreground">
        Loading trip details...
      </div>
    );

  // Files section component (reusable for both desktop and mobile)
  const FilesSection = () => (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <h2 className="text-xl font-semibold text-foreground shrink-0">
        Trip Files
      </h2>

      {canEdit && (
        <div className="shrink-0">
          <TripFileUpload
            tripId={tripId as string}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            disabled={saving || loading}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        <TripFilesList
          files={trip.additionalFiles || []}
          tripId={tripId as string}
          canDelete={canEdit}
          onDelete={async () => {
            showToast("File deleted", "success");
            await refreshTrip();
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Mobile: Collapsible Files Section */}
      <div className="lg:hidden mb-6">
        <Collapsible open={filesOpen} onOpenChange={setFilesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Trip Files</span>
                {trip.additionalFiles && trip.additionalFiles.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {trip.additionalFiles.length}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  filesOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="border rounded-lg p-4 bg-card">
              <FilesSection />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Content Column (4/5 width) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Header with Edit Control */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Trip Details
            </h1>
            {canEdit && editMode === "display" && (
              <Button variant="outline" onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>

          {/* Trip Info Card or Edit Form */}
          {editMode === "inline" ? (
            <TripEditInline
              trip={trip}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={saving}
            />
          ) : (
            <TripInfoCard trip={trip} />
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-4 w-full sm:w-auto">
              <Button
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={handleEndTrip}
              >
                End Trip
              </Button>

              <DownloadReportButton trip={trip} logs={logs} />
              <Button
                variant="outline"
                onClick={() => router.push(`/reports/${tripId}`)}
              >
                View Report
              </Button>
            </div>

            <Button
              className="w-full sm:w-auto"
              onClick={() => router.push(`/newDailyLog/${tripId}`)}
            >
              New Daily Log
            </Button>
          </div>

          {/* Daily Logs */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-foreground">
              Daily Logs
            </h2>

            {logs.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground text-sm">
                  No logs recorded yet.
                </p>
              </div>
            ) : (
              <DailyLogsList
                logs={logs}
                attendants={trip.attendants as TripAttendant[]}
                tripId={tripId as string}
                onLogsChange={fetchLogs}
              />
            )}
          </div>
        </div>

        {/* Files Sidebar Column (1/5 width) - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-8 border rounded-lg p-4 bg-card h-[calc(100vh-4rem)] flex flex-col">
            <FilesSection />
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
