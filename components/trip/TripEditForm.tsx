"use client";

import { Trip } from "@/app/types/Trip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationInput from "@/components/form-elements/LocationInput";
import {
  isoToDateString,
  dateStringToISO,
  validateDateRange,
} from "@/lib/utils/dateConversion";
import { useState, useEffect } from "react";

export interface TripEditFormData {
  basicInfo: {
    title: string;
    description: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    country: string;
    resort: string;
    departureLocation: string;
    arrivalLocation: string;
  };
  status: string;
}

interface TripEditFormProps {
  trip: Trip;
  value: TripEditFormData;
  onChange: (data: TripEditFormData) => void;
  errors?: {
    title?: string;
    dateRange?: string;
  };
}

export function TripEditForm({
  trip,
  value,
  onChange,
  errors,
}: TripEditFormProps) {
  const handleChange = (
    field: keyof TripEditFormData["basicInfo"],
    val: string,
  ) => {
    onChange({
      ...value,
      basicInfo: {
        ...value.basicInfo,
        [field]: val,
      },
    });
  };

  const handleStatusChange = (status: string) => {
    onChange({
      ...value,
      status,
    });
  };

  // Validate date range on change
  useEffect(() => {
    if (value.basicInfo.startDate && value.basicInfo.endDate) {
      if (
        !validateDateRange(value.basicInfo.startDate, value.basicInfo.endDate)
      ) {
        // This will be handled by parent validation
      }
    }
  }, [value.basicInfo.startDate, value.basicInfo.endDate]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={value.basicInfo.title}
          onChange={(e) => handleChange("title", e.target.value)}
          required
          className={errors?.title ? "border-destructive" : ""}
        />
        {errors?.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={value.basicInfo.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={4}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={value.basicInfo.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            required
            className={errors?.dateRange ? "border-destructive" : ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={value.basicInfo.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            className={errors?.dateRange ? "border-destructive" : ""}
          />
        </div>
      </div>
      {errors?.dateRange && (
        <p className="text-sm text-destructive">{errors.dateRange}</p>
      )}

      {/* Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="departureLocation">Departure Location</Label>
          <LocationInput
            id="departureLocation"
            value={value.basicInfo.departureLocation}
            onChange={(val) => handleChange("departureLocation", val)}
            placeholder="Search departure location..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="arrivalLocation">Arrival Location</Label>
          <LocationInput
            id="arrivalLocation"
            value={value.basicInfo.arrivalLocation}
            onChange={(val) => handleChange("arrivalLocation", val)}
            placeholder="Search arrival location..."
          />
        </div>
      </div>

      {/* Country & Resort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={value.basicInfo.country}
            onChange={(e) => handleChange("country", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="resort">Resort</Label>
          <Input
            id="resort"
            value={value.basicInfo.resort}
            onChange={(e) => handleChange("resort", e.target.value)}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <Select value={value.status} onValueChange={handleStatusChange}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Initialize form data from trip
 */
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

/**
 * Validate form data
 */
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

/**
 * Convert form data to API payload
 */
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
