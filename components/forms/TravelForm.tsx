"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DateAndTimePicker from "@/components/form-elements/DateAndTimePicker";
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
import { TravelFields } from "@/app/types/DailyLog";

export default function TravelForm({
  value,
  onChange,
}: {
  value: TravelFields;
  onChange: (travel: TravelFields) => void;
}) {
  const update = (field: Partial<TravelFields>) =>
    onChange({ ...value, ...field });

  return (
    <div className="px-4 md:px-12 py-4 w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="travel">
          <AccordionTrigger>Travel Information</AccordionTrigger>

          <AccordionContent>
            <div className="flex flex-col gap-10 w-full">
              {/* FIRST ROW — Reason + Vehicle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="travel-reason">Travel Reason</Label>
                  <Input
                    id="travel-reason"
                    placeholder="e.g. Business"
                    value={value.travelReason}
                    onChange={(e) => update({ travelReason: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="vehicle-type">Vehicle Type</Label>
                  <Select
                    value={value.vehicleType}
                    onValueChange={(v) => update({ vehicleType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="e.g. Personal Car" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="personal-car">Personal Car</SelectItem>
                      <SelectItem value="company-car-electric_gas">
                        Company Car (Electric/Gas)
                      </SelectItem>
                      <SelectItem value="company-car-petrol_diesel">
                        Company Car (Petrol/Diesel)
                      </SelectItem>
                      <SelectItem value="service-car">Service Car</SelectItem>
                      <SelectItem value="rental-car">Rental Car</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* DATE + TIME PICKER */}
              <DateAndTimePicker
                value={{
                  date: value.dateTime.date,
                  startTime: value.dateTime.startTime,
                  endTime: value.dateTime.endTime,
                }}
                onChange={(dt) =>
                  update({
                    dateTime: {
                      date: dt.date,
                      startTime: dt.startTime,
                      endTime: dt.endTime,
                    },
                  })
                }
              />

              {/* LOCATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="location">Departure Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Stockholm Office"
                    value={value.departureLocation}
                    onChange={(e) =>
                      update({ departureLocation: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="e.g. Oslo Client Site"
                    value={value.destination}
                    onChange={(e) => update({ destination: e.target.value })}
                  />
                </div>
              </div>

              {/* DISTANCE + ROUND TRIP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="distance">Travel Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    min={0}
                    placeholder="e.g. 100"
                    value={value.distance ?? ""}
                    onChange={(e) =>
                      update({ distance: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="isRoundTrip">Round Trip</Label>
                  <div className="flex items-center h-12 px-4 bg-input-back border border-input-border rounded-md">
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
