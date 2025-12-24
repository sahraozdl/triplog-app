import { Clock } from "lucide-react";

interface TravelCardTimeProps {
  startTime?: string;
  endTime?: string;
}

export function TravelCardTime({ startTime, endTime }: TravelCardTimeProps) {
  if (!startTime && !endTime) return null;

  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
        Time
      </div>
      <div className="flex items-center gap-1.5 font-medium text-xs">
        <Clock
          className="h-3 w-3 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <span aria-label={`Time: ${startTime || "?"} to ${endTime || "?"}`}>
          {startTime || "?"} - {endTime || "?"}
        </span>
      </div>
    </div>
  );
}
