"use client";

import { User } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkTimeTabsListProps {
  appliedTo: string[];
  getName: (id: string) => string;
  effectiveOverrides: Record<
    string,
    { description?: string; startTime?: string; endTime?: string }
  >;
}

export function WorkTimeTabsList({
  appliedTo,
  getName,
  effectiveOverrides,
}: WorkTimeTabsListProps) {
  return (
    <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted p-1 rounded-md">
      <TabsTrigger value="me" triggerVariant="form">
        Me (Default)
      </TabsTrigger>
      {appliedTo.map((uid) => (
        <TabsTrigger key={uid} value={uid} triggerVariant="form" hasIcon={true}>
          <User className="h-3 w-3 opacity-70" />
          {getName(uid)}
          {(effectiveOverrides[uid]?.description ||
            effectiveOverrides[uid]?.startTime) && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
