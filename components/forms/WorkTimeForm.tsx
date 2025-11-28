"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuickTags } from "@/components/form-elements/QuickTags";
import { WorkTimeLog } from "@/app/types/DailyLog";
import { Wand2, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type WorkTimeFormState = Omit<
  WorkTimeLog,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "files"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
  | "itemType"
>;

interface Props {
  value: WorkTimeFormState;
  onChange: (val: WorkTimeFormState) => void;
}

export default function WorkTimeForm({ value, onChange }: Props) {
  const [generating, setGenerating] = useState(false);

  const update = (field: Partial<WorkTimeFormState>) =>
    onChange({ ...value, ...field });

  function insertTag(tag: string) {
    update({
      description: value.description ? `${value.description}, ${tag}` : tag,
    });
  }

  async function handleAiGenerate() {
    if (!value.startTime || !value.endTime) {
      alert("Please fill in start and end times first.");
      return;
    }

    if (!value.description.trim()) {
      alert("Please select at least one tag or write a keyword first.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_description",
          timeRange: `${value.startTime} - ${value.endTime}`,
          selectedTags: value.description.split(","),
        }),
      });

      const data = await res.json();
      if (data.description) {
        update({ description: data.description });
      }
    } catch (error) {
      console.error("AI Gen Failed", error);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Accordion
        type="single"
        collapsible
        defaultValue="work-time"
        className="w-full"
      >
        <AccordionItem value="work-time">
          <AccordionTrigger className="hover:no-underline py-4">
            <span className="text-lg font-semibold">Work Time</span>
          </AccordionTrigger>

          <AccordionContent className="pt-4 pb-6">
            <div className="flex flex-col gap-6 w-full">
              {/* START + END TIME */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="time-from">Work Start Time</Label>
                  <Input
                    type="time"
                    id="time-from"
                    onClick={(e) => e.currentTarget.showPicker()}
                    value={value.startTime}
                    onChange={(e) => update({ startTime: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="time-to">Work End Time</Label>
                  <Input
                    type="time"
                    id="time-to"
                    onClick={(e) => e.currentTarget.showPicker()}
                    value={value.endTime}
                    onChange={(e) => update({ endTime: e.target.value })}
                  />
                </div>
              </div>

              {/* DESCRIPTION & AI BUTTON */}
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                  <Label htmlFor="work-description">Work Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAiGenerate}
                    disabled={generating}
                    className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-7"
                  >
                    {generating ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="mr-1 h-3 w-3" />
                    )}
                    {generating ? "Writing..." : "AI Auto-Write"}
                  </Button>
                </div>

                <Textarea
                  id="work-description"
                  aria-label="Work Description"
                  placeholder="e.g. Click tags below (Coding, Meeting...) then hit 'AI Auto-Write'"
                  className="h-32 w-full resize-none border rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm transition-all"
                  value={value.description}
                  onChange={(e) => update({ description: e.target.value })}
                ></Textarea>
              </div>

              {/* SMART TAGS */}
              <div className="flex flex-col gap-2 w-full pt-2 border-t border-dashed">
                <QuickTags onTagClick={insertTag} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
