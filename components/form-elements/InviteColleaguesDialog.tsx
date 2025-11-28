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
import { Loader2, User, Copy, Check } from "lucide-react";
import { useAppUser } from "@/components/providers/AppUserProvider";

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
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InviteView({ tripId }: { tripId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) setCode(data.code);
    } finally {
      setLoading(false);
    }
  };

  if (!code) {
    return (
      <Button onClick={generate} disabled={loading} className="w-full mt-4">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate
        Code
      </Button>
    );
  }

  return (
    <div className="space-y-6 mt-4 text-center">
      <div className="p-4 bg-muted/50 rounded-xl font-mono text-3xl font-bold tracking-widest">
        {code}
      </div>
      <div className="flex items-center gap-2 p-2 bg-muted/30 border rounded-lg text-xs text-muted-foreground">
        <span className="truncate flex-1">
          {origin}/join/{code}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() =>
            navigator.clipboard.writeText(`${origin}/join/${code}`)
          }
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function SelectView({
  attendants,
  selected,
  onSelect,
  onClose,
}: {
  attendants: string[];
  selected: string[];
  onSelect: (v: string[]) => void;
  onClose: () => void;
}) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const user = useAppUser();
  const filteredAttendants = attendants.filter((id) => id !== user?.userId);

  useEffect(() => {
    if (!filteredAttendants.length) {
      setLoading(false);
      return;
    }

    fetch("/api/users/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: filteredAttendants }),
    })
      .then((res) => res.json())
      .then((data) => setNames(data.users || {}))
      .finally(() => setLoading(false));
  }, [filteredAttendants]);

  const toggle = (id: string) =>
    onSelect(
      selected.includes(id)
        ? selected.filter((u) => u !== id)
        : [...selected, id],
    );

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );

  if (filteredAttendants.length === 0)
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        No other colleagues found.
      </p>
    );

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
        {filteredAttendants.map((id) => {
          const isSelected = selected.includes(id);
          return (
            <div
              key={id}
              onClick={() => toggle(id)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {names[id] || "Unknown"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {id.slice(0, 8)}...
                  </span>
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </div>
          );
        })}
      </div>
      <Button onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  );
}
