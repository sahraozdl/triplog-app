import * as React from "react";

import { cn } from "@/lib/utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  textareaVariant?: "default" | "form";
}

function Textarea({
  className,
  textareaVariant = "default",
  ...props
}: TextareaProps) {
  const baseStyles =
    textareaVariant === "form"
      ? "h-32 w-full resize-none border rounded-md p-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground border-input"
      : "";

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        baseStyles,
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
