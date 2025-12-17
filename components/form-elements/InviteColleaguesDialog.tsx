"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InviteView from "./InviteColleguesDialogFunctions/InviteView";
import SelectView from "./InviteColleguesDialogFunctions/SelectView";

interface BaseProps {
  attendants: string[];
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

type Props =
  | (BaseProps & { mode: "invite"; tripId: string })
  | (BaseProps & {
      mode: "select";
      selected: string[];
      onSelect: (v: string[]) => void;
    });

export default function InviteColleaguesDialog(props: Props) {
  const isInvite = props.mode === "invite";
  const open = props.open ?? false;
  const setOpen = props.onOpenChange ?? (() => {});

  return (
    <div className="w-3/4 py-2 px-4 flex flex-row gap-10 mx-auto">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full md:w-auto">
            {isInvite ? "Invite Colleagues" : "Select Colleagues"}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md w-[90%] p-6">
          <DialogHeader>
            <DialogTitle>
              {isInvite ? "Invite Code" : "Select Colleagues"}
            </DialogTitle>
          </DialogHeader>

          {isInvite ? (
            <InviteView tripId={(props as any).tripId} />
          ) : (
            <SelectView
              attendants={props.attendants}
              selected={(props as any).selected}
              onSelect={(props as any).onSelect}
              onClose={() => setOpen(false)}
              isOpen={open}
            />
          )}
        </DialogContent>
      </Dialog>

      {!isInvite && (
        <p className="text-xs text-muted-foreground mt-2 max-w-md">
          When you select colleagues, every report you fill out and submit will
          be created for them as well. If you only want to share certain forms
          for a specific day, fill out and save only those records.
        </p>
      )}
    </div>
  );
}
