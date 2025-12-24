"use client";

import { useMemo } from "react";
import FileDropzone from "@/components/form-elements/FileDropzone";
import {
  uploadTripFile,
  createHandleUploadSuccess,
} from "@/lib/utils/tripHelpers";

interface TripFileUploadProps {
  tripId: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  showToast?: (message: string, type?: "success" | "error") => void;
  refreshTrip?: () => Promise<void>;
  disabled?: boolean;
}

export function TripFileUpload({
  tripId,
  onUploadSuccess,
  onUploadError,
  showToast,
  refreshTrip,
  disabled = false,
}: TripFileUploadProps) {
  const handleUploadSuccess = useMemo(() => {
    if (showToast && refreshTrip) {
      return createHandleUploadSuccess(showToast, refreshTrip);
    }
    return onUploadSuccess || (() => {});
  }, [showToast, refreshTrip, onUploadSuccess]);

  const customUpload = useMemo(
    () => async (file: File) => {
      const result = await uploadTripFile(tripId, file);
      return {
        success: result.success,
        error: result.error,
        file: undefined,
      };
    },
    [tripId],
  );

  return (
    <FileDropzone
      customUpload={customUpload}
      onUploadSuccess={handleUploadSuccess}
      onUploadError={onUploadError}
      showToast={showToast}
      hideFileList={true}
      disabled={disabled}
      uploadText="Upload images to this trip"
      uploadSubtext="Drag and drop images here, or click to select. Supported: JPG, PNG, GIF, WEBP, SVG"
      className=""
    />
  );
}
