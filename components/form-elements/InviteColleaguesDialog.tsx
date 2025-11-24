"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function InviteColleaguesDialog({
  open,
  onOpenChange,
  attendants,
  selected,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendants: string[];
  selected: string[];
  onSelect: (ids: string[]) => void;
}) {
  function toggle(userId: string) {
    if (selected.includes(userId)) {
      onSelect(selected.filter((x) => x !== userId));
    } else {
      onSelect([...selected, userId]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select colleagues to apply this log</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {attendants.map((id) => (
            <label key={id} className="flex items-center gap-2">
              <Checkbox
                checked={selected.includes(id)}
                onCheckedChange={() => toggle(id)}
              />
              <span>{id}</span>
            </label>
          ))}
        </div>

        <Button onClick={() => onOpenChange(false)}>Done</Button>
      </DialogContent>
    </Dialog>
  );
}
