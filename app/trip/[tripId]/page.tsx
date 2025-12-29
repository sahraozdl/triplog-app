"use client";

import { useTripStore } from "@/lib/store/useTripStore";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyLogFormState } from "@/app/types/DailyLog";
import DailyLogsList from "@/components/daily-log/DailyLogsList";
import { TravelEntriesList } from "@/components/travel/TravelEntriesList";
import { TripAttendant } from "@/app/types/Trip";
import { DownloadReportButton } from "@/components/trip/DownloadReportButton";
import { TripInfoCard } from "@/components/trip/TripInfoCard";
import { TripEditInline } from "@/components/trip/TripEditInline";
import { Edit } from "lucide-react";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { FilesSection } from "@/components/trip/FilesSection";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import {
  createHandleSave,
  createHandleEdit,
  createHandleCancel,
  createRefreshTrip,
  createHandleUploadSuccess,
  createHandleUploadError,
  createHandleFileDelete,
  createHandleEndTrip,
} from "@/lib/utils/tripHelpers";
import {
  createFetchLogs,
  createFetchTravels,
  extractUserIdsFromLogsAndTravels,
  fetchUsersData,
} from "@/lib/utils/fetchers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, FileText } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Travel } from "@/app/types/Travel";

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
  const [travels, setTravels] = useState<Travel[]>([]);
  const [filesOpen, setFilesOpen] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loadingNames, setLoadingNames] = useState(false);

  const canEdit =
    (trip &&
      user &&
      (trip.creatorId === user.userId ||
        trip.attendants?.some(
          (a) => a.userId === user.userId && a.role === "moderator",
        ))) ||
    false;
  const fetchLogs = useCallback(createFetchLogs(tripId as string, setLogs), [
    tripId,
  ]);

  const fetchTravels = useCallback(
    createFetchTravels(tripId as string, setTravels),
    [tripId],
  );

  useEffect(() => {
    if (!tripId) return;
    fetchLogs();
    fetchTravels();
  }, [tripId, fetchLogs, fetchTravels]);

  useEffect(() => {
    if (logs.length === 0 && travels.length === 0) {
      setUserNames({});
      setLoadingNames(false);
      return;
    }

    let cancelled = false;
    setLoadingNames(true);

    const userIds = extractUserIdsFromLogsAndTravels(logs, travels);
    fetchUsersData(userIds, false)
      .then((result) => {
        if (!cancelled) {
          if (result.success && result.users) {
            setUserNames(result.users);
          } else {
            setUserNames({});
          }
          setLoadingNames(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to fetch user names:", error);
          setUserNames({});
          setLoadingNames(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [logs, travels]);

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

  const refreshTrip = createRefreshTrip(tripId as string, updateTrip);
  const handleSave = createHandleSave(
    tripId as string,
    updateTrip,
    setSaving,
    setEditMode,
  );
  const handleEdit = createHandleEdit(setEditMode);
  const handleCancel = createHandleCancel(setEditMode);
  const handleUploadSuccess = createHandleUploadSuccess(showToast, refreshTrip);
  const handleUploadError = createHandleUploadError(showToast);
  const handleFileDelete = createHandleFileDelete(showToast, refreshTrip);
  const handleEndTrip = createHandleEndTrip(
    tripId as string,
    useTripStore.getState().removeTrip,
    router,
  );

  if (!trip || loading)
    return (
      <AuthGuard>
        <div className="p-6 text-center text-lg text-muted-foreground">
          Loading trip details...
        </div>
      </AuthGuard>
    );

  return (
    <AuthGuard>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Mobile: Collapsible Files Section */}
        <div className="lg:hidden mb-4 sm:mb-6">
          <Collapsible open={filesOpen} onOpenChange={setFilesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base font-medium">
                    Trip Files
                  </span>
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
            <CollapsibleContent className="mt-3 sm:mt-4">
              <div className="border rounded-lg p-3 sm:p-4 bg-card">
                <FilesSection
                  tripId={tripId as string}
                  files={trip.additionalFiles || []}
                  canEdit={canEdit}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  onDelete={handleFileDelete}
                  showToast={showToast}
                  refreshTrip={refreshTrip}
                  disabled={saving || loading}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground wrap-break-word">
                Trip Details
              </h1>
              <div className="flex flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                {canEdit && editMode === "display" && (
                  <Button variant="outline" onClick={handleEdit} size="sm">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button variant="destructive" onClick={handleEndTrip} size="sm">
                  End Trip
                </Button>
              </div>
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
            <div className="flex flex-col sm:flex-row md:flex-row justify-between gap-5 sm:gap-4">
              <div className="flex flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                <DownloadReportButton
                  trip={trip}
                  logs={logs}
                  travels={travels}
                />
                <Button
                  variant="outline"
                  onClick={() => router.push(`/reports/${tripId}`)}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  View Report
                </Button>
              </div>

              <div className="flex flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => router.push(`/newTravel/${tripId}`)}
                  size="sm"
                >
                  New Travel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => router.push(`/newDailyLog/${tripId}`)}
                  size="sm"
                >
                  New Daily Log
                </Button>
              </div>
            </div>

            {/* Travel Entries */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground wrap-break-word">
                Travel Entries
              </h2>

              <TravelEntriesList
                travels={travels}
                userNames={userNames}
                loadingNames={loadingNames}
                tripId={tripId as string}
                onTravelsChange={fetchTravels}
              />
            </div>

            {/* Daily Logs */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground wrap-break-word">
                Daily Logs
              </h2>

              {logs.length === 0 ? (
                <div className="text-center py-6 sm:py-8 border border-dashed rounded-lg bg-muted/10">
                  <p className="text-muted-foreground text-sm sm:text-base">
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
            <div className="sticky top-4 sm:top-8 border rounded-lg p-4 bg-card h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] flex flex-col">
              <FilesSection
                tripId={tripId as string}
                files={trip.additionalFiles || []}
                canEdit={canEdit}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                onDelete={handleFileDelete}
                showToast={showToast}
                refreshTrip={refreshTrip}
                disabled={saving || loading}
              />
            </div>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </AuthGuard>
  );
}
