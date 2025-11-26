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
    onChange({ ...value, ...field });

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
    <div className="px-4 md:px-12 py-4 w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="work-time">
          <AccordionTrigger>Work Time</AccordionTrigger>

          <AccordionContent>
            <div className="flex flex-col gap-10 w-full">
              {/* START + END TIME (responsive grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 w-full">
                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="time-from">Work Start Time</Label>
                  <Input
                    type="time"
                    id="time-from"
                    step="60"
                    value={value.startTime}
                    onChange={(e) => update({ startTime: e.target.value })}
                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="time-to">Work End Time</Label>
                  <Input
                    type="time"
                    id="time-to"
                    step="60"
                    value={value.endTime}
                    onChange={(e) => update({ endTime: e.target.value })}
                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="work-description">Work Description</Label>
                <textarea
                  id="work-description"
                  aria-label="Work Description"
                  placeholder="e.g. Worked on project X, Y, Z"
                  className="h-40 w-full resize-none border border-input-border rounded-md p-2 bg-input-back focus:outline-none"
                  value={value.description}
                  onChange={(e) => update({ description: e.target.value })}
                ></textarea>
              </div>

              {/* QUICK TAGS */}
              <div className="flex flex-col gap-1 w-full">
                <QuickTags onTagClick={insertTag} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
