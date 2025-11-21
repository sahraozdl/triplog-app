import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "../ui/label";
import { FileDropzone } from "../helpers/FileDropzone";

export default function AdditionalForm() {
  return (
    <div className="px-12 py-4 min-w-72">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Additional Information</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-12">
            <div className="flex flex-col gap-1">
              <Label htmlFor="additional-information">
                Notes & Attachments
              </Label>
              <textarea
                id="additional-information"
                className="w-full h-40 resize-none border border-input-border rounded-md p-2 bg-input-back focus:outline-none focus:ring-0 focus:border-input-border"
                placeholder="e.g. Additional information"
              />
            </div>
            <FileDropzone />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
