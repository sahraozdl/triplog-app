"use client";

import { Trip } from "@/app/types/Trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isoToDateString } from "@/lib/utils/dateConversion";
import { TripAttendant } from "@/app/types/Trip";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

export function TripInfoCard({ trip }: { trip: Trip }) {
  const [attendantNames, setAttendantNames] = useState<Record<string, string>>(
    {},
  );
  const [loadingNames, setLoadingNames] = useState(true);

  useEffect(() => {
    if (!trip.attendants || trip.attendants.length === 0) {
      setLoadingNames(false);
      return;
    }

    const fetchNames = async () => {
      const ids = trip.attendants.map((a) => a.userId);
      try {
        const res = await fetch("/api/users/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: ids }),
        });
        if (res.ok) {
          const data = await res.json();
          setAttendantNames(data.users || {});
        }
      } catch (err) {
        console.error("Failed to load attendant names", err);
      } finally {
        setLoadingNames(false);
      }
    };

    fetchNames();
  }, [trip.attendants]);

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return "—";
    const dateStr = isoToDateString(isoString);
    if (!dateStr) return "—";
    const date = new Date(dateStr + "T12:00:00Z");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (isoString: string | undefined) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{trip.basicInfo.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        {trip.basicInfo.description && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              Description
            </h3>
            <p className="text-foreground">{trip.basicInfo.description}</p>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              Start Date
            </h3>
            <p className="text-foreground">
              {formatDate(trip.basicInfo.startDate)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              End Date
            </h3>
            <p className="text-foreground">
              {trip.basicInfo.endDate
                ? formatDate(trip.basicInfo.endDate)
                : "Ongoing"}
            </p>
          </div>
        </div>

        {/* Location Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              Departure Location
            </h3>
            <p className="text-foreground">
              {trip.basicInfo.departureLocation || "—"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              Arrival Location
            </h3>
            <p className="text-foreground">
              {trip.basicInfo.arrivalLocation || "—"}
            </p>
          </div>
        </div>

        {/* Country & Resort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              Country
            </h3>
            <p className="text-foreground">{trip.basicInfo.country || "—"}</p>
          </div>
          {trip.basicInfo.resort && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                Resort
              </h3>
              <p className="text-foreground">{trip.basicInfo.resort}</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">
            Status
          </h3>
          <p className="text-foreground capitalize">{trip.status}</p>
        </div>

        {/* Attendants */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Attendants ({trip.attendants?.length || 0})
          </h3>
          {!trip.attendants || trip.attendants.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendants</p>
          ) : (
            <div className="space-y-2">
              {trip.attendants.map((attendant, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-muted/30 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-foreground font-medium">
                      {loadingNames
                        ? "Loading..."
                        : attendantNames[attendant.userId] || "Unknown User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {attendant.role} • {attendant.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invites */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Invites ({trip.invites?.length || 0})
          </h3>
          {!trip.invites || trip.invites.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invites</p>
          ) : (
            <div className="space-y-2">
              {trip.invites.map((invite, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-muted/30 font-mono text-sm"
                >
                  <div className="text-foreground font-bold">{invite.code}</div>
                  {invite.expiresAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Expires: {formatDateTime(invite.expiresAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Created:</span>{" "}
            {formatDateTime(trip.createdAt)}
          </p>
          <p>
            <span className="font-medium text-foreground">Updated:</span>{" "}
            {formatDateTime(trip.updatedAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
