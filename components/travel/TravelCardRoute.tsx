import { MapPin } from "lucide-react";

interface TravelCardRouteProps {
  departureLocation: string;
  destination: string;
}

export function TravelCardRoute({
  departureLocation,
  destination,
}: TravelCardRouteProps) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
        Route
      </div>
      <div className="flex items-center gap-1.5 text-foreground font-medium text-xs">
        <MapPin
          className="h-3 w-3 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <span
          className="truncate"
          aria-label={`From ${departureLocation} to ${destination}`}
        >
          {departureLocation}{" "}
          <span className="text-muted-foreground" aria-hidden="true">
            →
          </span>{" "}
          {destination}
        </span>
      </div>
    </div>
  );
}
