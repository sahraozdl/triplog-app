"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  icon: ReactNode;
  children: ReactNode;
  id: string;
}

export function CollapsibleSection({
  title,
  count,
  icon,
  children,
  id,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-0 hover:bg-transparent group"
          aria-expanded={isOpen}
          aria-controls={`${id}-content`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden="true">{icon}</span>
            <span>
              {title}
              {count !== undefined && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  ({count})
                </span>
              )}
            </span>
          </div>
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent id={`${id}-content`} className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
