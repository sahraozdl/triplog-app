"use client";

interface TripMetadataProps {
  createdAt: string;
  updatedAt: string;
  formatDateTime: (isoString: string | undefined) => string;
}

export function TripMetadata({
  createdAt,
  updatedAt,
  formatDateTime,
}: TripMetadataProps) {
  return (
    <div className="space-y-1 text-xs sm:text-sm text-muted-foreground pl-6">
      <p>
        <label htmlFor="trip-created" className="font-medium text-foreground">
          Created:
        </label>{" "}
        <time id="trip-created" dateTime={createdAt}>
          {formatDateTime(createdAt)}
        </time>
      </p>
      <p>
        <label htmlFor="trip-updated" className="font-medium text-foreground">
          Updated:
        </label>{" "}
        <time id="trip-updated" dateTime={updatedAt}>
          {formatDateTime(updatedAt)}
        </time>
      </p>
    </div>
  );
}
