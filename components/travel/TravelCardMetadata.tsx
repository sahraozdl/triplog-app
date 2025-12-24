import { User, Users } from "lucide-react";

interface TravelCardMetadataProps {
  creatorName: string;
  participants: string[];
  participantNames: string[];
}

export function TravelCardMetadata({
  creatorName,
  participants,
  participantNames,
}: TravelCardMetadataProps) {
  return (
    <>
      <div className="flex flex-col gap-1 text-xs">
        <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest">
          Created By
        </span>
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <User className="h-3 w-3 text-primary" aria-hidden="true" />
          <span className="truncate">{creatorName}</span>
        </div>
      </div>

      {participants.length > 1 && (
        <div className="flex flex-col gap-1.5 mt-0.5">
          <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            Participants ({participants.length})
          </span>
          <div className="flex flex-col gap-1 pl-0.5">
            {participantNames.slice(0, 3).map((name, idx) => (
              <span
                key={participants[idx]}
                className="text-[10px] text-muted-foreground flex items-center gap-1"
              >
                <div
                  className="w-1 h-1 rounded-full bg-muted-foreground/50"
                  aria-hidden="true"
                />
                {name}
              </span>
            ))}
            {participantNames.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{participantNames.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
