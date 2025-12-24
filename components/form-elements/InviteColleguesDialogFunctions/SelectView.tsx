"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, Check } from "lucide-react";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { fetchUsersData } from "@/lib/utils/fetchers";

interface SelectViewProps {
  attendants: string[];
  selected: string[];
  onSelect: (v: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
  excludedUserIds?: Set<string>;
  ownerUserId?: string;
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
  const filteredAttendants = useMemo(() => {
    return attendants.filter(
      (id) =>
        id !== user?.userId && id !== ownerUserId && !excludedUserIds.has(id),
    );
  }, [attendants, user?.userId, ownerUserId, excludedUserIds]);

  const excludedUsers = useMemo(
    () =>
      attendants.filter(
        (id) =>
          id !== user?.userId && id !== ownerUserId && excludedUserIds.has(id),
      ),
    [attendants, user?.userId, ownerUserId, excludedUserIds],
  );

  const hasExistingLogs = excludedUserIds.size > 0;

  const allUserIds = useMemo(
    () => [...filteredAttendants, ...excludedUsers],
    [filteredAttendants, excludedUsers],
  );

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }

    if (allUserIds.length === 0) {
      setLoading(false);
      return;
    }

    const missingNames = allUserIds.filter((id) => !names[id]);
    if (missingNames.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchUsersData(missingNames, false)
      .then((result) => {
        if (!cancelled) {
          if (result.success && result.users) {
            setNames((prev) => ({ ...prev, ...result.users }));
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load colleagues", err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, allUserIds, names]);

  const toggle = (id: string) => {
    const excludedSelected = selected.filter((u) => excludedUserIds.has(u));
    const newSelection = selected.includes(id)
      ? selected.filter((u) => u !== id)
      : [...selected, id];
    const finalSelection = [
      ...excludedSelected,
      ...newSelection.filter((u) => !excludedUserIds.has(u)),
    ];
    onSelect(finalSelection);
  };

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
