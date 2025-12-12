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

// I will delete this later and pass the qualities to attendantList component
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
  );
}
