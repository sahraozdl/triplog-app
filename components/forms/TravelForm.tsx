"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TravelLog } from "@/app/types/DailyLog";

type TravelFormState = Omit<
  TravelLog,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "files"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
  | "itemType"
>;

interface Props {
  value: TravelFormState;
  onChange: (val: TravelFormState) => void;
}

export default function TravelForm({ value, onChange }: Props) {
  const update = (field: Partial<TravelFormState>) =>
    onChange({ ...value, ...field });

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
            <span className="text-lg font-semibold">Travel Information</span>
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

              {/* Row 2: Time (Start - End) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    onClick={(e) => e.currentTarget.showPicker()}
                    value={value.startTime}
                    onChange={(e) => update({ startTime: e.target.value })}
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
                  />
                </div>
              </div>

              {/* Row 3: Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="location">Departure Location</Label>
                  <Input
                    type="text"
                    id="location"
                    placeholder="e.g. Office"
                    value={value.departureLocation}
                    onChange={(e) =>
                      update({ departureLocation: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    type="text"
                    id="destination"
                    placeholder="e.g. Client Site"
                    value={value.destination}
                    onChange={(e) => update({ destination: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 4: Distance & Round Trip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-end">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="distance">Distance (km)</Label>
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
                  <div className="flex items-center justify-between border border-input-border p-2 rounded-md bg-input-back">
                    <Label
                      htmlFor="isRoundTrip"
                      className="cursor-pointer py-1 px-2"
                    >
                      Round Trip?
                    </Label>
                    <Switch
                      id="isRoundTrip"
                      checked={value.isRoundTrip}
                      onCheckedChange={(checked) =>
                        update({ isRoundTrip: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
