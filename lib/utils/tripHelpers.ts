import { Trip } from "@/app/types/Trip";
import { formDataToPayload } from "@/lib/utils/tripFormHelpers";

export async function saveTrip(
  tripId: string,
  payload: ReturnType<typeof formDataToPayload>,
): Promise<{ success: boolean; trip?: Trip; error?: string }> {
  try {
    const res = await fetch(`/api/trips/${tripId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return {
        success: false,
        error: errorData.error || "Unknown error",
      };
    }

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        trip: data.trip,
      };
    }

    return {
      success: false,
      error: "Failed to save trip",
    };
  } catch (error) {
    console.error("Failed to save trip:", error);
    return {
      success: false,
      error: "An error occurred while saving.",
    };
  }
}

export async function refreshTripData(
  tripId: string,
): Promise<{ success: boolean; trip?: Trip }> {
  try {
    const res = await fetch(`/api/trips/${tripId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          trip: data.trip,
        };
      }
    }
    return { success: false };
  } catch (error) {
    console.error("Failed to refresh trip:", error);
    return { success: false };
  }
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
  try {
    const res = await fetch(`/api/trips/${tripId}/end`, { method: "POST" });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Failed to end trip",
      };
    }

    const data = await res.json();
    return {
      success: data.success || false,
      error: data.success ? undefined : data.error || "Failed to end trip",
    };
  } catch (error) {
    console.error("Failed to end trip", error);
    return {
      success: false,
      error: "Failed to end trip",
    };
  }
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
  try {
    const validationError = validateImageFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/trips/${tripId}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Upload failed",
      };
    }

    const data = await response.json();
    if (!data.success) {
      return {
        success: false,
        error: data.error || "Upload failed",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function uploadFile(file: File): Promise<{
  success: boolean;
  file?: { url: string; name: string; type: string; size: number };
  error?: string;
}> {
  try {
    const validationError = validateImageFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const response = await fetch(
      `/api/upload?filename=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        body: file,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || `Upload failed with status ${response.status}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    const blob = await response.json();

    if (!blob || !blob.url) {
      return {
        success: false,
        error: "Invalid response from upload endpoint",
      };
    }

    return {
      success: true,
      file: {
        url: blob.url,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
