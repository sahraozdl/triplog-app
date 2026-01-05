"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

const initialTags = [
  "coding",
  "debugging",
  "system design",
  "content writing",
  "video editing",
  "social media",
];

export function QuickTags({
  onTagClick,
  tripId,
  jobTitle,
}: {
  onTagClick?: (tag: string, isSelected: boolean) => void;
  tripId?: string;
  jobTitle?: string;
}) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingTag, setLoadingTag] = useState<string | null>(null);

  async function handleTagClick(tag: string) {
    const isSelected = selectedTags.includes(tag);
    if (isSelected) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }

    onTagClick?.(tag, !isSelected);

    if (!isSelected) {
      setLoadingTag(tag);
      try {
        const res = await fetch("/api/ai/generate-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: tag,
            tripId: tripId || undefined,
            jobTitle: jobTitle || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tags)) {
            setTags((prev) => {
              const combined = [...prev, ...data.tags];
              return Array.from(new Set(combined));
            });
          }
        }
      } catch (error) {
        console.error("AI Tag gen error", error);
      } finally {
        setLoadingTag(null);
      }
    }
  }

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          Smart Tags
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);

          return (
            <Badge
              key={tag}
              variant={isSelected ? "default" : "secondary"}
              className={`
                cursor-pointer transition-all py-1.5 px-3 border
                ${
                  isSelected
                    ? "hover:bg-primary/90 border-primary"
                    : "hover:bg-primary/10 hover:text-primary border-transparent hover:border-primary/20"
                }
                ${loadingTag === tag ? "animate-pulse opacity-70" : ""}
              `}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
              {loadingTag === tag && (
                <span className="ml-1.5 text-[10px]">✨</span>
              )}
            </Badge>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="h-7 px-2 rounded-full border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        * Selecting a tag will use AI to suggest related activities.
      </p>
    </div>
  );
}
