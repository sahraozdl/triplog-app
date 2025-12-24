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
import { validateDateRange } from "@/lib/utils/dateConversion";
import { useEffect } from "react";
import {
  TripEditFormData,
  initializeFormData,
  validateFormData,
  formDataToPayload,
} from "@/lib/utils/tripFormHelpers";

export type { TripEditFormData };
export { initializeFormData, validateFormData, formDataToPayload };

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

  useEffect(() => {
    if (value.basicInfo.startDate && value.basicInfo.endDate) {
      if (
        !validateDateRange(value.basicInfo.startDate, value.basicInfo.endDate)
      ) {
        // dont forget to handle this error in the parent component
      }
    }
  }, [value.basicInfo.startDate, value.basicInfo.endDate]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">
          Title{" "}
          <span className="text-destructive" aria-label="required">
            *
          </span>
        </Label>
        <Input
          id="title"
          value={value.basicInfo.title}
          onChange={(e) => handleChange("title", e.target.value)}
          required
          aria-required="true"
          aria-invalid={errors?.title ? "true" : "false"}
          aria-describedby={errors?.title ? "title-error" : undefined}
          className={errors?.title ? "border-destructive" : ""}
        />
        {errors?.title && (
          <p id="title-error" className="text-sm text-destructive" role="alert">
            {errors.title}
          </p>
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
          className="resize-none"
          aria-describedby="description-help"
        />
        <p
          id="description-help"
          className="text-xs text-muted-foreground sr-only"
        >
          Optional description for the trip
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">
            Start Date{" "}
            <span className="text-destructive" aria-label="required">
              *
            </span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={value.basicInfo.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            required
            aria-required="true"
            aria-invalid={errors?.dateRange ? "true" : "false"}
            aria-describedby={errors?.dateRange ? "date-error" : undefined}
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
            aria-invalid={errors?.dateRange ? "true" : "false"}
            aria-describedby={errors?.dateRange ? "date-error" : undefined}
            className={errors?.dateRange ? "border-destructive" : ""}
            min={value.basicInfo.startDate || undefined}
          />
        </div>
      </div>
      {errors?.dateRange && (
        <p id="date-error" className="text-sm text-destructive" role="alert">
          {errors.dateRange}
        </p>
      )}

      {/* Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="departureLocation">Departure Location</Label>
          <LocationInput
            id="departureLocation"
            value={value.basicInfo.departureLocation}
            onChange={(val) => handleChange("departureLocation", val)}
            placeholder="Search city or airport..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="arrivalLocation">Arrival Location</Label>
          <LocationInput
            id="arrivalLocation"
            value={value.basicInfo.arrivalLocation}
            onChange={(val) => handleChange("arrivalLocation", val)}
            placeholder="Search destination..."
          />
        </div>
      </div>

      {/* Country & Resort (using LocationInput like newTrip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Country</Label>
          <LocationInput
            id="country"
            placeholder="e.g. Sweden"
            value={value.basicInfo.country}
            onChange={(val) => handleChange("country", val)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="resort">Resort / Specific Place</Label>
          <LocationInput
            id="resort"
            placeholder="e.g. Hilton Slussen"
            value={value.basicInfo.resort}
            onChange={(val) => handleChange("resort", val)}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <Select value={value.status} onValueChange={handleStatusChange}>
          <SelectTrigger id="status" aria-label="Trip status">
            <SelectValue placeholder="Select status" />
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
