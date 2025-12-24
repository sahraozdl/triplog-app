"use client";

import { Travel } from "@/app/types/Travel";
import { TravelCard } from "@/components/travel/TravelCard";
import { useRouter } from "next/navigation";

interface TravelEntriesListProps {
  travels: Travel[];
  userNames: Record<string, string>;
  loadingNames: boolean;
  tripId: string;
  onTravelsChange: () => void;
}

export function TravelEntriesList({
  travels,
  userNames,
  loadingNames,
  tripId,
  onTravelsChange,
}: TravelEntriesListProps) {
  const router = useRouter();

  if (!travels || travels.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg bg-muted/10">
        <p className="text-muted-foreground text-sm">
          No travel entries recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {travels.map((travel) => (
        <TravelCard
          key={travel._id.toString()}
          travel={travel}
          userNames={userNames}
          loadingNames={loadingNames}
          tripId={tripId}
          onDelete={onTravelsChange}
          onEdit={(travel) => {
            router.push(`/editTravel/${travel._id}`);
          }}
        />
      ))}
    </div>
  );
}
