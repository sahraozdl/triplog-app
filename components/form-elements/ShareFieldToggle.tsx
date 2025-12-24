"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ShareFieldToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  appliedTo?: string[];
}

export function ShareFieldToggle({
  checked,
  onCheckedChange,
  label = "Share this field",
  disabled = false,
  appliedTo = [],
}: ShareFieldToggleProps) {
  const isDisabled = disabled || appliedTo.length === 0;

  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
        checked
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-muted/30 border-border"
      }`}
    >
      <Label htmlFor="share-field-toggle" variant="form">
        {label}
      </Label>
      <Switch
        id="share-field-toggle"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={isDisabled}
      />
    </div>
  );
}
