"use client";

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickTags } from "@/components/form-elements/QuickTags";
import { WorkTimeLog } from "@/app/types/DailyLog";
import { Wand2, Loader2, User } from "lucide-react";
import { TripAttendant } from "@/app/types/Trip";
import { Textarea } from "../ui/textarea";

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

export interface WorkTimeOverride {
  description?: string;
  startTime?: string;
  endTime?: string;
}

interface Props {
  value: WorkTimeFormState;
  onChange: (val: WorkTimeFormState) => void;
  appliedTo?: string[];
  attendants?: TripAttendant[];

  // parent'ten gelen override map'i
  overrides?: Record<string, WorkTimeOverride>;

  // override değişince parent'e geri bildirim
  onOverridesChange?: (overrides: Record<string, WorkTimeOverride>) => void;
}

export default function WorkTimeForm({
  value,
  onChange,
  appliedTo = [],
  attendants = [],
  overrides = {},
  onOverridesChange,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("me");

  // appliedTo değişirse, geçersiz bir tab'deysek "me"ye dön
  useEffect(() => {
    if (activeTab !== "me" && !appliedTo.includes(activeTab)) {
      setActiveTab("me");
    }
  }, [appliedTo, activeTab]);

  const effectiveOverrides = overrides || {};

  const updateMain = (field: Partial<WorkTimeFormState>) =>
    onChange({ ...value, ...field });

  const updateOverride = (userId: string, field: Partial<WorkTimeOverride>) => {
    if (!onOverridesChange) return;
    const prev = effectiveOverrides;
    const next: Record<string, WorkTimeOverride> = {
      ...prev,
      [userId]: { ...prev[userId], ...field },
    };
    onOverridesChange(next);
  };

  function insertTag(tag: string) {
    if (activeTab === "me") {
      const currentDesc = value.description || "";
      const newDesc = currentDesc ? `${currentDesc}, ${tag}` : tag;
      updateMain({ description: newDesc });
    } else {
      const currentDesc = effectiveOverrides[activeTab]?.description || "";
      const newDesc = currentDesc ? `${currentDesc}, ${tag}` : tag;
      updateOverride(activeTab, { description: newDesc });
    }
  }

  async function handleAiGenerate() {
    let currentStart = value.startTime;
    let currentEnd = value.endTime;
    let currentDesc = value.description;

    if (activeTab !== "me") {
      currentStart =
        effectiveOverrides[activeTab]?.startTime || value.startTime;
      currentEnd =
        effectiveOverrides[activeTab]?.endTime || value.endTime;
      currentDesc = effectiveOverrides[activeTab]?.description || "";
    }

    if (!currentStart || !currentEnd) {
      alert("Please fill in start and end times first.");
      return;
    }

    if (!currentDesc || !currentDesc.trim()) {
      alert("Please select at least one tag or write keywords first.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_description",
          timeRange: `${currentStart} - ${currentEnd}`,
          selectedTags: currentDesc.split(","),
        }),
      });

      const data = await res.json();
      if (data.description) {
        if (activeTab === "me") {
          updateMain({ description: data.description });
        } else {
          updateOverride(activeTab, { description: data.description });
        }
      }
    } catch (error) {
      console.error("AI Gen Failed", error);
    } finally {
      setGenerating(false);
    }
  }

  const getName = (id: string) => {
    const att = attendants.find((a) => a.userId === id);
    if (att && (att as any).name) return (att as any).name as string;
    return `User ${id.slice(-4)}`;
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Accordion
        type="single"
        collapsible
        defaultValue="work-time"
        className="w-full"
      >
        <AccordionItem value="work-time">
          <AccordionTrigger className="hover:no-underline py-4 text-foreground">
            <span className="text-lg font-semibold flex items-center gap-2">
              Work Time
            </span>
          </AccordionTrigger>

          <AccordionContent className="pt-4 pb-6">
            {appliedTo.length > 0 ? (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full flex flex-col gap-6"
              >
                <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted p-1 rounded-md">
                  <TabsTrigger
                    value="me"
                    className="flex-1 min-w-[100px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Me (Default)
                  </TabsTrigger>
                  {appliedTo.map((uid) => (
                    <TabsTrigger
                      key={uid}
                      value={uid}
                      className="flex-1 min-w-[100px] gap-2 relative data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <User className="h-3 w-3 opacity-70" />
                      {getName(uid)}
                      {(effectiveOverrides[uid]?.description ||
                        effectiveOverrides[uid]?.startTime) && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* ME TAB */}
                <TabsContent value="me" className="mt-0 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="flex flex-col gap-2 w-full">
                      <Label htmlFor="time-from-me" className="text-foreground">
                        Work Start Time
                      </Label>
                      <Input
                        type="time"
                        id="time-from-me"
                        value={value.startTime}
                        onChange={(e) =>
                          updateMain({ startTime: e.target.value })
                        }
                        className="
                          bg-background text-foreground border-input 
                          [&::-webkit-calendar-picker-indicator]:invert 
                          [&::-webkit-calendar-picker-indicator]:opacity-80
                        "
                      />
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <Label htmlFor="time-to-me" className="text-foreground">
                        Work End Time
                      </Label>
                      <Input
                        type="time"
                        id="time-to-me"
                        value={value.endTime}
                        onChange={(e) =>
                          updateMain({ endTime: e.target.value })
                        }
                        className="
                          bg-background text-foreground border-input 
                          [&::-webkit-calendar-picker-indicator]:invert 
                          [&::-webkit-calendar-picker-indicator]:opacity-80
                        "
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <Label
                        htmlFor="work-description-me"
                        className="text-foreground"
                      >
                        Work Description
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAiGenerate}
                        disabled={generating}
                        className="text-xs text-primary hover:bg-primary/10 h-7"
                      >
                        {generating ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="mr-1 h-3 w-3" />
                        )}
                        AI Auto-Write
                      </Button>
                    </div>
                    <textarea
                      id="work-description-me"
                      placeholder="Default description for everyone..."
                      className="h-32 w-full resize-none border rounded-md p-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground border-input"
                      value={value.description}
                      onChange={(e) =>
                        updateMain({ description: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be applied to everyone unless overridden in
                      their tabs.
                    </p>
                  </div>
                </TabsContent>

                {/* COLLEAGUE TABS */}
                {appliedTo.map((uid) => (
                  <TabsContent
                    key={uid}
                    value={uid}
                    className="mt-0 flex flex-col gap-6"
                  >
                    <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg space-y-4">
                      <p className="text-xs font-medium text-primary flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Customizing for {getName(uid)}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="flex flex-col gap-2 w-full">
                          <Label
                            htmlFor={`time-from-${uid}`}
                            className="text-foreground"
                          >
                            Start Time (Optional)
                          </Label>
                          <Input
                            type="time"
                            id={`time-from-${uid}`}
                            value={effectiveOverrides[uid]?.startTime || ""}
                            placeholder={value.startTime}
                            onChange={(e) =>
                              updateOverride(uid, {
                                startTime: e.target.value,
                              })
                            }
                            className="
                              bg-background text-foreground border-input 
                              [&::-webkit-calendar-picker-indicator]:invert 
                              [&::-webkit-calendar-picker-indicator]:opacity-80
                            "
                          />
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <Label
                            htmlFor={`time-to-${uid}`}
                            className="text-foreground"
                          >
                            End Time (Optional)
                          </Label>
                          <Input
                            type="time"
                            id={`time-to-${uid}`}
                            value={effectiveOverrides[uid]?.endTime || ""}
                            placeholder={value.endTime}
                            onChange={(e) =>
                              updateOverride(uid, {
                                endTime: e.target.value,
                              })
                            }
                            className="
                              bg-background text-foreground border-input 
                              [&::-webkit-calendar-picker-indicator]:invert 
                              [&::-webkit-calendar-picker-indicator]:opacity-80
                            "
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify_between mb-1">
                          <Label
                            htmlFor={`work-desc-${uid}`}
                            className="text-foreground"
                          >
                            Description (Optional)
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleAiGenerate}
                            disabled={generating}
                            className="text-xs text-primary hover:bg-primary/10 h-7"
                          >
                            {generating ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="mr-1 h-3 w-3" />
                            )}
                            AI Auto-Write
                          </Button>
                        </div>
                        <textarea
                          id={`work-desc-${uid}`}
                          placeholder={`Specific work description for ${getName(uid)}...`}
                          className="h-32 w-full resize-none border rounded-md p-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground border-input"
                          value={effectiveOverrides[uid]?.description || ""}
                          onChange={(e) =>
                            updateOverride(uid, {
                              description: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty to use the default description and time.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // hiç colleague yoksa
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="time-from" className="text-foreground">
                      Work Start Time
                    </Label>
                    <Input
                      type="time"
                      id="time-from"
                      value={value.startTime}
                      onChange={(e) =>
                        updateMain({ startTime: e.target.value })
                      }
                      className="bg-background text-foreground border-input 
                        [&::-webkit-calendar-picker-indicator]:invert 
                        [&::-webkit-calendar-picker-indicator]:opacity-80
                      "
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="time-to" className="text-foreground">
                      Work End Time
                    </Label>
                    <Input
                      type="time"
                      id="time-to"
                      value={value.endTime}
                      onChange={(e) =>
                        updateMain({ endTime: e.target.value })
                      }
                      className="bg-background text-foreground border-input 
                        [&::-webkit-calendar-picker-indicator]:invert 
                        [&::-webkit-calendar-picker-indicator]:opacity-80
                      "
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between mb-1">
                    <Label
                      htmlFor="work-description"
                      className="text-foreground"
                    >
                      Work Description
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAiGenerate}
                      disabled={generating}
                      className="text-xs text-primary hover:bg-primary/10 h-7"
                    >
                      {generating ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="mr-1 h-3 w-3" />
                      )}
                      AI Auto-Write
                    </Button>
                  </div>
                  <Textarea
                    id="work-description"
                    aria-label="Work Description"
                    placeholder="e.g. Click tags below (Coding, Meeting...) then hit 'AI Auto-Write'"
                    className="h-32 w-full resize-none border rounded-md p-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm transition-all text-foreground border-input"
                    value={value.description}
                    onChange={(e) =>
                      updateMain({ description: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full pt-4 border-t border-border border-dashed mt-2">
              <QuickTags onTagClick={insertTag} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
