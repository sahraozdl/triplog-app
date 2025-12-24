"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Undo2 } from "lucide-react";

interface WorkTimeDescriptionFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  onUndo?: () => void;
  onAiGenerate?: () => void;
  canUndo?: boolean;
  isGenerating?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function WorkTimeDescriptionField({
  id,
  label,
  value,
  onChange,
  placeholder,
  helpText,
  onUndo,
  onAiGenerate,
  canUndo = false,
  isGenerating = false,
  className,
  "aria-label": ariaLabel,
}: WorkTimeDescriptionFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor={id} variant="form">
          {label}
        </Label>
        <div className="flex items-center gap-2">
          {onUndo && (
            <Button
              type="button"
              variant="ghost"
              size="action-sm"
              actionType="undo"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="mr-1 h-3 w-3" />
              Undo
            </Button>
          )}
          {onAiGenerate && (
            <Button
              type="button"
              variant="ghost"
              size="action-sm"
              actionType="ai"
              onClick={onAiGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="mr-1 h-3 w-3" />
              )}
              AI Auto-Write
            </Button>
          )}
        </div>
      </div>
      <Textarea
        id={id}
        placeholder={placeholder}
        textareaVariant="form"
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
}
