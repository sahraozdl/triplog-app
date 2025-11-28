"use client";

import { TripAttendant } from "@/app/types/Trip";
import { useEffect, useState } from "react";
import { User, BadgeCheck, Clock } from "lucide-react";

export default function AttendantsList({
  attendants,
}: {
  attendants: TripAttendant[];
}) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attendants || attendants.length === 0) {
      setLoading(false);
      return;
    }

    const fetchNames = async () => {
      const ids = attendants.map((a) => a.userId);
      try {
        const res = await fetch("/api/users/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: ids }),
        });
        if (res.ok) {
          const data = await res.json();
          setNames(data.users);
        }
      } catch (err) {
        console.error("Failed to load attendant names", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, [attendants]);

  if (!attendants || attendants.length === 0) {
    return (
      <div className="border border-dashed border-muted-foreground/25 p-6 rounded-lg bg-muted/10 text-sm text-muted-foreground text-center">
        No attendants assigned to this trip yet.
      </div>
    );
  }

  return (
    <div className="border bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden">
      <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Trip Attendants</h3>
      </div>

      <div className="divide-y divide-border">
        {attendants.map((a) => {
          const userName = loading
            ? "Loading..."
            : names[a.userId] || "Unknown User";

          return (
            <div
              key={a.userId}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 hover:bg-muted/20 transition-colors items-center"
            >
              {/* User Info */}
              <div className="flex flex-col">
                <span className="font-medium text-sm text-foreground">
                  {userName}
                </span>
                <span
                  className="text-xs text-muted-foreground font-mono truncate"
                  title={a.userId}
                >
                  ID: {a.userId.slice(0, 8)}...
                </span>
              </div>

              {/* Role */}
              <div className="flex flex-col sm:items-center md:items-start">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">
                  Role
                </span>
                <span className="text-sm capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 inline-block">
                  {a.role}
                </span>
              </div>

              {/* Status */}
              <div className="flex flex-col sm:items-center md:items-start">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">
                  Status
                </span>
                <div className="flex items-center gap-1.5 text-sm">
                  {a.status === "active" ? (
                    <BadgeCheck className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                  )}
                  <span className="capitalize">{a.status}</span>
                </div>
              </div>

              {/* Joined At */}
              <div className="flex flex-col sm:items-end md:items-end">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">
                  Joined
                </span>
                <span className="text-sm text-muted-foreground">
                  {a.joinedAt ? new Date(a.joinedAt).toLocaleDateString() : "-"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
