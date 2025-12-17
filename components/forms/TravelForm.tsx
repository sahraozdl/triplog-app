"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { UploadedFile } from "@/app/types/DailyLog";
import { TravelFormState } from "@/app/types/FormStates";

interface Props {
  value: TravelFormState;
  onChange: (val: TravelFormState) => void;
  onAddMapImage?: (file: UploadedFile) => void;
  tripId?: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
}

export default function TravelForm({ value, onChange, onAddMapImage }: Props) {
  const [calculating, setCalculating] = useState(false);
  const [mapUrl, setMapUrl] = useState<string>("");

  const update = (field: Partial<TravelFormState>) =>
    onChange({ ...value, ...field });

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

        if (data.distance) {
          const finalDistance = value.isRoundTrip
            ? data.distance * 2
            : data.distance;
          update({ distance: finalDistance });
        }

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

            if (onAddMapImage) {
              onAddMapImage(mapFile);
            }
          } catch (error) {
            console.error("Failed to fetch map image:", error);
            const mapFile: UploadedFile = {
              name: `Route Map (${value.departureLocation} - ${value.destination}).png`,
              type: "image/png",
              size: 0,
              url: staticMapUrl,
            };

            if (onAddMapImage) {
              onAddMapImage(mapFile);
            }
          }
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
    let newDistance = value.distance;

    if (value.distance && value.distance > 0) {
      if (checked) {
        newDistance = value.distance * 2;
      } else {
        newDistance = value.distance / 2;
      }
    }
    update({ isRoundTrip: checked, distance: newDistance });
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Accordion
        type="single"
        collapsible
        defaultValue="travel"
        className="w-full"
      >
        <AccordionItem value="travel">
          <AccordionTrigger className="hover:no-underline py-4">
            <span className="text-lg font-semibold flex items-center gap-2">
              Travel Information
            </span>
          </AccordionTrigger>

          <AccordionContent className="pt-4 pb-6">
            <div className="flex flex-col gap-6 w-full">
              {/* Row 1: Reason & Vehicle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="travel-reason">Travel Reason</Label>
                  <Input
                    type="text"
                    id="travel-reason"
                    placeholder="e.g. Client Meeting"
                    value={value.travelReason}
                    onChange={(e) => update({ travelReason: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="vehicle-type">Vehicle Type</Label>
                  <Select
                    value={value.vehicleType}
                    onValueChange={(v) => update({ vehicleType: v })}
                  >
                    <SelectTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    onClick={(e) => e.currentTarget.showPicker()}
                    value={value.startTime}
                    onChange={(e) => update({ startTime: e.target.value })}
                    className="bg-input-back text-foreground border-input 
                   [&::-webkit-calendar-picker-indicator]:invert 
                   [&::-webkit-calendar-picker-indicator]:opacity-80
               "
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    onClick={(e) => e.currentTarget.showPicker()}
                    value={value.endTime}
                    onChange={(e) => update({ endTime: e.target.value })}
                    className="bg-input-back text-foreground border-input 
    [&::-webkit-calendar-picker-indicator]:invert 
    [&::-webkit-calendar-picker-indicator]:opacity-80
  "
                  />
                </div>
              </div>

              {/* Row 3: Locations (GOOGLE LOCATION INPUT) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative">
                <div className="flex flex-col gap-2 w-full z-10">
                  <Label htmlFor="location">Departure</Label>
                  <LocationInput
                    id="location"
                    placeholder="Search departure..."
                    value={value.departureLocation}
                    onChange={(val) => update({ departureLocation: val })}
                  />
                </div>

                <div className="flex flex-col gap-2 w-full z-10">
                  <Label htmlFor="destination">Destination</Label>
                  <LocationInput
                    id="destination"
                    placeholder="Search destination..."
                    value={value.destination}
                    onChange={(val) => update({ destination: val })}
                  />
                </div>
              </div>

              {/* Row 4: Distance & Auto Calc */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-end">
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="distance">Distance (km)</Label>

                    {value.departureLocation && value.destination && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleAutoCalculate}
                        disabled={calculating}
                        className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                      >
                        {calculating ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Map className="h-3 w-3 mr-1" />
                        )}
                        Auto Calculate & Map
                      </Button>
                    )}
                  </div>

                  <Input
                    id="distance"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={value.distance === null ? "" : value.distance}
                    onChange={(e) =>
                      update({ distance: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between border border-input p-2 rounded-md bg-input-back">
                    <Label
                      htmlFor="isRoundTrip"
                      className="cursor-pointer py-1 px-2"
                    >
                      Round Trip?
                    </Label>
                    <Switch
                      id="isRoundTrip"
                      checked={value.isRoundTrip}
                      onCheckedChange={handleRoundTripChange}
                    />
                  </div>
                </div>
              </div>

              {mapUrl && (
                <div className="w-full rounded-lg overflow-hidden border border-slate-200 mt-2 relative group animate-in fade-in zoom-in-95 duration-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mapUrl}
                    alt="Route Preview"
                    className="w-full h-48 object-cover opacity-95 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-medium shadow-sm">
                    Rota Preview
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
