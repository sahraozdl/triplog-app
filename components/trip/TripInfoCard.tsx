"use client";

import { Trip } from "@/app/types/Trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { Users, Key, Info } from "lucide-react";
import { fetchUserNamesData } from "@/lib/utils/fetchers";
import { TripInfoCompactGrid } from "./TripInfoCompactGrid";
import { TripLocationInfo } from "./TripLocationInfo";
import { CollapsibleSection } from "./CollapsibleSection";
import { TripAttendantsList } from "./TripAttendantsList";
import { TripInvitesList } from "./TripInvitesList";
import { TripMetadata } from "./TripMetadata";

export function TripInfoCard({ trip }: { trip: Trip }) {
  const [attendantNames, setAttendantNames] = useState<Record<string, string>>(
    {},
  );
  const [loadingNames, setLoadingNames] = useState(true);
  const userIds = useMemo(
    () => trip.attendants?.map((a) => a.userId) || [],
    [trip.attendants],
  );

  useEffect(() => {
    if (userIds.length === 0) {
      setLoadingNames(false);
      setAttendantNames({});
      return;
    }

    setLoadingNames(true);
    fetchUserNamesData(userIds)
      .then((result) => {
        if (result.success && result.users) {
          setAttendantNames(result.users);
        } else {
          setAttendantNames({});
        }
      })
      .catch((error) => {
        console.error("Failed to load attendant names", error);
        setAttendantNames({});
      })
      .finally(() => {
        setLoadingNames(false);
      });
  }, [userIds]);

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
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
        <div className="flex flex-col min-w-0 w-full max-w-full overflow-hidden">
          <TripInfoCompactGrid trip={trip} />
          <CardTitle
            className="text-lg sm:text-xl md:text-2xl mt-4 sm:mt-5 wrap-break-word"
            id="trip-title"
          >
            {trip.basicInfo.title}
          </CardTitle>
          {trip.basicInfo.description && (
            <p
              className="wrap-break-word text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2"
              aria-describedby="trip-title"
            >
              {trip.basicInfo.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-4 sm:pb-6">
        <TripLocationInfo trip={trip} />

        {/* Collapsible Sections */}
        <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-3 border-t">
          <CollapsibleSection
            title="Attendants"
            count={trip.attendants?.length || 0}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            id="attendants"
          >
            <TripAttendantsList
              attendants={trip.attendants || []}
              attendantNames={attendantNames}
              loadingNames={loadingNames}
            />
          </CollapsibleSection>
          <CollapsibleSection
            title="Details"
            icon={<Info className="h-4 w-4 text-muted-foreground" />}
            id="metadata"
          >
            <TripMetadata
              createdAt={trip.createdAt}
              updatedAt={trip.updatedAt}
              formatDateTime={formatDateTime}
            />
          </CollapsibleSection>
        </div>
      </CardContent>
    </Card>
  );
}
