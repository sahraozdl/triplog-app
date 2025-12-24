"use client";

import { TabsContent } from "@/components/ui/tabs";
import { WorkTimeFormState } from "@/app/types/FormStates";
import { WorkTimeTimeInputs } from "@/components/workTime/WorkTimeTimeInputs";
import { WorkTimeDescriptionField } from "@/components/workTime/WorkTimeDescriptionField";

interface WorkTimeDefaultTabProps {
  value: WorkTimeFormState;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onDescriptionChange: (description: string) => void;
  onUndo?: () => void;
  onAiGenerate?: () => void;
  canUndo?: boolean;
  isGenerating?: boolean;
  hasAppliedTo?: boolean;
}

export function WorkTimeDefaultTab({
  value,
  onStartTimeChange,
  onEndTimeChange,
  onDescriptionChange,
  onUndo,
  onAiGenerate,
  canUndo = false,
  isGenerating = false,
  hasAppliedTo = false,
}: WorkTimeDefaultTabProps) {
  const textareaId = hasAppliedTo ? "work-description-me" : "work-description";
  const startTimeId = hasAppliedTo ? "time-from-me" : "time-from";
  const endTimeId = hasAppliedTo ? "time-to-me" : "time-to";

  return (
    <TabsContent value="me" className="mt-0 flex flex-col gap-6">
      <WorkTimeTimeInputs
        startTime={value.startTime || ""}
        endTime={value.endTime || ""}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        startTimeId={startTimeId}
        endTimeId={endTimeId}
      />

      <WorkTimeDescriptionField
        id={textareaId}
        label="Work Description"
        value={value.description || ""}
        onChange={onDescriptionChange}
        placeholder={
          hasAppliedTo
            ? "Default description for everyone..."
            : "e.g. Click tags below (Coding, Meeting...) then hit 'AI Auto-Write'"
        }
        helpText={
          hasAppliedTo
            ? "This will be applied to everyone unless overridden in their tabs."
            : undefined
        }
        onUndo={onUndo}
        onAiGenerate={onAiGenerate}
        canUndo={canUndo}
        isGenerating={isGenerating}
        className={
          !hasAppliedTo ? "focus:border-transparent transition-all" : undefined
        }
      />
    </TabsContent>
  );
}
