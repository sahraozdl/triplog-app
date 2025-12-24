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
    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground pl-4 sm:pl-6">
      <p className="break-words">
        <label htmlFor="trip-created" className="font-medium text-foreground">
          Created:
        </label>{" "}
        <time
          id="trip-created"
          dateTime={createdAt}
          className="block sm:inline"
        >
          {formatDateTime(createdAt)}
        </time>
      </p>
      <p className="break-words">
        <label htmlFor="trip-updated" className="font-medium text-foreground">
          Updated:
        </label>{" "}
        <time
          id="trip-updated"
          dateTime={updatedAt}
          className="block sm:inline"
        >
          {formatDateTime(updatedAt)}
        </time>
      </p>
    </div>
  );
}
