"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Trip } from "@/app/types/Trip";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CalendarDays,
  MapPin,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ReportsIndexPage() {
  const user = useAppUser();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchTrips() {
      const tripIds = [
        ...(user?.activeTrips || []),
        ...(user?.pastTrips || []),
      ];

      if (tripIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/trips?ids=${tripIds.join(",")}`);
        const data = await res.json();
        if (data.success) {
          setTrips(data.trips);
        }
      } catch (error) {
        console.error("Failed to fetch trips for reports", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, [user]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            View and export detailed reports for all your trips.
          </p>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl bg-muted/30">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium">No reports available</h3>
            <p className="text-muted-foreground">
              You haven&apos;t joined any trips yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card
                key={trip._id}
                className="flex flex-col group hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant={
                        trip.status === "active" ? "default" : "secondary"
                      }
                      className="capitalize"
                    >
                      {trip.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(trip.createdAt).getFullYear()}
                    </span>
                  </div>
                  <CardTitle
                    className="line-clamp-1"
                    title={trip.basicInfo.title}
                  >
                    {trip.basicInfo.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 text-sm text-muted-foreground space-y-2.5">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span>
                      {new Date(trip.basicInfo.startDate).toLocaleDateString()}
                      {trip.basicInfo.endDate
                        ? ` - ${new Date(trip.basicInfo.endDate).toLocaleDateString()}`
                        : " (Ongoing)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {[trip.basicInfo.country, trip.basicInfo.resort]
                        .filter(Boolean)
                        .join(", ") || "No location set"}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    className="w-full justify-between"
                    variant="secondary"
                    onClick={() => router.push(`/reports/${trip._id}`)}
                  >
                    View Report{" "}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
