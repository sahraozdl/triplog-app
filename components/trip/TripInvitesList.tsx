"use client";

import { TripInvite } from "@/app/types/Trip";

interface TripInvitesListProps {
  invites: TripInvite[];
  formatDateTime: (isoString: string | undefined) => string;
}

export function TripInvitesList({
  invites,
  formatDateTime,
}: TripInvitesListProps) {
  if (invites.length === 0) {
    return (
      <p className="text-muted-foreground text-xs sm:text-sm pl-6">
        No invites
      </p>
    );
  }

  return (
    <div className="space-y-1.5 pl-6" role="list">
      {invites.map((invite, index) => (
        <div
          key={`${invite.code}-${index}`}
          className="p-2 border rounded-md bg-muted/30 font-mono text-xs sm:text-sm"
          role="listitem"
        >
          <div className="font-bold text-foreground">{invite.code}</div>
          {invite.expiresAt && (
            <div className="text-muted-foreground text-xs mt-0.5">
              <label className="sr-only">Expires</label>
              <time dateTime={invite.expiresAt}>
                Expires: {formatDateTime(invite.expiresAt)}
              </time>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
