"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DateAndTimePicker({
  value,
  onChange,
}: {
  value: { date: string; startTime: string; endTime: string };
  onChange: (dateTime: {
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const date = value.date ? new Date(value.date) : undefined;

  const update = (
    field: Partial<{ date: string; startTime: string; endTime: string }>,
  ) => onChange({ ...value, ...field });

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* DATE PICKER */}
      <div className="flex flex-col gap-1 w-full">
        <Label htmlFor="date">Date</Label>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date"
              className="w-full justify-between font-normal"
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="p-0 w-auto max-w-[95vw] md:max-w-sm"
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(selectedDate) => {
                update({ date: selectedDate?.toISOString() || "" });
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* TIME INPUTS */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-1">
          <Label htmlFor="time-from">Departure</Label>
          <Input
            type="time"
            id="time-from"
            step="60"
            value={value.startTime}
            onChange={(e) => update({ startTime: e.target.value })}
            className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="time-to">Arrival</Label>
          <Input
            type="time"
            id="time-to"
            step="60"
            value={value.endTime}
            onChange={(e) => update({ endTime: e.target.value })}
            className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
          />
        </div>
      </div>
    </div>
  );
}
