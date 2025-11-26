import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "../ui/label";
import FileDropzone from "../form-elements/FileDropzone";
import { AdditionalFields, UploadedFile } from "@/app/types/DailyLog";
import { Textarea } from "../ui/textarea";

export default function AdditionalForm({
  value,
  onChange,
}: {
  value: AdditionalFields;
  onChange: (data: AdditionalFields) => void;
}) {
  const update = (field: Partial<AdditionalFields>) =>
    onChange({ ...value, ...field });

  const updateUploadedFiles = (files: UploadedFile[]) =>
    update({ uploadedFiles: files });

  return (
    <div className="px-4 md:px-12 py-4 w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="additional-info">
          <AccordionTrigger>Additional Information</AccordionTrigger>

          <AccordionContent className="flex flex-col gap-8 w-full">
            {/* NOTES */}
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="additional-information">
                Notes & Attachments
              </Label>

              <Textarea
                id="additional-information"
                className="w-full h-40 resize-none border border-input-border rounded-md p-3 bg-input-back focus:outline-none"
                placeholder="e.g. Additional information or context"
                value={value.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </div>

            {/* FILE UPLOAD */}
            <div className="w-full">
              <FileDropzone
                value={value.uploadedFiles}
                onChange={updateUploadedFiles}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
