interface TravelCardDetailsProps {
  vehicleType?: string;
  distance?: number | null;
  isRoundTrip?: boolean;
}

export function TravelCardDetails({
  vehicleType,
  distance,
  isRoundTrip,
}: TravelCardDetailsProps) {
  if (!vehicleType && !distance && !isRoundTrip) return null;

  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
        Details
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {vehicleType && (
          <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] capitalize font-medium">
            {vehicleType}
          </span>
        )}
        {distance && <span className="text-[10px]">{distance} km</span>}
        {isRoundTrip && (
          <span className="text-[10px] italic text-muted-foreground">
            (Round Trip)
          </span>
        )}
      </div>
    </div>
  );
}
