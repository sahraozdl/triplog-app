import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  inputVariant?: "default" | "time";
}

function Input({ className, type, inputVariant, ...props }: InputProps) {
  const baseStyles =
    inputVariant === "time" || type === "time"
      ? "bg-background text-foreground border-input [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-80"
      : "";

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "cursor-pointer file:text-foreground placeholder:text-muted-foreground font-normal selection:bg-input-back selection:text-primary-foreground border-input-border h-12 w-full min-w-0 rounded-md border bg-input-back px-4 py-2 text-base shadow-xs transition-[color,box-shadow]  outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-input-border focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "dark:aria-invalid:ring-destructive/20 aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        baseStyles,
        className,
      )}
      {...props}
    />
  );
}

export { Input };
