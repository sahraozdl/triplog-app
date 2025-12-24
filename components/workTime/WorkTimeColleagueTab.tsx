"use client";

import { User } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { WorkTimeFormState } from "@/app/types/FormStates";
import { WorkTimeOverride } from "@/components/workTime/WorkTimeForm";
import { WorkTimeTimeInputs } from "@/components/workTime/WorkTimeTimeInputs";
import { WorkTimeDescriptionField } from "@/components/workTime/WorkTimeDescriptionField";

interface WorkTimeColleagueTabProps {
  userId: string;
  userName: string;
  override: WorkTimeOverride | undefined;
  defaultValues: WorkTimeFormState;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onDescriptionChange: (description: string) => void;
  onUndo?: () => void;
  onAiGenerate?: () => void;
  canUndo?: boolean;
  isGenerating?: boolean;
}

export function WorkTimeColleagueTab({
  userId,
  userName,
  override,
  defaultValues,
  onStartTimeChange,
  onEndTimeChange,
  onDescriptionChange,
  onUndo,
  onAiGenerate,
  canUndo = false,
  isGenerating = false,
}: WorkTimeColleagueTabProps) {
  return (
    <TabsContent value={userId} className="mt-0 flex flex-col gap-6">
      <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg space-y-4">
        <p className="text-xs font-medium text-primary flex items-center gap-2">
          <User className="h-3 w-3" />
          Customizing for {userName}
        </p>

        <WorkTimeTimeInputs
          startTime={override?.startTime || ""}
          endTime={override?.endTime || ""}
          onStartTimeChange={onStartTimeChange}
          onEndTimeChange={onEndTimeChange}
          startTimeId={`time-from-${userId}`}
          endTimeId={`time-to-${userId}`}
          startTimeLabel="Start Time (Optional)"
          endTimeLabel="End Time (Optional)"
        />

        <WorkTimeDescriptionField
          id={`work-desc-${userId}`}
          label="Description (Optional)"
          value={override?.description || ""}
          onChange={onDescriptionChange}
          placeholder={`Specific work description for ${userName}...`}
          helpText="Leave empty to use the default description and time."
          onUndo={onUndo}
          onAiGenerate={onAiGenerate}
          canUndo={canUndo}
          isGenerating={isGenerating}
        />
      </div>
    </TabsContent>
  );
}
