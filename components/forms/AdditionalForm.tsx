"use client";

import { useRef, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileDropzone from "@/components/form-elements/FileDropzone";
import { UploadedFile } from "@/app/types/DailyLog";
import { AdditionalFormState } from "@/app/types/FormStates";

interface Props {
  value: AdditionalFormState;
  onChange: (data: AdditionalFormState) => void;
}

export default function AdditionalForm({ value, onChange }: Props) {
  const valueRef = useRef<AdditionalFormState>(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const update = (field: Partial<AdditionalFormState>) =>
    onChange({ ...value, ...field });

  const updateUploadedFiles = (files: UploadedFile[]) => {
    const currentValue = valueRef.current;
    onChange({ ...currentValue, uploadedFiles: files });
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Accordion
        type="single"
        collapsible
        defaultValue="additional-info"
        className="w-full"
      >
        <AccordionItem value="additional-info">
          <AccordionTrigger className="hover:no-underline py-4">
            <span className="text-lg font-semibold">
              Additional Information
            </span>
          </AccordionTrigger>

          <AccordionContent className="pt-4 pb-6">
            <div className="flex flex-col gap-8 w-full">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="additional-information">
                  Notes & Attachments
                </Label>

                <Textarea
                  id="additional-information"
                  className="w-full h-40 resize-none border rounded-md p-3 bg-background focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
                  placeholder="e.g. Additional information or context regarding the trip..."
                  value={value.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                />
              </div>

              <div className="w-full space-y-2">
                <Label>Attachments</Label>
                <FileDropzone
                  value={value.uploadedFiles}
                  onChange={updateUploadedFiles}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
