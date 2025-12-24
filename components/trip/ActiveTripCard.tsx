"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Trip } from "@/app/types/Trip";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Users,
  Crown,
  User,
} from "lucide-react";
import { useAppUser } from "@/components/providers/AppUserProvider";

export default function ActiveTripCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  const user = useAppUser();

  const handleViewTrip = () => {
    router.push(`/trip/${trip._id}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  const isOwner = user?.userId === trip.creatorId;
  const attendantCount = trip.attendants?.length || 0;

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden border transition-all hover:shadow-lg hover:border-primary/50 bg-card text-card-foreground sm:max-w-sm w-full">
      <div className="p-4 pb-2 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex gap-2">
              <Badge
                variant={isOwner ? "default" : "secondary"}
                className="h-5 px-1.5 text-[10px] gap-1 font-medium rounded-md w-fit"
              >
                {isOwner ? (
                  <Crown className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                {isOwner ? "Owner" : "Guest"}
              </Badge>
              <Badge
                variant="outline"
                className="h-5 px-2 text-[10px] border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 gap-1.5 w-fit"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                Active
              </Badge>
            </div>

            <h3
              className="font-bold text-lg leading-tight truncate pr-2"
              title={trip.basicInfo.title}
            >
              {trip.basicInfo.title}
            </h3>
          </div>
        </div>
      </div>

      <CardContent className="p-4 pt-0 space-y-3">
        <div className="grid gap-2 text-sm text-muted-foreground">
          {/* Location */}
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-foreground/80 font-medium">
              {trip.basicInfo.country || "Unknown"}
              {trip.basicInfo.resort && (
                <span className="text-muted-foreground font-normal">
                  , {trip.basicInfo.resort}
                </span>
              )}
            </span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
              <span>{formatDate(trip.basicInfo.startDate)}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
              <span>
                {trip.basicInfo.endDate
                  ? formatDate(trip.basicInfo.endDate)
                  : "Ongoing"}
              </span>
            </div>
          </div>

          {/* Attendants Count */}
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground/80 font-medium">
              {attendantCount} {attendantCount === 1 ? "Person" : "People"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          variant="secondary"
          className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          onClick={handleViewTrip}
        >
          <span className="text-xs font-semibold uppercase tracking-wider">
            Manage Trip
          </span>
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
}
