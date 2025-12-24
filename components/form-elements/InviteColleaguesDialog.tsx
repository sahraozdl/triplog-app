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
      excludedUserIds?: Set<string>;
      ownerUserId?: string;
    });

export default function InviteColleaguesDialog(props: Props) {
  const isInvite = props.mode === "invite";
  const open = props.open ?? false;
  const setOpen = props.onOpenChange ?? (() => {});

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-12">
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
            <InviteView tripId={props.tripId} />
          ) : (
            <SelectView
              attendants={props.attendants}
              selected={props.selected}
              onSelect={props.onSelect}
              onClose={() => setOpen(false)}
              isOpen={open}
              excludedUserIds={props.excludedUserIds}
              ownerUserId={props.ownerUserId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
