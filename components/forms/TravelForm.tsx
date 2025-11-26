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
    onChange?.({ ...value, ...field });
  return (
    <div className="px-12 py-4 min-w-72">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="travel">
          <AccordionTrigger>Travel Information</AccordionTrigger>
          <AccordionContent>
            <div className="w-full flex flex-col justify-between gap-12">
              <div className="w-full flex flex-row justify-between gap-12">
                <div className="flex flex-col w-1/2 gap-1">
                  <Label htmlFor="travel-reason">Travel Reason</Label>
                  <Input
                    type="text"
                    id="travel-reason"
                    placeholder="e.g. Business"
                    value={value.travelReason}
                    onChange={(e) => update({ travelReason: e.target.value })}
                  />
                </div>
                <div className="flex flex-col w-1/2 gap-1 ">
                  <Label htmlFor="vehicle-type">Vehicle Type</Label>
                  <Select
                    value={value.vehicleType}
                    onValueChange={(value) => update({ vehicleType: value })}
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
              <DateAndTimePicker
                value={{
                  date: value.dateTime.date,
                  startTime: value.dateTime.startTime,
                  endTime: value.dateTime.endTime,
                }}
                onChange={(dateTime) =>
                  update({
                    dateTime: {
                      date: dateTime.date,
                      startTime: dateTime.startTime,
                      endTime: dateTime.endTime,
                    },
                  })
                }
              />
              <div className="w-full flex flex-row justify-between gap-12">
                <div className="flex flex-col w-1/2 gap-1">
                  <Label htmlFor="location">Departure Location</Label>
                  <Input
                    type="text"
                    id="location"
                    placeholder="e.g. Stockholm Office"
                    value={value.departureLocation}
                    onChange={(e) =>
                      update({ departureLocation: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col w-1/2 gap-1">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    type="text"
                    id="destination"
                    placeholder="e.g. Oslo Client Site"
                    value={value.destination}
                    onChange={(e) => update({ destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-row gap-12">
                <div className="flex flex-col w-1/2 gap-1">
                  <Label htmlFor="distance">Travel Distance (km)</Label>
                  <Input
                    type="number"
                    id="distance"
                    value={value.distance ?? ""}
                    onChange={(e) =>
                      update({ distance: Number(e.target.value) })
                    }
                    placeholder="e.g. 100"
                    min={0}
                  />
                </div>
                <div className="flex flex-col w-1/2 gap-1">
                  <Label htmlFor="isRoundTrip">Round Trip</Label>
                  <div className="flex flex-row bg-input-back justify-start px-4 gap-4 items-center h-12 border border-input-border rounded-md ">
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
