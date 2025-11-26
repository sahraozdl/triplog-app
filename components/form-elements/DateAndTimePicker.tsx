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
  value: { date: string; time: string };
  onChange: (dateTime: { date: string; time: string }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const date = value.date ? new Date(value.date) : undefined;
  const update = (field: Partial<{ date: string; time: string }>) =>
    onChange?.({ ...value, ...field });
  return (
    <div className="w-full flex flex-row justify-between gap-12">
      <div className="flex flex-col w-1/2 gap-1">
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
          <PopoverContent className="w-full overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(date) => {
                update({ date: date?.toISOString() || "" });
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-6 w-1/2 justify-end">
        <div className="flex w-1/2 flex-col gap-1">
          <Label htmlFor="time-from">Departure Time</Label>
          <Input
            type="time"
            id="time-from"
            step="60"
            value={value.time}
            onChange={(e) => update({ time: e.target.value })}
            className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
        <div className="flex w-1/2 flex-col gap-1">
          <Label htmlFor="time-to">Arrival Time</Label>
          <Input
            type="time"
            id="time-to"
            step="60"
            value={value.time}
            onChange={(e) => update({ time: e.target.value })}
            className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
      </div>
    </div>
  );
}
