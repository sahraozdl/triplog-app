"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MealSelector } from "@/components/form-elements/MealSelector";
import LocationInput from "@/components/form-elements/LocationInput";
import { AccommodationLog } from "@/app/types/DailyLog";

type AccommodationFormState = Omit<
  AccommodationLog,
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
  value: AccommodationFormState;
  onChange: (updated: AccommodationFormState) => void;
}

export default function AccommodationMealsForm({ value, onChange }: Props) {
  const update = (field: Partial<AccommodationFormState>) =>
    onChange({ ...value, ...field });

  const updateMeals = (mealsUpdate: Partial<AccommodationFormState["meals"]>) =>
    update({ meals: { ...value.meals, ...mealsUpdate } });

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Accordion
        type="single"
        collapsible
        defaultValue="accommodation-meals"
        className="w-full"
      >
        <AccordionItem value="accommodation-meals">
          <AccordionTrigger className="hover:no-underline py-4">
            <span className="text-lg font-semibold">Accommodation & Meals</span>
          </AccordionTrigger>

          <AccordionContent className="pt-4 pb-6">
            <div className="flex flex-col w-full gap-8">
              {/* TOP TWO INPUTS  */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="accommodation-type">
                    Accommodation / Hotel Name
                  </Label>
                  <LocationInput
                    id="accommodation-type"
                    placeholder="Search hotel name or address..."
                    value={value.accommodationType}
                    onChange={(val) => update({ accommodationType: val })}
                  />
                </div>

                <div className="flex flex-col gap-2">
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

              <div className="flex flex-col gap-3">
                <Label className="text-base font-medium">Overnight Stay?</Label>

                <RadioGroup
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
                  value={value.overnightStay}
                  onValueChange={(v) =>
                    update({ overnightStay: v as "yes" | "no" | "" })
                  }
                >
                  <div className="flex items-center space-x-3 border p-3 rounded-md hover:bg-background transition-colors cursor-pointer">
                    <RadioGroupItem value="yes" id="overnight-yes" />
                    <Label
                      htmlFor="overnight-yes"
                      className="flex-1 cursor-pointer"
                    >
                      Yes
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border p-3 rounded-md hover:bg-background transition-colors cursor-pointer">
                    <RadioGroupItem value="no" id="overnight-no" />
                    <Label
                      htmlFor="overnight-no"
                      className="flex-1 cursor-pointer"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="border-t my-2"></div>

              <div className="flex flex-col gap-4">
                <h3 className="font-medium text-lg">Meals</h3>
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
