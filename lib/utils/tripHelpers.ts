import { Trip } from "@/app/types/Trip";
import { formDataToPayload } from "@/lib/utils/tripFormHelpers";
import { handleApiRequest } from "./apiErrorHandler";

export async function saveTrip(
  tripId: string,
  payload: ReturnType<typeof formDataToPayload>,
): Promise<{ success: boolean; trip?: Trip; error?: string }> {
  const result = await handleApiRequest<{ success: boolean; trip?: Trip }>(
    `/api/trips/${tripId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      errorPrefix: "Failed to save trip",
    },
  );

  if (result.success && result.data?.success && result.data.trip) {
    return {
      success: true,
      trip: result.data.trip,
    };
  }

  return {
    success: false,
    error: result.error || "Failed to save trip",
  };
}

export async function refreshTripData(
  tripId: string,
): Promise<{ success: boolean; trip?: Trip }> {
  const result = await handleApiRequest<{ success: boolean; trip?: Trip }>(
    `/api/trips/${tripId}`,
    {
      errorPrefix: "Failed to refresh trip",
    },
  );

  if (result.success && result.data?.success && result.data.trip) {
    return {
      success: true,
      trip: result.data.trip,
    };
  }

  return { success: false };
}

export function createHandleSave(
  tripId: string,
  updateTrip: (trip: Trip) => void,
  setSaving: (saving: boolean) => void,
  setEditMode?: (mode: "display" | "inline") => void,
) {
  return async (payload: ReturnType<typeof formDataToPayload>) => {
    if (!tripId) return;

    setSaving(true);
    try {
      const result = await saveTrip(tripId, payload);

      if (result.success && result.trip) {
        updateTrip(result.trip);
        const refreshResult = await refreshTripData(tripId);
        if (refreshResult.success && refreshResult.trip) {
          updateTrip(refreshResult.trip);
          if (setEditMode) {
            setEditMode("display");
          }
        }
      } else {
        alert("Failed to save: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to save trip:", error);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };
}

export function createHandleEdit(
  setEditMode: (mode: "display" | "inline") => void,
) {
  return () => {
    setEditMode("inline");
  };
}

export function createHandleCancel(
  setEditMode: (mode: "display" | "inline") => void,
) {
  return () => {
    setEditMode("display");
  };
}

export function createRefreshTrip(
  tripId: string,
  updateTrip: (trip: Trip) => void,
) {
  return async () => {
    if (tripId) {
      const result = await refreshTripData(tripId);
      if (result.success && result.trip) {
        updateTrip(result.trip);
      }
    }
  };
}

export function createHandleUploadSuccess(
  showToast: (message: string, type?: "success" | "error") => void,
  refreshTrip: () => Promise<void>,
) {
  return async () => {
    showToast("File uploaded", "success");
    await refreshTrip();
  };
}

export function createHandleUploadError(
  showToast: (message: string, type?: "success" | "error") => void,
) {
  return (error: string) => {
    showToast(error, "error");
  };
}

export function createHandleFileDelete(
  showToast: (message: string, type?: "success" | "error") => void,
  refreshTrip: () => Promise<void>,
) {
  return async () => {
    showToast("File deleted", "success");
    await refreshTrip();
  };
}

export async function endTrip(
  tripId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await handleApiRequest<{ success: boolean; error?: string }>(
    `/api/trips/${tripId}/end`,
    {
      method: "POST",
      errorPrefix: "Failed to end trip",
    },
  );

  if (result.success && result.data?.success) {
    return {
      success: true,
    };
  }

  return {
    success: false,
    error: result.error || result.data?.error || "Failed to end trip",
  };
}

export function createHandleEndTrip(
  tripId: string,
  removeTrip: (id: string) => void,
  router: { push: (path: string) => void },
) {
  return async () => {
    try {
      const result = await endTrip(tripId);
      if (result.success) {
        removeTrip(tripId);
        router.push("/dashboard");
      } else {
        alert(result.error || "Failed to end trip");
      }
    } catch (error) {
      console.error("Failed to end trip", error);
      alert("Failed to end trip");
    }
  };
}

export function validateImageFile(file: File): string | null {
  const validImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

  const hasValidMime = validImageTypes.some((type) =>
    file.type.toLowerCase().startsWith(type),
  );
  const hasValidExtension = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  if (!hasValidMime && !hasValidExtension) {
    return "Invalid file type. Only images are allowed.";
  }

  return null;
}

export async function uploadTripFile(
  tripId: string,
  file: File,
): Promise<{ success: boolean; error?: string }> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const formData = new FormData();
  formData.append("file", file);

  const result = await handleApiRequest<{ success: boolean; error?: string }>(
    `/api/trips/${tripId}/upload`,
    {
      method: "POST",
      body: formData,
      errorPrefix: "Upload failed",
    },
  );

  if (result.success && result.data?.success) {
    return { success: true };
  }

  return {
    success: false,
    error: result.error || result.data?.error || "Upload failed",
  };
}

export async function uploadFile(file: File): Promise<{
  success: boolean;
  file?: { url: string; name: string; type: string; size: number };
  error?: string;
}> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const result = await handleApiRequest<{ url: string }>(
    `/api/upload?filename=${encodeURIComponent(file.name)}`,
    {
      method: "POST",
      body: file,
      errorPrefix: "Upload failed",
    },
  );

  if (result.success && result.data?.url) {
    return {
      success: true,
      file: {
        url: result.data.url,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    };
  }

  return {
    success: false,
    error: result.error || "Invalid response from upload endpoint",
  };
}
