"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface InvitePropsBase {
  attendants: string[];
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

interface InviteModeProps extends InvitePropsBase {
  mode: "invite";
  tripId: string;
}

interface SelectModeProps extends InvitePropsBase {
  mode: "select";
  selected: string[];
  onSelect: (v: string[]) => void;
}

type InviteColleaguesProps = InviteModeProps | SelectModeProps;

export default function InviteColleaguesDialog(props: InviteColleaguesProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [clientOrigin, setClientOrigin] = useState<string>("");
  const isInviteMode = props.mode === "invite";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setClientOrigin(window.location.origin);
    }
  }, []);

  async function generateInviteCode() {
    if (!isInviteMode) return;

    const response = await fetch(`/api/trips/${props.tripId}/invite`, {
      method: "POST",
    });

    const data = await response.json();
    if (data.success) {
      setInviteCode(data.code);
    }
  }

  function toggleUserSelection(userId: string) {
    if (isInviteMode) return;

    const selected = props.selected;
    if (selected.includes(userId)) {
      props.onSelect(selected.filter((u) => u !== userId));
    } else {
      props.onSelect([...selected, userId]);
    }
  }

  const open = props.open ?? false;
  const setOpen = props.onOpenChange ?? (() => {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          {isInviteMode ? "Invite Colleagues" : "Select Colleagues"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md w-[90%] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isInviteMode ? "Generate Invite Code" : "Select Colleagues"}
          </DialogTitle>
        </DialogHeader>

        {isInviteMode && (
          <div className="space-y-4 mt-4">
            {!inviteCode ? (
              <Button className="w-full" onClick={generateInviteCode}>
                Generate Code
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">Share this code:</p>

                <div className="p-3 bg-muted border rounded-lg">
                  <p className="font-mono text-lg text-center">{inviteCode}</p>
                </div>

                <p className="text-sm">Or send invite link:</p>

                <div className="p-3 bg-muted border rounded-lg break-all text-xs">
                  {clientOrigin && `${clientOrigin}/join/${inviteCode}`}
                </div>
              </div>
            )}
          </div>
        )}

        {!isInviteMode && (
          <div className="space-y-3 mt-4 max-h-[50vh] overflow-y-auto pr-2">
            {props.attendants.map((id) => (
              <label
                key={id}
                className="flex items-center gap-3 p-2 border rounded-lg hover:bg-accent/10 transition"
              >
                <input
                  type="checkbox"
                  checked={props.selected.includes(id)}
                  onChange={() => toggleUserSelection(id)}
                  className="h-4 w-4"
                />
                <span className="text-sm break-all">{id}</span>
              </label>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
