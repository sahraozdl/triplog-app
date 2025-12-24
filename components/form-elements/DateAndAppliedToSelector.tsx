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
  excludedUserIds?: Set<string>;
  ownerUserId?: string;
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
  const selectedCount = appliedTo.length;

  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-sm space-y-4 flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:justify-between w-full gap-4 sm:gap-6">
        <div className="w-full sm:max-w-sm sm:flex-1 relative">
          <Label
            htmlFor="logDate"
            className="mb-2 block font-semibold text-foreground text-sm sm:text-base"
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
              className="w-full pl-10 h-11 sm:h-12 text-sm sm:text-base cursor-pointer hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Select date for travel entry"
              aria-required="true"
            />
            <CalendarIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors"
              aria-hidden="true"
            />
          </div>
        </div>

        {attendants.length > 0 && (
          <div className="w-full sm:max-w-sm sm:flex-1 flex flex-col">
            <Label
              htmlFor="apply-to-selector"
              className="mb-2 block font-semibold text-foreground text-sm sm:text-base"
            >
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
        )}
      </div>
      <p
        className="text-xs text-muted-foreground mt-2 max-w-md"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedCount === 0
          ? "No colleagues selected."
          : selectedCount === 1
            ? "1 colleague selected."
            : `${selectedCount} colleagues selected.`}
      </p>
    </div>
  );
}
