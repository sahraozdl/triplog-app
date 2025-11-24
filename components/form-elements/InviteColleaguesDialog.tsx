"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface InvitePropsBase {
  attendants: string[];
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

/* MODE A: Create + share invite code */
interface InviteModeProps extends InvitePropsBase {
  mode: "invite";
  tripId: string;
}

/* MODE B: Select colleagues for daily log */
interface SelectModeProps extends InvitePropsBase {
  mode: "select";
  selected: string[];
  onSelect: (v: string[]) => void;
}

type InviteColleaguesProps = InviteModeProps | SelectModeProps;

export default function InviteColleaguesDialog(props: InviteColleaguesProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const isInviteMode = props.mode === "invite";

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
        <Button variant="outline">
          {isInviteMode ? "Invite Colleagues" : "Select Colleagues"}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isInviteMode ? "Generate Invite Code" : "Select Colleagues"}
          </DialogTitle>
        </DialogHeader>

        {isInviteMode && (
          <div className="space-y-4">
            {!inviteCode ? (
              <Button onClick={generateInviteCode}>Generate Code</Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">Share this code:</p>

                <div className="p-4 bg-muted border rounded">
                  <p className="font-mono text-lg">{inviteCode}</p>
                </div>

                <p className="text-sm">Or send invite link:</p>
                <div className="p-4 bg-muted border rounded break-all">
                  {`${window.location.origin}/join/${inviteCode}`}
                </div>
              </div>
            )}
          </div>
        )}

        {!isInviteMode && (
          <div className="space-y-3">
            {props.attendants.map((id) => (
              <label key={id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={props.selected.includes(id)}
                  onChange={() => toggleUserSelection(id)}
                />
                <span className="text-sm">{id}</span>
              </label>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
