"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, Loader2 } from "lucide-react";
import LocationInput from "@/components/form-elements/LocationInput";
import FileDropzone from "@/components/form-elements/FileDropzone";
import { TravelFormState } from "@/app/types/Travel";
import { UploadedFile } from "@/app/types/DailyLog";

interface TravelFormProps {
  value: TravelFormState;
  onChange: (val: TravelFormState) => void;
  tripId: string;
}

export function TravelForm({ value, onChange, tripId }: TravelFormProps) {
  const [calculating, setCalculating] = useState(false);
  const [mapUrl, setMapUrl] = useState<string>("");
  const [baseDistance, setBaseDistance] = useState<number | null>(null);

  const update = (field: Partial<TravelFormState>) => {
    const updated = { ...value, ...field };
    if (field.distance !== undefined) {
      const distanceValue = field.distance;
      if (distanceValue === null || distanceValue === undefined) {
        updated.distance = null;
      } else {
        const numValue = Number(distanceValue);
        updated.distance =
          isNaN(numValue) || numValue < 0 ? null : Math.floor(numValue);
      }
    }
    onChange(updated);
  };

  const handleAutoCalculate = async () => {
    if (!value.departureLocation || !value.destination) {
      alert("Please enter the departure and destination points first.");
      return;
    }

    setCalculating(true);
    try {
      const res = await fetch(
        `/api/maps/distance?origin=${encodeURIComponent(
          value.departureLocation,
        )}&destination=${encodeURIComponent(value.destination)}`,
      );

      if (res.ok) {
        const data = await res.json();

        if (data.error) {
          alert(`Error: ${data.error}`);
          setCalculating(false);
          return;
        }

        if (
          data.distance !== undefined &&
          data.distance !== null &&
          data.distance > 0
        ) {
          const calculatedDistance = Number(data.distance);

          if (calculatedDistance > 0) {
            // Store the base distance (one-way)
            const baseDistanceValue = Math.floor(calculatedDistance);
            setBaseDistance(baseDistanceValue);

            // Calculate final distance based on round trip setting
            const finalDistance = value.isRoundTrip
              ? baseDistanceValue * 2
              : baseDistanceValue;

            const finalDistanceInt = Math.floor(finalDistance);

            // Prepare files update if map is available
            let filesToUpdate = value.files || [];

            if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && data.polyline) {
              const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

              const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x300&scale=2&maptype=roadmap&markers=color:red|label:A|${encodeURIComponent(value.departureLocation)}&markers=color:green|label:B|${encodeURIComponent(value.destination)}&path=weight:5|color:0x0000ff|enc:${data.polyline}&key=${apiKey}`;

              setMapUrl(staticMapUrl);

              try {
                const imageResponse = await fetch(staticMapUrl);
                const imageBlob = await imageResponse.blob();

                const mapFile: UploadedFile = {
                  name: `Route Map (${value.departureLocation} - ${value.destination}).png`,
                  type: "image/png",
                  size: imageBlob.size,
                  url: staticMapUrl,
                };

                const fileExists = filesToUpdate.some(
                  (f) => f.url === staticMapUrl,
                );
                if (!fileExists) {
                  filesToUpdate = [...filesToUpdate, mapFile];
                }
              } catch (error) {
                console.error("Failed to fetch map image:", error);
                const mapFile: UploadedFile = {
                  name: `Route Map (${value.departureLocation} - ${value.destination}).png`,
                  type: "image/png",
                  size: 0,
                  url: staticMapUrl,
                };

                const fileExists = filesToUpdate.some(
                  (f) => f.url === staticMapUrl,
                );
                if (!fileExists) {
                  filesToUpdate = [...filesToUpdate, mapFile];
                }
              }
            }

            // Update both distance and files in a single update to avoid race conditions
            update({
              distance: finalDistanceInt,
              files: filesToUpdate,
            });
          } else {
            alert("Calculated distance is 0. Please check your locations.");
            setCalculating(false);
          }
        } else {
          alert(
            "Could not calculate distance. Please check your locations and try again.",
          );
          setCalculating(false);
        }
      }
    } catch (error) {
      console.error("Auto calculation failed", error);
      alert("Calculation failed.");
    } finally {
      setCalculating(false);
    }
  };

  const handleRoundTripChange = (checked: boolean) => {
    let base: number;

    // If we have a stored base distance (from auto-calculate), use it
    if (baseDistance !== null && baseDistance > 0) {
      base = baseDistance;
    } else if (value.distance && value.distance > 0) {
      // Calculate base from current distance
      base = value.isRoundTrip ? value.distance / 2 : value.distance;
      // Store it for future toggles
      setBaseDistance(Math.floor(base));
    } else {
      // No distance available
      update({ isRoundTrip: checked });
      return;
    }

    if (base > 0) {
      const newDistance = checked ? base * 2 : base;
      update({ isRoundTrip: checked, distance: Math.floor(newDistance) });
    } else {
      update({ isRoundTrip: checked });
    }
  };

  const handleManualDistanceChange = (newValue: string) => {
    // Parse and update distance
    if (newValue === "" || newValue === null || newValue === undefined) {
      update({ distance: null });
    } else {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue) && numValue >= 0) {
        const intValue = Math.floor(numValue);
        update({ distance: intValue });
      } else if (newValue === "" || newValue === "-") {
        // Allow empty or just minus sign while typing
        update({ distance: null });
      }
    }
  };

  const handleFilesChange = (files: UploadedFile[]) => {
    update({ files });
  };

  // Use tripId for validation or logging
  useEffect(() => {
    if (tripId && !tripId.trim()) {
      console.warn("TravelForm: Invalid tripId provided");
    }
  }, [tripId]);

  return (
    <div className="w-full space-y-4 sm:space-y-6" data-trip-id={tripId}>
      {/* Row 1: Reason & Vehicle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="travel-reason" className="text-sm sm:text-base">
            Travel Reason
          </Label>
          <Input
            type="text"
            id="travel-reason"
            placeholder="e.g. Client Meeting"
            value={value.travelReason || ""}
            onChange={(e) => update({ travelReason: e.target.value })}
            className="text-sm sm:text-base h-10 sm:h-11"
            aria-label="Travel reason"
            aria-required="false"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="vehicle-type" className="text-sm sm:text-base">
            Vehicle Type
          </Label>
          <Select
            value={value.vehicleType || ""}
            onValueChange={(v) => update({ vehicleType: v })}
          >
            <SelectTrigger
              id="vehicle-type"
              className="text-sm sm:text-base h-10 sm:h-11"
              aria-label="Select vehicle type"
            >
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal-car">Personal Car</SelectItem>
              <SelectItem value="company-car">Company Car</SelectItem>
              <SelectItem value="rental-car">Rental Car</SelectItem>
              <SelectItem value="plane">Plane</SelectItem>
              <SelectItem value="train">Train</SelectItem>
              <SelectItem value="taxi">Taxi</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="startTime" className="text-sm sm:text-base">
            Start Time
          </Label>
          <Input
            id="startTime"
            type="time"
            onClick={(e) => e.currentTarget.showPicker()}
            value={value.startTime || ""}
            onChange={(e) => update({ startTime: e.target.value })}
            className="bg-input-back text-foreground border-input text-sm sm:text-base h-10 sm:h-11
                   [&::-webkit-calendar-picker-indicator]:invert 
                   [&::-webkit-calendar-picker-indicator]:opacity-80
                   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Start time"
            aria-required="false"
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="endTime" className="text-sm sm:text-base">
            End Time
          </Label>
          <Input
            id="endTime"
            type="time"
            onClick={(e) => e.currentTarget.showPicker()}
            value={value.endTime || ""}
            onChange={(e) => update({ endTime: e.target.value })}
            className="bg-input-back text-foreground border-input text-sm sm:text-base h-10 sm:h-11
    [&::-webkit-calendar-picker-indicator]:invert 
    [&::-webkit-calendar-picker-indicator]:opacity-80
    focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="End time"
            aria-required="false"
          />
        </div>
      </div>

      {/* Row 3: Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full relative">
        <div className="flex flex-col gap-2 w-full z-10">
          <Label htmlFor="location" className="text-sm sm:text-base">
            Departure
          </Label>
          <LocationInput
            id="location"
            placeholder="Search departure..."
            value={value.departureLocation || ""}
            onChange={(val) => {
              update({ departureLocation: val });
              // Clear base distance when location changes
              setBaseDistance(null);
            }}
            aria-label="Departure location"
            aria-required="true"
          />
        </div>

        <div className="flex flex-col gap-2 w-full z-10">
          <Label htmlFor="destination" className="text-sm sm:text-base">
            Destination
          </Label>
          <LocationInput
            id="destination"
            placeholder="Search destination..."
            value={value.destination || ""}
            onChange={(val) => {
              update({ destination: val });
              // Clear base distance when location changes
              setBaseDistance(null);
            }}
            aria-label="Destination location"
            aria-required="true"
          />
        </div>
      </div>

      {/* Row 4: Distance & Auto Calc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full items-end">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
            <Label htmlFor="distance" className="text-sm sm:text-base">
              Distance (km)
            </Label>

            {value.departureLocation && value.destination && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleAutoCalculate}
                disabled={calculating}
                className="h-8 sm:h-9 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 sm:px-3 self-start sm:self-auto shrink-0"
                aria-label="Auto calculate distance and generate map"
                aria-busy={calculating}
              >
                {calculating ? (
                  <>
                    <Loader2
                      className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Calculating</span>
                  </>
                ) : (
                  <>
                    <Map
                      className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                      aria-hidden="true"
                    />
                    <span>Auto Calculate & Map</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex-1 min-w-0">
              <Input
                id="distance"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={
                  value.distance === null || value.distance === undefined
                    ? ""
                    : value.distance
                }
                onChange={(e) => {
                  handleManualDistanceChange(e.target.value);
                }}
                className="text-sm sm:text-base h-10 sm:h-11 w-full"
                aria-label="Distance in kilometers"
                aria-required="false"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between border border-input p-2 sm:p-3 rounded-md bg-input-back">
            <Label
              htmlFor="isRoundTrip"
              className="cursor-pointer py-1 px-2 text-sm sm:text-base"
            >
              Round Trip?
            </Label>
            <Switch
              id="isRoundTrip"
              checked={value.isRoundTrip || false}
              onCheckedChange={handleRoundTripChange}
              aria-label="Toggle round trip"
            />
          </div>
        </div>
      </div>

      {/* Route Image Preview */}
      {mapUrl && (
        <div className="w-full rounded-lg overflow-hidden border border-slate-200 mt-2 relative group animate-in fade-in zoom-in-95 duration-500">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapUrl}
            alt="Route map showing the path from departure to destination"
            className="w-full h-40 sm:h-48 object-cover opacity-95 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] sm:text-xs text-white font-medium shadow-sm">
            Route Preview
          </div>
        </div>
      )}

      {/* Files - Route images are automatically added here */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm sm:text-base">Route Images</Label>
        <FileDropzone value={value.files || []} onChange={handleFilesChange} />
      </div>
    </div>
  );
}
