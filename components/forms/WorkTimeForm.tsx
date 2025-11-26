import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QuickTags } from "@/components/form-elements/QuickTags";
import { WorkTimeFields } from "@/app/types/DailyLog";

export default function WorkTimeForm({
  value,
  onChange,
}: {
  value: WorkTimeFields;
  onChange: (data: WorkTimeFields) => void;
}) {
  const update = (field: Partial<WorkTimeFields>) =>
    onChange?.({ ...value, ...field });

  function insertTag(tag: string) {
    update({
      description: value.description.includes(tag)
        ? value.description
        : value.description.trim().length
          ? `${value.description}, ${tag}`
          : tag,
    });
  }

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
                  value={value.startTime}
                  onChange={(e) => update({ startTime: e.target.value })}
                  className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
              <div className="flex w-1/2 flex-col gap-1">
                <Label htmlFor="time-to">Work End Time</Label>
                <Input
                  type="time"
                  id="time-to"
                  step="60"
                  value={value.endTime}
                  onChange={(e) => update({ endTime: e.target.value })}
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
                value={value.description}
                onChange={(e) => update({ description: e.target.value })}
              ></textarea>
            </div>
            <div className="flex gap-1 w-full justify-end flex-col">
              <QuickTags onTagClick={insertTag} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
