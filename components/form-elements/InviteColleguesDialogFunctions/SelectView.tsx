"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, Check } from "lucide-react";
import { useAppUser } from "@/components/providers/AppUserProvider";

interface SelectViewProps {
  attendants: string[];
  selected: string[];
  onSelect: (v: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function SelectView({
  attendants,
  selected,
  onSelect,
  onClose,
  isOpen,
}: SelectViewProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const user = useAppUser();

  const filteredAttendants = useMemo(
    () => attendants.filter((id) => id !== user?.userId),
    [attendants, user?.userId],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (!filteredAttendants.length) {
      setLoading(false);
      return;
    }

    if (Object.keys(names).length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch("/api/users/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: filteredAttendants }),
    })
      .then((res) => res.json())
      .then((data) => setNames(data.users || {}))
      .catch((err) => console.error("Failed to load colleagues", err))
      .finally(() => setLoading(false));
  }, [isOpen, filteredAttendants, names]);

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
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
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
