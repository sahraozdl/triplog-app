"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs } from "@/components/ui/tabs";
import { QuickTags } from "@/components/form-elements/QuickTags";
import { ShareFieldToggle } from "@/components/form-elements/ShareFieldToggle";
import { TripAttendant } from "@/app/types/Trip";
import { WorkTimeFormState } from "@/app/types/FormStates";
import { createFetchAttendantNames } from "@/lib/utils/fetchers";
import {
  createInsertTag,
  createHandleAiGenerate,
  createHandleUndo,
} from "@/lib/utils/aiHelpers";
import { WorkTimeTabsList } from "./WorkTimeTabsList";
import { WorkTimeDefaultTab } from "./WorkTimeDefaultTab";
import { WorkTimeColleagueTab } from "./WorkTimeColleagueTab";
import { WorkTimeTimeInputs } from "./WorkTimeTimeInputs";
import { WorkTimeDescriptionField } from "./WorkTimeDescriptionField";

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

  overrides?: Record<string, WorkTimeOverride>;

  onOverridesChange?: (overrides: Record<string, WorkTimeOverride>) => void;
  shareEnabled?: boolean;
  onShareChange?: (enabled: boolean) => void;
}

export default function WorkTimeForm({
  value,
  onChange,
  appliedTo = [],
  attendants = [],
  overrides = {},
  onOverridesChange,
  shareEnabled = false,
  onShareChange,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("me");
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [descriptionHistory, setDescriptionHistory] = useState<
    Record<string, string>
  >({});

  const fetchNames = useCallback(
    createFetchAttendantNames(attendants, setNameMap),
    [attendants],
  );

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  useEffect(() => {
    if (activeTab !== "me" && !appliedTo.includes(activeTab)) {
      setActiveTab("me");
    }
  }, [appliedTo, activeTab]);

  const effectiveOverrides = useMemo(() => overrides || {}, [overrides]);

  const updateMain = useCallback(
    (field: Partial<WorkTimeFormState>) => onChange({ ...value, ...field }),
    [value, onChange],
  );

  const updateOverride = useCallback(
    (userId: string, field: Partial<WorkTimeOverride>) => {
      if (!onOverridesChange) return;
      const prev = effectiveOverrides;
      const next: Record<string, WorkTimeOverride> = {
        ...prev,
        [userId]: { ...prev[userId], ...field },
      };
      onOverridesChange(next);
    },
    [effectiveOverrides, onOverridesChange],
  );

  const insertTag = useMemo(
    () =>
      createInsertTag(
        activeTab,
        value,
        effectiveOverrides,
        updateMain,
        updateOverride,
      ),
    [activeTab, value, effectiveOverrides, updateMain, updateOverride],
  );

  const handleAiGenerate = useMemo(
    () =>
      createHandleAiGenerate(
        activeTab,
        value,
        effectiveOverrides,
        appliedTo,
        updateMain,
        updateOverride,
        setGenerating,
        setDescriptionHistory,
      ),
    [
      activeTab,
      value,
      effectiveOverrides,
      appliedTo,
      updateMain,
      updateOverride,
    ],
  );

  const handleUndo = useMemo(
    () =>
      createHandleUndo(
        activeTab,
        descriptionHistory,
        updateMain,
        updateOverride,
        setDescriptionHistory,
      ),
    [activeTab, descriptionHistory, updateMain, updateOverride],
  );

  const getName = useCallback(
    (id: string) => nameMap[id] || "Unknown User",
    [nameMap],
  );

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
            {onShareChange && (
              <div className="mb-4">
                <ShareFieldToggle
                  checked={shareEnabled}
                  onCheckedChange={onShareChange}
                  appliedTo={appliedTo}
                />
              </div>
            )}
            {appliedTo.length > 0 && shareEnabled ? (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full flex flex-col gap-6"
              >
                <WorkTimeTabsList
                  appliedTo={appliedTo}
                  getName={getName}
                  effectiveOverrides={effectiveOverrides}
                />

                <WorkTimeDefaultTab
                  value={value}
                  onStartTimeChange={(time) => updateMain({ startTime: time })}
                  onEndTimeChange={(time) => updateMain({ endTime: time })}
                  onDescriptionChange={(desc) =>
                    updateMain({ description: desc })
                  }
                  onUndo={handleUndo}
                  onAiGenerate={handleAiGenerate}
                  canUndo={!!descriptionHistory["me"]}
                  isGenerating={generating}
                  hasAppliedTo={true}
                />

                {appliedTo.map((uid) => (
                  <WorkTimeColleagueTab
                    key={uid}
                    userId={uid}
                    userName={getName(uid)}
                    override={effectiveOverrides[uid]}
                    defaultValues={value}
                    onStartTimeChange={(time) =>
                      updateOverride(uid, { startTime: time })
                    }
                    onEndTimeChange={(time) =>
                      updateOverride(uid, { endTime: time })
                    }
                    onDescriptionChange={(desc) =>
                      updateOverride(uid, { description: desc })
                    }
                    onUndo={handleUndo}
                    onAiGenerate={handleAiGenerate}
                    canUndo={!!descriptionHistory[uid]}
                    isGenerating={generating}
                  />
                ))}
              </Tabs>
            ) : (
              <div className="flex flex-col gap-6">
                <WorkTimeTimeInputs
                  startTime={value.startTime || ""}
                  endTime={value.endTime || ""}
                  onStartTimeChange={(time) => updateMain({ startTime: time })}
                  onEndTimeChange={(time) => updateMain({ endTime: time })}
                  startTimeId="time-from"
                  endTimeId="time-to"
                />

                <WorkTimeDescriptionField
                  id="work-description"
                  label="Work Description"
                  value={value.description || ""}
                  onChange={(desc) => updateMain({ description: desc })}
                  placeholder="e.g. Click tags below (Coding, Meeting...) then hit 'AI Auto-Write'"
                  onUndo={handleUndo}
                  onAiGenerate={handleAiGenerate}
                  canUndo={!!descriptionHistory["me"]}
                  isGenerating={generating}
                  className="focus:border-transparent transition-all"
                  aria-label="Work Description"
                />
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
