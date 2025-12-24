"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  variant?: "default" | "dropzone" | "radio" | "form" | "meal-radio";
  isDragging?: boolean;
  isUploading?: boolean;
  disabled?: boolean;
  hideFileList?: boolean;
  selected?: boolean;
}

function Label({
  className,
  variant = "default",
  isDragging = false,
  isUploading = false,
  disabled = false,
  hideFileList = false,
  selected = false,
  ...props
}: LabelProps) {
  const baseStyles =
    variant === "dropzone"
      ? cn(
          "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          hideFileList ? "h-auto p-6 rounded-lg" : "h-40 rounded-xl",
          "bg-muted/5 hover:bg-muted/10",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/20 hover:border-primary/50",
          (isUploading || disabled) && "pointer-events-none opacity-60",
        )
      : variant === "radio"
        ? cn(
            "flex items-center justify-start gap-3 p-3 border rounded-lg cursor-pointer transition-all",
            selected
              ? "bg-primary/10 border-input text-primary shadow-sm"
              : "bg-background hover:bg-muted/50 border-border text-muted-foreground",
          )
        : variant === "meal-radio"
          ? cn(
              "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
              selected
                ? "bg-muted border-input"
                : "bg-background hover:bg-border border-border",
            )
          : variant === "form"
            ? "text-foreground"
            : "font-medium leading-normal pb-2 flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-base text-gray-700 dark:text-gray-300";

  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(baseStyles, className)}
      {...props}
    />
  );
}

export { Label };
