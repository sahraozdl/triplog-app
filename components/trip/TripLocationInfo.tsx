"use client";

import { Trip } from "@/app/types/Trip";
import { MapPin, Globe } from "lucide-react";
import { TripInfoField } from "./TripInfoField";

interface TripLocationInfoProps {
  trip: Trip;
}

export function TripLocationInfo({ trip }: TripLocationInfoProps) {
  const hasLocationInfo =
    trip.basicInfo.departureLocation ||
    trip.basicInfo.arrivalLocation ||
    trip.basicInfo.country ||
    trip.basicInfo.resort;

  if (!hasLocationInfo) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t">
      {trip.basicInfo.departureLocation && (
        <TripInfoField
          label="Departure"
          value={trip.basicInfo.departureLocation}
          icon={
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          }
          title={trip.basicInfo.departureLocation}
        />
      )}
      {trip.basicInfo.arrivalLocation && (
        <TripInfoField
          label="Arrival"
          value={trip.basicInfo.arrivalLocation}
          icon={
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          }
          title={trip.basicInfo.arrivalLocation}
        />
      )}
      {trip.basicInfo.country && (
        <TripInfoField
          label="Country"
          value={trip.basicInfo.country}
          icon={
            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          }
          title={trip.basicInfo.country}
        />
      )}
      {trip.basicInfo.resort && (
        <TripInfoField
          label="Resort"
          value={trip.basicInfo.resort}
          icon={
            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          }
          title={trip.basicInfo.resort}
        />
      )}
    </div>
  );
}
