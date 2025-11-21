import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QuickTags } from "@/components/helpers/QuickTags";

export default function WorkTimeForm() {
  return (
    <div className="px-12 py-4 min-w-72">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Work Time</AccordionTrigger>
          <AccordionContent>
            <div className="flex gap-6 justify-between pb-10">
              <div className="flex w-1/2 flex-col gap-1">
                <Label htmlFor="time-from">Work Start Time</Label>
                <Input
                  type="time"
                  id="time-from"
                  step="60"
                  defaultValue="00:00"
                  className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
              <div className="flex w-1/2 flex-col gap-1">
                <Label htmlFor="time-to">Work End Time</Label>
                <Input
                  type="time"
                  id="time-to"
                  step="60"
                  defaultValue="00:00"
                  className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>
            <div className="flex gap-1 w-full justify-end flex-col">
              <Label htmlFor="work-description">Work Description</Label>
              <textarea
                className="h-40 w-full resize-none border border-input-border rounded-md p-2 bg-input-back focus:outline-none focus:ring-0 focus:border-input-border"
                placeholder="e.g. Worked on project X, Y, Z"
                id="work-description"
                aria-label="Work Description"
              ></textarea>
            </div>
            <div className="flex gap-1 w-full justify-end flex-col">
              <QuickTags
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
