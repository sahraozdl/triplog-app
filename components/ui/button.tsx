import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-6 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer w-1/2 sm:w-auto flex-1 sm:flex-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 p-5 border border-input-border",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 p-5 border border-input-border",
        outline:
          "border bg-input-back shadow-xs hover:text-accent-foreground border-input-border p-5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 p-5",
        ghost: " hover:text-accent-foreground  p-5 border-none justify-start",
        link: "text-primary underline-offset-4 hover:underline p-5",
      },
      size: {
        default: "h-12 px-4 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "action-sm": "h-7 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const actionButtonVariants = cva("", {
  variants: {
    actionType: {
      default: "",
      undo: "text-muted-foreground hover:bg-muted",
      ai: "text-primary hover:bg-primary/10",
    },
  },
  defaultVariants: {
    actionType: "default",
  },
});

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  actionType?: "default" | "undo" | "ai";
}

function Button({
  className,
  variant,
  size,
  actionType = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        actionType !== "default" && actionButtonVariants({ actionType }),
        className,
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
