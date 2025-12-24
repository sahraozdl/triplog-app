import { Trip } from "@/app/types/Trip";
import {
  isoToDateString,
  dateStringToISO,
  validateDateRange,
} from "@/lib/utils/dateConversion";

export interface TripEditFormData {
  basicInfo: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    country: string;
    resort: string;
    departureLocation: string;
    arrivalLocation: string;
  };
  status: string;
}

export function initializeFormData(trip: Trip): TripEditFormData {
  return {
    basicInfo: {
      title: trip.basicInfo.title || "",
      description: trip.basicInfo.description || "",
      startDate: isoToDateString(trip.basicInfo.startDate) || "",
      endDate: isoToDateString(trip.basicInfo.endDate) || "",
      country: trip.basicInfo.country || "",
      resort: trip.basicInfo.resort || "",
      departureLocation: trip.basicInfo.departureLocation || "",
      arrivalLocation: trip.basicInfo.arrivalLocation || "",
    },
    status: trip.status || "active",
  };
}

export function validateFormData(data: TripEditFormData): {
  valid: boolean;
  errors: {
    title?: string;
    dateRange?: string;
  };
} {
  const errors: { title?: string; dateRange?: string } = {};

  if (!data.basicInfo.title.trim()) {
    errors.title = "Title is required";
  }

  if (
    data.basicInfo.startDate &&
    data.basicInfo.endDate &&
    !validateDateRange(data.basicInfo.startDate, data.basicInfo.endDate)
  ) {
    errors.dateRange = "End date must be on or after start date";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formDataToPayload(data: TripEditFormData) {
  return {
    basicInfo: {
      ...data.basicInfo,
      startDate: dateStringToISO(data.basicInfo.startDate),
      endDate: data.basicInfo.endDate
        ? dateStringToISO(data.basicInfo.endDate)
        : undefined,
    },
    status: data.status,
  };
}
