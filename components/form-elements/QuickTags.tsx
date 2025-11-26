"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagObject {
  label: string;
  category: string;
}

const initialTags: TagObject[] = [
  { label: "team meeting", category: "communication, planning" },
  { label: "client call", category: "communication, support" },
  { label: "requirements review", category: "planning, analysis" },
  { label: "technical research", category: "research, analysis" },
  { label: "feature development", category: "coding, development" },
  { label: "bug fixing", category: "debugging, development" },
  {
    label: "code refactoring",
    category: "debugging, optimization, development",
  },
  { label: "unit testing", category: "testing, development" },
  { label: "integration testing", category: "testing, deployment" },
  { label: "performance optimization", category: "optimization, testing" },
  { label: "code documentation", category: "writing, documentation" },
  { label: "API documentation", category: "writing, documentation" },
  { label: "deployment preparation", category: "deployment, operations" },
  { label: "production deployment", category: "deployment, operations" },
  { label: "system maintenance", category: "maintenance, support" },
  { label: "user support", category: "support, communication" },
  { label: "onboarding training", category: "training, support" },
  { label: "knowledge transfer", category: "training, documentation" },
  { label: "quality assurance review", category: "testing, analysis" },
  { label: "incident resolution", category: "support, operations, debugging" },
];

function getRelatedTags(category: string, allTags: TagObject[]): TagObject[] {
  const categories = category.split(",").map((c) => c.trim());
  return allTags.filter((tag) => {
    const tagCats = tag.category.split(",").map((c) => c.trim());
    return tagCats.some((c) => categories.includes(c));
  });
}

export function QuickTags({
  onTagClick,
}: {
  onTagClick?: (tag: string) => void;
}) {
  const [tags, setTags] = useState(initialTags);
  const [expandedTags, setExpandedTags] = useState<TagObject[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleSelection(label: string) {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  function handleTagClick(tag: TagObject) {
    const willBeSelected = !selectedTags.includes(tag.label);

    toggleSelection(tag.label);

    if (willBeSelected) {
      onTagClick?.(tag.label);
    }

    const related = getRelatedTags(tag.category, tags);
    setExpandedTags((prev) => {
      const newOnes = related.filter(
        (r) => !prev.some((p) => p.label === r.label) && r.label !== tag.label,
      );
      return [...prev, ...newOnes];
    });
  }

  function addCustomTag(e: React.FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!customTag.trim()) return;

    const newTag = { label: customTag.trim(), category: "general" };

    setTags((prev) => [...prev, newTag]);
    onTagClick?.(newTag.label);
    setCustomTag("");
  }

  const selectedStyle = "bg-primary text-primary-foreground border-primary";
  const unselectedStyle =
    "bg-secondary text-secondary-foreground hover:bg-primary/60 hover:text-primary-foreground";

  return (
    <div className="mt-4 space-y-3 w-full">
      <h3 className="text-sm font-semibold">Quick Tags</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {tags.slice(0, 8).map((tag) => (
          <Badge
            key={tag.label}
            variant="secondary"
            className={`cursor-pointer transition-all border wrap-break-word text-center py-1 ${
              selectedTags.includes(tag.label) ? selectedStyle : unselectedStyle
            }`}
            onClick={() => handleTagClick(tag)}
          >
            {tag.label}
          </Badge>
        ))}
      </div>

      {expandedTags.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
          {expandedTags.map((tag) => (
            <Badge
              key={tag.label}
              className={`cursor-pointer border text-center wrap-break-word py-1 ${
                selectedTags.includes(tag.label)
                  ? selectedStyle
                  : unselectedStyle
              }`}
              onClick={() => handleTagClick(tag)}
            >
              {tag.label}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <Input
          placeholder="Add custom tag..."
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          className="w-full"
        />
        <Button
          variant="secondary"
          type="button"
          onClick={addCustomTag}
          className="w-full sm:w-auto"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
