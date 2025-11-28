import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion(
  props: React.ComponentProps<typeof AccordionPrimitive.Root>,
) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex w-full">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          `
          flex w-full items-center justify-between gap-3 
          rounded-md border border-gray-300 dark:border-gray-800 
          bg-sidebar p-4
          text-left font-bold outline-none transition-all
          
          focus-visible:ring-[3px] focus-visible:ring-ring/50

          text-xl md:text-2xl
          max-w-full md:max-w-3/4 mx-auto

          data-[state=open]:rounded-b-none
          [&[data-state=open]>svg]:rotate-180
        `,
          className,
        )}
        {...props}
      >
        {children}

        <ChevronDownIcon
          className="
            text-muted-foreground pointer-events-none
            size-6 md:size-10
            shrink-0 transition-transform duration-200
          "
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      {...props}
      className={cn(
        `
        overflow-hidden
        data-[state=open]:animate-accordion-down
        data-[state=closed]:animate-accordion-up
        
        border border-gray-300 dark:border-gray-800 
        rounded-b-md bg-sidebar
        
        max-w-full md:max-w-3/4 mx-auto
        px-4 md:px-8 py-4
      `,
        className,
      )}
    >
      <div className="w-full">{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
