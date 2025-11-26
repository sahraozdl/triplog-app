import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { MealSelector } from "../form-elements/MealSelector";
import { AccommodationMealsFields } from "@/app/types/DailyLog";

export default function AccommodationMealsForm({
  value,
  onChange,
}: {
  value: AccommodationMealsFields;
  onChange: (updated: AccommodationMealsFields) => void;
}) {
  const update = (field: Partial<AccommodationMealsFields>) =>
    onChange?.({ ...value, ...field });

  const updateMeals = (field: Partial<AccommodationMealsFields["meals"]>) =>
    update({ meals: { ...value.meals, ...field } });

  return (
    <div className="px-4 md:px-12 py-4 w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="accommodation-meals">
          <AccordionTrigger>Accommodation & Meals</AccordionTrigger>

          <AccordionContent>
            <div className="flex flex-col w-full gap-8">
              {/* ---------- TOP TWO INPUTS ---------- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="accommodation-type">Accommodation Type</Label>
                  <Input
                    type="text"
                    id="accommodation-type"
                    placeholder="e.g. Hotel"
                    value={value.accommodationType}
                    onChange={(e) =>
                      update({ accommodationType: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="accommodationCoveredBy">Fee Covered By</Label>
                  <Input
                    type="text"
                    id="accommodationCoveredBy"
                    placeholder="e.g. Company"
                    value={value.accommodationCoveredBy}
                    onChange={(e) =>
                      update({ accommodationCoveredBy: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* ---------- RADIO GROUP ---------- */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="overnightStay">Overnight Stay</Label>

                <RadioGroup
                  id="overnightStay"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
                  value={value.overnightStay}
                  onValueChange={(v) =>
                    update({ overnightStay: v as "yes" | "no" })
                  }
                >
                  <div className="flex flex-row border border-input-border rounded-md px-3 h-12 gap-3 items-center bg-input-back">
                    <RadioGroupItem id="overnightYes" value="yes" />
                    <Label htmlFor="overnightYes">Yes</Label>
                  </div>

                  <div className="flex flex-row border border-input-border rounded-md px-3 h-12 gap-3 items-center bg-input-back">
                    <RadioGroupItem id="overnightNo" value="no" />
                    <Label htmlFor="overnightNo">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* ---------- MEALS SELECTOR ---------- */}
              <div className="flex flex-col">
                <MealSelector
                  meals={value.meals}
                  onChange={(updatedMeals) => updateMeals(updatedMeals)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
