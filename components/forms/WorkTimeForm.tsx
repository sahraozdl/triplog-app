"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QuickTags } from "@/components/form-elements/QuickTags";
import { WorkTimeLog } from "@/app/types/DailyLog";

type WorkTimeFormState = Omit<
  WorkTimeLog,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "files"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
  | "itemType"
>;

interface Props {
  value: WorkTimeFormState;
  onChange: (val: WorkTimeFormState) => void;
}

export default function WorkTimeForm({ value, onChange }: Props) {
  const update = (field: Partial<WorkTimeFormState>) =>
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
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Accordion
        type="single"
        collapsible
        defaultValue="work-time"
        className="w-full"
      >
        <AccordionItem value="work-time">
          <AccordionTrigger className="hover:no-underline py-4">
            <span className="text-lg font-semibold">Work Time</span>
          </AccordionTrigger>

          <AccordionContent className="pt-4 pb-6">
            <div className="flex flex-col gap-6 w-full">
              {/* START + END TIME */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="time-from">Work Start Time</Label>
                  <Input
                    type="time"
                    id="time-from"
                    value={value.startTime}
                    onChange={(e) => update({ startTime: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="time-to">Work End Time</Label>
                  <Input
                    type="time"
                    id="time-to"
                    value={value.endTime}
                    onChange={(e) => update({ endTime: e.target.value })}
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="work-description">Work Description</Label>
                <textarea
                  id="work-description"
                  aria-label="Work Description"
                  placeholder="e.g. Worked on project X, Y, Z"
                  className="h-40 w-full resize-none border rounded-md p-3 bg-background focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
                  value={value.description}
                  onChange={(e) => update({ description: e.target.value })}
                ></textarea>
              </div>

              {/* QUICK TAGS */}
              <div className="flex flex-col gap-2 w-full">
                <QuickTags onTagClick={insertTag} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
