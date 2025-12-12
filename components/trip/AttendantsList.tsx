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
          try {
            localStorage.setItem("tripAttendantNames", JSON.stringify(data.users));
          } catch (e) {
            console.error("Failed to cache attendant names", e);
          }
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
    <div className="w-full border bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden">
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
              className="
                w-full p-4
                flex flex-col gap-4
                sm:grid sm:grid-cols-1
                md:grid md:grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]
                md:items-center
                hover:bg-muted/20
                transition-colors
              "
            >
              {/* User Info */}
              <div className="flex flex-col gap-1 w-full">
                <span className="font-medium text-sm text-foreground wrap-break-word">
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
              <div className="flex flex-col gap-1 w-full sm:flex-row sm:items-center md:flex-col md:items-start">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Role
                </span>
                <span className="mt-0.5 text-sm capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 inline-flex items-center justify-center max-w-full">
                  {a.role}
                </span>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1 w-full sm:flex-row sm:items-center md:flex-col md:items-start">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Status
                </span>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm">
                  {a.status === "active" ? (
                    <BadgeCheck className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                  )}
                  <span className="capitalize">{a.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
