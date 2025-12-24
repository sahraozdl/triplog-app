"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface WorkTimeTimeInputsProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  startTimeId: string;
  endTimeId: string;
  startTimeLabel?: string;
  endTimeLabel?: string;
}

export function WorkTimeTimeInputs({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startTimeId,
  endTimeId,
  startTimeLabel = "Work Start Time",
  endTimeLabel = "Work End Time",
}: WorkTimeTimeInputsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor={startTimeId} variant="form">
          {startTimeLabel}
        </Label>
        <Input
          type="time"
          id={startTimeId}
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor={endTimeId} variant="form">
          {endTimeLabel}
        </Label>
        <Input
          type="time"
          id={endTimeId}
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
}
