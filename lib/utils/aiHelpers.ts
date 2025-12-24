import * as React from "react";
import { WorkTimeFormState } from "@/app/types/FormStates";
import { WorkTimeOverride } from "@/components/workTime/WorkTimeForm";

export function createInsertTag(
  activeTab: string,
  value: WorkTimeFormState,
  effectiveOverrides: Record<string, WorkTimeOverride>,
  updateMain: (field: Partial<WorkTimeFormState>) => void,
  updateOverride: (userId: string, field: Partial<WorkTimeOverride>) => void,
) {
  return (tag: string) => {
    if (activeTab === "me") {
      const currentDesc = value.description || "";
      const newDesc = currentDesc ? `${currentDesc}, ${tag}` : tag;
      updateMain({ description: newDesc });
    } else {
      const currentDesc = effectiveOverrides[activeTab]?.description || "";
      const newDesc = currentDesc ? `${currentDesc}, ${tag}` : tag;
      updateOverride(activeTab, { description: newDesc });
    }
  };
}

export function createHandleAiGenerate(
  activeTab: string,
  value: WorkTimeFormState,
  effectiveOverrides: Record<string, WorkTimeOverride>,
  appliedTo: string[],
  updateMain: (field: Partial<WorkTimeFormState>) => void,
  updateOverride: (userId: string, field: Partial<WorkTimeOverride>) => void,
  setGenerating: (generating: boolean) => void,
  setDescriptionHistory: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >,
) {
  return async () => {
    let currentStart = value.startTime;
    let currentEnd = value.endTime;
    let currentDesc = value.description;

    if (activeTab !== "me") {
      currentStart =
        effectiveOverrides[activeTab]?.startTime || value.startTime;
      currentEnd = effectiveOverrides[activeTab]?.endTime || value.endTime;
      currentDesc = effectiveOverrides[activeTab]?.description || "";
    }

    if (!currentStart || !currentEnd) {
      alert("Please fill in start and end times first.");
      return;
    }

    const textareaId =
      activeTab === "me"
        ? appliedTo.length > 0
          ? "work-description-me"
          : "work-description"
        : `work-desc-${activeTab}`;
    const textareaElement = document.getElementById(
      textareaId,
    ) as HTMLTextAreaElement;

    if (!textareaElement) {
      console.error("Textarea element not found");
      return;
    }

    const fullText = textareaElement.value || currentDesc || "";
    const selectedText = textareaElement.value.substring(
      textareaElement.selectionStart,
      textareaElement.selectionEnd,
    );

    if (!currentDesc?.trim() && !selectedText.trim()) {
      alert(
        "Please select at least one tag or write keywords first, or select text to regenerate.",
      );
      return;
    }

    const historyKey = activeTab === "me" ? "me" : activeTab;
    setDescriptionHistory((prev) => ({
      ...prev,
      [historyKey]: currentDesc || "",
    }));

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_description",
          timeRange: `${currentStart} - ${currentEnd}`,
          selectedTags: currentDesc ? currentDesc.split(",") : [],
          fullText: fullText || undefined,
          selectedText: selectedText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.description) {
        let newDescription: string;

        if (selectedText.trim()) {
          const beforeSelection = fullText.substring(
            0,
            textareaElement.selectionStart,
          );
          const afterSelection = fullText.substring(
            textareaElement.selectionEnd,
          );
          newDescription = `${beforeSelection}${data.description}${afterSelection}`;
        } else {
          newDescription = data.description;
        }

        if (activeTab === "me") {
          updateMain({ description: newDescription });
        } else {
          updateOverride(activeTab, { description: newDescription });
        }
      }
    } catch (error) {
      console.error("AI Gen Failed", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setGenerating(false);
    }
  };
}

export function createHandleUndo(
  activeTab: string,
  descriptionHistory: Record<string, string>,
  updateMain: (field: Partial<WorkTimeFormState>) => void,
  updateOverride: (userId: string, field: Partial<WorkTimeOverride>) => void,
  setDescriptionHistory: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >,
) {
  return () => {
    const historyKey = activeTab === "me" ? "me" : activeTab;
    const previousDescription = descriptionHistory[historyKey];

    if (previousDescription !== undefined) {
      if (activeTab === "me") {
        updateMain({ description: previousDescription });
      } else {
        updateOverride(activeTab, { description: previousDescription });
      }
      // Clear history after undo
      setDescriptionHistory((prev) => {
        const next = { ...prev };
        delete next[historyKey];
        return next;
      });
    }
  };
}
