import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { MealSelector } from "../helpers/MealSelector";

export default function AccommodationMealsForm() {
  return (
    <div className="px-12 py-4 min-w-72">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Accommodation & Meals</AccordionTrigger>
          <AccordionContent>
            <div className="w-full flex flex-col justify-between gap-12">
              <div className="w-full flex flex-row justify-between gap-12">
                <div className="w-1/2">
                  <Label htmlFor="accommodation-type">Accommodation Type</Label>
                  <Input
                    type="text"
                    id="accommodation-type"
                    placeholder="e.g. Hotel"
                  />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="accommodationCoveredBy">Fee Covered By</Label>
                  <Input
                    type="text"
                    id="accommodationCoveredBy"
                    placeholder="e.g. Company"
                  />
                </div>
              </div>
              <div className="w-full flex flex-col justify-between gap-1">
                  <Label htmlFor="overnightStay">Overnight Stay</Label>

                  <RadioGroup
                    id="overnightStay"
                    className="flex flex-row mt-2 w-full gap-12"
                  >
                    <div className="flex flex-row border border-input-border rounded-md px-2 h-12 space-x-2 w-1/2 bg-input-back justify-start gap-3 align-middle items-center">
                      <RadioGroupItem id="overnightYes" value="yes" />
                      <Label
                        htmlFor="overnightYes"
                      >
                        Yes
                      </Label>
                    </div>

                    <div className="flex flex-row border border-input-border rounded-md px-2 h-12 space-x-2 w-1/2 bg-input-back justify-start gap-3 align-middle items-center">
                      <RadioGroupItem id="overnightNo" value="no" />
                      <Label
                        htmlFor="overnightNo"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="w-full flex flex-col justify-between gap-1">
                  <MealSelector />
                </div>
          
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
