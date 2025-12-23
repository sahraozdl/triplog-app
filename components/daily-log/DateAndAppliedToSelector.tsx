"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import { CalendarIcon } from "lucide-react";
import { TripAttendant } from "@/app/types/Trip";

interface DateAndAppliedToSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  appliedTo: string[];
  onAppliedToChange: (userIds: string[]) => void;
  inviteOpen: boolean;
  onInviteOpenChange: (open: boolean) => void;
  attendants: TripAttendant[];
  excludedUserIds?: Set<string>; // Users with existing logs for this date
  ownerUserId?: string; // Owner of the log being edited
}

function toInputDateValue(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateAndAppliedToSelector({
  selectedDate,
  onDateChange,
  appliedTo,
  onAppliedToChange,
  inviteOpen,
  onInviteOpenChange,
  attendants,
  excludedUserIds = new Set(),
  ownerUserId,
}: DateAndAppliedToSelectorProps) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4 flex flex-col gap-2">
      <div className="flex flex-row justify-between w-full">
      <div className="max-w-sm w-full relative">
        <Label
          htmlFor="logDate"
          className="mb-2 block font-semibold text-foreground"
        >
          Date
        </Label>
        <div className="relative group">
          <Input
            id="logDate"
            type="date"
            onClick={(e) => e.currentTarget.showPicker()}
            value={toInputDateValue(selectedDate)}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                onDateChange("");
                return;
              }
              const [year, month, day] = val.split("-").map(Number);
              const safeDate = new Date(year, month - 1, day, 12, 0, 0);
              onDateChange(safeDate.toISOString().split("T")[0]);
            }}
            className="w-full pl-10 h-12 text-base cursor-pointer hover:bg-muted/50 transition-colors"
          />
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
        </div>
      </div>

      {attendants.length > 0 && (
        <div className="max-w-sm w-full flex flex-col">
          <Label className="mb-2 block font-semibold text-foreground">
            Apply To
          </Label>

          <InviteColleaguesDialog
            mode="select"
            attendants={attendants.map((a) => a.userId)}
            open={inviteOpen}
            onOpenChange={onInviteOpenChange}
            selected={appliedTo}
            onSelect={onAppliedToChange}
            excludedUserIds={excludedUserIds}
            ownerUserId={ownerUserId}
          />
        </div>
      )}</div>
      <p className="text-xs text-muted-foreground mt-2 max-w-md ">{appliedTo.length} colleagues selected.</p>
    </div>
  );
}
