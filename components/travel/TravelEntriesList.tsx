"use client";

import { Travel } from "@/app/types/Travel";
import { TravelCard } from "@/components/travel/TravelCard";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { sortByLatestOrder } from "@/lib/utils/sortHelpers";

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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 2;

  const processedData = useMemo(() => {
    // Sort travels by date (newest first)
    const sortedTravels = sortByLatestOrder(
      travels,
      (travel) => travel.dateTime,
    );

    const totalPages = Math.ceil(sortedTravels.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = sortedTravels.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );

    return { totalPages, currentItems, totalCount: sortedTravels.length };
  }, [travels, currentPage]);

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
    <div>
      <div className="mb-3 sm:mb-4 text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Showing {processedData.currentItems.length} of{" "}
        {processedData.totalCount} Entries
      </div>

      <div className="space-y-3 sm:space-y-4">
        {processedData.currentItems.map((travel) => (
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

      {processedData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          <span className="text-xs sm:text-sm font-medium text-foreground min-w-[100px] text-center">
            Page {currentPage} of {processedData.totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((p) => Math.min(processedData.totalPages, p + 1))
            }
            disabled={currentPage === processedData.totalPages}
            aria-label="Next page"
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
