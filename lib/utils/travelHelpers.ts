import { TravelFormState } from "@/app/types/Travel";
import { UploadedFile } from "@/app/types/DailyLog";
import { dateStringToISO } from "./dateConversion";

export interface TravelPayload {
  tripId: string;
  userId: string;
  dateTime: string;
  appliedTo: string[];
  isGroupSource: boolean;
  travelReason: string;
  vehicleType: string;
  departureLocation: string;
  destination: string;
  distance: number | null;
  isRoundTrip: boolean;
  startTime: string;
  endTime: string;
  files: Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
}

/**
 * Converts a date string (YYYY-MM-DD) to ISO string format
 */
export function convertDateToISO(dateString: string): string {
  return dateStringToISO(dateString);
}

/**
 * Builds the travel payload from form state and other parameters
 */
export function buildTravelPayload(
  tripId: string,
  userId: string,
  selectedDate: string,
  appliedTo: string[],
  formState: TravelFormState,
): TravelPayload {
  const isoDateString = convertDateToISO(selectedDate);

  // Validate and filter files to ensure all required fields are present
  const validFiles = Array.isArray(formState.files)
    ? formState.files
        .filter((f: UploadedFile) => {
          // Only include files that have all required fields
          return (
            f &&
            typeof f === "object" &&
            f.url &&
            f.name &&
            f.type &&
            typeof f.size === "number"
          );
        })
        .map((f: UploadedFile) => ({
          name: String(f.name || ""),
          type: String(f.type || ""),
          url: String(f.url || ""),
          size: Number(f.size || 0),
        }))
    : [];

  return {
    tripId: String(tripId || ""),
    userId: String(userId || ""),
    dateTime: isoDateString || new Date().toISOString(),
    appliedTo: Array.isArray(appliedTo) ? appliedTo : [],
    isGroupSource: appliedTo.length > 0,
    travelReason: String(formState.travelReason || ""),
    vehicleType: String(formState.vehicleType || ""),
    departureLocation: String(formState.departureLocation || ""),
    destination: String(formState.destination || ""),
    distance:
      formState.distance !== undefined && formState.distance !== null
        ? Number(formState.distance)
        : null,
    isRoundTrip: Boolean(formState.isRoundTrip),
    startTime: String(formState.startTime || ""),
    endTime: String(formState.endTime || ""),
    files: validFiles,
  };
}

/**
 * Validates travel form data before submission
 */
export function validateTravelForm(
  selectedDate: string,
  formState: TravelFormState,
): { isValid: boolean; error?: string } {
  if (!selectedDate) {
    return {
      isValid: false,
      error: "Please select a date for this travel entry.",
    };
  }

  if (!formState.departureLocation?.trim()) {
    return {
      isValid: false,
      error: "Please enter a departure location.",
    };
  }

  if (!formState.destination?.trim()) {
    return {
      isValid: false,
      error: "Please enter a destination.",
    };
  }

  return { isValid: true };
}

/**
 * Saves travel entry via API
 */
export async function saveTravelEntry(
  payload: TravelPayload,
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  try {
    const response = await fetch("/api/travels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Try to parse error response, but handle empty or invalid JSON
      let errorMessage = `Failed to create travel (${response.status})`;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage =
              errorData?.error || errorData?.message || errorMessage;

            // Include validation details if available
            if (errorData?.details && Array.isArray(errorData.details)) {
              const details = errorData.details
                .map((d: any) => `${d.path}: ${d.message}`)
                .join(", ");
              errorMessage += ` - ${details}`;
            }
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, use the status text or default message
        const statusText = response.statusText;
        errorMessage = statusText || errorMessage;
        console.error("Failed to parse error response:", parseError);
      }

      return { success: false, error: errorMessage };
    }

    // Parse success response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return { success: true, data };
    }

    // If response is not JSON, still consider it successful if status is OK
    return { success: true };
  } catch (error) {
    console.error("Failed to save travel:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}

/**
 * Loads trip data from API
 */
export async function loadTripData(
  tripId: string,
): Promise<{ success: boolean; trip?: unknown; error?: string }> {
  try {
    const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
    const data = (await res.json()) as { success: boolean; trip: unknown };

    if (data.success) {
      return { success: true, trip: data.trip };
    }

    return { success: false, error: "Failed to load trip data" };
  } catch (error) {
    console.error("Failed to load trip", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load trip",
    };
  }
}
