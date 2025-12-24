"use client";

import { Trip } from "@/app/types/Trip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-4 sm:space-y-5 md:space-y-6 px-1 sm:px-0">
      {/* Title */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor="title" className="text-xs sm:text-sm">
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
          className={`text-sm sm:text-base ${errors?.title ? "border-destructive" : ""}`}
        />
        {errors?.title && (
          <p
            id="title-error"
            className="text-xs sm:text-sm text-destructive"
            role="alert"
          >
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor="description" className="text-xs sm:text-sm">
          Description
        </Label>
        <Textarea
          id="description"
          value={value.basicInfo.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          className="resize-none text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Label htmlFor="startDate" className="text-xs sm:text-sm">
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
            onClick={(e) => e.currentTarget.showPicker()}
            required
            aria-required="true"
            aria-invalid={errors?.dateRange ? "true" : "false"}
            aria-describedby={errors?.dateRange ? "date-error" : undefined}
            className={`text-sm sm:text-base ${errors?.dateRange ? "border-destructive" : ""}`}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Label htmlFor="endDate" className="text-xs sm:text-sm">
            End Date
          </Label>
          <Input
            id="endDate"
            type="date"
            value={value.basicInfo.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            onClick={(e) => e.currentTarget.showPicker()}
            aria-invalid={errors?.dateRange ? "true" : "false"}
            aria-describedby={errors?.dateRange ? "date-error" : undefined}
            className={`text-sm sm:text-base ${errors?.dateRange ? "border-destructive" : ""}`}
            min={value.basicInfo.startDate || undefined}
          />
        </div>
      </div>
      {errors?.dateRange && (
        <p
          id="date-error"
          className="text-xs sm:text-sm text-destructive px-1"
          role="alert"
        >
          {errors.dateRange}
        </p>
      )}

      {/* Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Label htmlFor="departureLocation" className="text-xs sm:text-sm">
            Departure Location
          </Label>
          <LocationInput
            id="departureLocation"
            value={value.basicInfo.departureLocation}
            onChange={(val) => handleChange("departureLocation", val)}
            placeholder="Search city or airport..."
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Label htmlFor="arrivalLocation" className="text-xs sm:text-sm">
            Arrival Location
          </Label>
          <LocationInput
            id="arrivalLocation"
            value={value.basicInfo.arrivalLocation}
            onChange={(val) => handleChange("arrivalLocation", val)}
            placeholder="Search destination..."
          />
        </div>
      </div>

      {/* Country & Resort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Label htmlFor="country" className="text-xs sm:text-sm">
            Country
          </Label>
          <LocationInput
            id="country"
            placeholder="e.g. Sweden"
            value={value.basicInfo.country}
            onChange={(val) => handleChange("country", val)}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Label htmlFor="resort" className="text-xs sm:text-sm">
            Resort / Specific Place
          </Label>
          <LocationInput
            id="resort"
            placeholder="e.g. Hilton Slussen"
            value={value.basicInfo.resort}
            onChange={(val) => handleChange("resort", val)}
          />
        </div>
      </div>
    </div>
  );
}
