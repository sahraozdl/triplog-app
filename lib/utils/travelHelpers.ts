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

import { handleApiRequest } from "./apiErrorHandler";

/**
 * Saves travel entry via API
 */
export async function saveTravelEntry(
  payload: TravelPayload,
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const result = await handleApiRequest<unknown>("/api/travels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    errorPrefix: "Failed to create travel",
    includeDetails: true,
  });

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Loads trip data from API
 */
export async function loadTripData(
  tripId: string,
): Promise<{ success: boolean; trip?: unknown; error?: string }> {
  const result = await handleApiRequest<{ success: boolean; trip?: unknown }>(
    `/api/trips/${tripId}`,
    {
      cache: "no-store",
      errorPrefix: "Failed to load trip",
    },
  );

  if (result.success && result.data?.success && result.data.trip) {
    return { success: true, trip: result.data.trip };
  }

  return {
    success: false,
    error: result.error || "Failed to load trip data",
  };
}
