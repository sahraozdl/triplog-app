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
  excludedUserIds?: Set<string>; // Users with existing logs for this date
  ownerUserId?: string; // Owner of the log being edited
}

export default function SelectView({
  attendants,
  selected,
  onSelect,
  onClose,
  isOpen,
  excludedUserIds = new Set(),
  ownerUserId,
}: SelectViewProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const user = useAppUser();

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  // Filter out current user and owner (if different from current user)
  // Also filter out users with existing logs for this date
  const filteredAttendants = useMemo(() => {
    return attendants.filter(
      (id) =>
        id !== user?.userId && id !== ownerUserId && !excludedUserIds.has(id),
    );
  }, [attendants, user?.userId, ownerUserId, excludedUserIds]);

  // Separate excluded users for display (as disabled)
  // MUST be called before any conditional returns
  const excludedUsers = useMemo(
    () =>
      attendants.filter(
        (id) =>
          id !== user?.userId && id !== ownerUserId && excludedUserIds.has(id),
      ),
    [attendants, user?.userId, ownerUserId, excludedUserIds],
  );

  // Check if there are any existing logs for this date
  const hasExistingLogs = excludedUserIds.size > 0;

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }

    // Fetch names for both selectable and excluded users
    const allUserIds = [...filteredAttendants, ...excludedUsers];

    if (!allUserIds.length) {
      setLoading(false);
      return;
    }

    // Check if we already have names for all users
    const missingNames = allUserIds.filter((id) => !names[id]);
    if (missingNames.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch("/api/users/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: missingNames }),
    })
      .then((res) => res.json())
      .then((data) => {
        setNames((prev) => ({ ...prev, ...(data.users || {}) }));
      })
      .catch((err) => console.error("Failed to load colleagues", err))
      .finally(() => setLoading(false));
  }, [isOpen, filteredAttendants, excludedUsers, names]);

  const toggle = (id: string) => {
    // Preserve excluded users that are already selected (they cannot be removed)
    const excludedSelected = selected.filter((u) => excludedUserIds.has(u));
    const newSelection = selected.includes(id)
      ? selected.filter((u) => u !== id)
      : [...selected, id];
    // Always preserve excluded users that were selected
    const finalSelection = [
      ...excludedSelected,
      ...newSelection.filter((u) => !excludedUserIds.has(u)),
    ];
    onSelect(finalSelection);
  };

  // Conditional rendering AFTER all hooks have been called
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* Informational message if there are existing logs */}
      {hasExistingLogs && (
        <div className="bg-muted/50 border border-muted rounded-lg p-3 mb-2">
          <p className="text-xs text-muted-foreground">
            There is already a log for this date for the selected user(s).
          </p>
        </div>
      )}

      <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
        {filteredAttendants.length === 0 && !hasExistingLogs ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            No other colleagues found.
          </p>
        ) : (
          <>
            {filteredAttendants.map((id) => {
              const isSelected = selected.includes(id);
              return (
                <div
                  key={id}
                  onClick={() => toggle(id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
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
            {excludedUsers.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground font-medium pt-2 pb-1">
                  Already shared (cannot be removed)
                </div>
                {excludedUsers.map((id) => {
                  const isSelected = selected.includes(id);
                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isSelected
                          ? "border-primary/50 bg-primary/5"
                          : "border-muted bg-muted/20"
                      } opacity-60 cursor-not-allowed`}
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
              </>
            )}
          </>
        )}
      </div>
      <Button onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  );
}
