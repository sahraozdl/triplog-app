interface TravelCardHeaderProps {
  date: Date;
}

export function TravelCardHeader({ date }: TravelCardHeaderProps) {
  return (
    <div className="text-center md:text-left">
      <div className="text-2xl font-black text-foreground" aria-label="Day">
        {date.getDate()}
      </div>
      <div
        className="text-xs font-bold uppercase text-muted-foreground tracking-wider"
        aria-label="Month and weekday"
      >
        {date.toLocaleDateString("en-US", {
          month: "short",
          weekday: "short",
        })}
      </div>
      <div
        className="text-[10px] text-muted-foreground mt-0.5 font-medium"
        aria-label="Year"
      >
        {date.getFullYear()}
      </div>
    </div>
  );
}
