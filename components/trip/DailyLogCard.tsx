import { User, Users, Edit } from "lucide-react";
import {
  TravelSection,
  WorkSection,
  AccommodationSection,
  AdditionalSection,
} from "./LogSections";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
} from "@/app/types/DailyLog";

interface GroupedLog {
  id: string;
  date: string;
  userId: string;
  isGroup: boolean;
  appliedTo: string[];
  travels: TravelLog[];
  works: WorkTimeLog[];
  accommodations: AccommodationLog[];
  additionals: AdditionalLog[];
}

export default function DailyLogCard({
  group,
  userNames,
  loadingNames,
}: {
  group: GroupedLog;
  userNames: Record<string, string>;
  loadingNames: boolean;
}) {
  const router = useRouter();
  const dateObj = new Date(group.date);

  const getName = (id: string) =>
    loadingNames ? "..." : userNames[id] || "Unknown";

  const firstLogId =
    group.travels[0]?._id ||
    group.works[0]?._id ||
    group.accommodations[0]?._id ||
    group.additionals[0]?._id;

  const handleEdit = () => {
    if (firstLogId) {
      router.push(`/editDailyLog/${firstLogId}`);
    } else {
      console.error("No log ID found to edit this group.");
    }
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md relative">
      {/* EDIT BUTTON */}
      {firstLogId && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 p-2 h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
          onClick={handleEdit}
          title="Edit Log Group"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}

      {/* LEFT: DATE & USER INFO */}
      <div className="bg-muted/30 p-5 md:w-64 flex flex-col md:border-r border-b md:border-b-0 gap-4 shrink-0">
        {/* Date */}
        <div className="text-center md:text-left">
          <div className="text-3xl font-black text-foreground">
            {dateObj.getDate()}
          </div>
          <div className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
            {dateObj.toLocaleDateString("en-US", {
              month: "short",
              weekday: "short",
            })}
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            {dateObj.getFullYear()}
          </div>
        </div>

        <hr className="border-border/60" />

        {/* Creator */}
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
            Created By
          </span>
          <div className="flex items-center gap-2 font-medium text-foreground">
            <User className="h-4 w-4 text-primary" />
            <span className="truncate">{getName(group.userId)}</span>
          </div>
        </div>

        {/* Attendants */}
        {group.appliedTo && group.appliedTo.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest flex items-center gap-1">
              <Users className="h-3 w-3" />
              Included ({group.appliedTo.length})
            </span>
            <div className="flex flex-col gap-1 pl-1">
              {group.appliedTo.map((attendantId) => (
                <span
                  key={attendantId}
                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                >
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                  {getName(attendantId)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: CONTENT SECTIONS */}
      <div className="flex-1 p-6 space-y-8 bg-card">
        <TravelSection logs={group.travels} />
        <WorkSection logs={group.works} />
        <AccommodationSection logs={group.accommodations} />
        <AdditionalSection logs={group.additionals} />
      </div>
    </div>
  );
}
