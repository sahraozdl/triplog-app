"use client";

import { TripAttendant } from "@/app/types/Trip";
import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
//I will use Select component later
export default function UserFilter({
  attendants,
  selectedUserId,
  onSelectUser,
}: {
  attendants: TripAttendant[];
  selectedUserId?: string;
  onSelectUser?: (userId: string) => void;
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
        console.error("Failed to fetch names for filter", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, [attendants]);

  return (
    <div className="border border-border p-4 rounded-lg bg-card shadow-sm flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>Filter by User</span>
      </div>

      <div className="relative flex-1 max-w-xs">
        <select
          value={selectedUserId || ""}
          onChange={(e) => onSelectUser?.(e.target.value)}
          className="
            appearance-none
            w-full
            bg-background
            border border-input
            text-foreground
            rounded-md
            py-2 pl-3 pr-8
            text-sm
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-input
            cursor-pointer
          "
          disabled={loading}
        >
          <option value="">All Users</option>

          {attendants.map((a) => (
            <option key={a.userId} value={a.userId}>
              {loading ? "Loading..." : names[a.userId] || a.userId}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
