"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label
        htmlFor="date-picker"
        className="text-sm font-semibold text-foreground"
      >
        Date
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-picker"
            variant="outline"
            className={`w-full justify-start text-left font-normal ${
              !value ? "text-muted-foreground" : ""
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? value.toLocaleDateString() : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
            autoFocus={true}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
