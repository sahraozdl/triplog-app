"use client";

import { TripAdditionalFile } from "@/app/types/Trip";
import { TripFileUpload } from "@/components/trip/TripFileUpload";
import { TripFilesList } from "@/components/trip/TripFilesList";

interface FilesSectionProps {
  tripId: string;
  files: TripAdditionalFile[];
  canEdit: boolean;
  onUploadSuccess: () => void;
  onUploadError: (error: string) => void;
  onDelete: () => void;
  showToast?: (message: string, type?: "success" | "error") => void;
  refreshTrip?: () => Promise<void>;
  disabled?: boolean;
}

export function FilesSection({
  tripId,
  files,
  canEdit,
  onUploadSuccess,
  onUploadError,
  onDelete,
  showToast,
  refreshTrip,
  disabled = false,
}: FilesSectionProps) {
  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <h2 className="text-xl font-semibold text-foreground shrink-0">
        Trip Files
      </h2>

      {canEdit && (
        <div className="shrink-0">
          <TripFileUpload
            tripId={tripId}
            onUploadSuccess={onUploadSuccess}
            onUploadError={onUploadError}
            showToast={showToast}
            refreshTrip={refreshTrip}
            disabled={disabled}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        <TripFilesList
          files={files}
          tripId={tripId}
          canDelete={canEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
