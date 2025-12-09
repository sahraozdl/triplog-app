"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
          <AccordionTrigger className="hover:no-underline py-4 text-foreground">
            <span className="text-lg font-semibold">Accommodation & Meals</span>
          </AccordionTrigger>

          <AccordionContent className="pt-4 pb-6">
            <div className="flex flex-col w-full gap-8">
              {/* --- ACCOMMODATION TYPE & PAYMENT --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-end">
                {/* 1. Accommodation Type (Location Input) */}
                <div className="flex flex-col gap-2 w-full">
                  <Label
                    htmlFor="accommodation-type"
                    className="text-foreground"
                  >
                    Accommodation / Hotel Name
                  </Label>
                  <LocationInput
                    id="accommodation-type"
                    placeholder="Search hotel name or address..."
                    value={value.accommodationType}
                    onChange={(val) => update({ accommodationType: val })}
                    className="bg-background text-foreground border-input"
                  />
                </div>

                {/* 2. Fee Covered By (RADIO GROUP) */}
                <div className="flex flex-col gap-2 w-full">
                  <Label className="text-foreground">Fee Covered By</Label>
                  <RadioGroup
                    value={value.accommodationCoveredBy}
                    onValueChange={(val) =>
                      update({ accommodationCoveredBy: val })
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    {/* Option: Company */}
                    <Label
                      htmlFor="covered-company"
                      className={`
                          flex items-center justify-start gap-3 p-3 border rounded-lg cursor-pointer transition-all
                        ${
                          value.accommodationCoveredBy === "company"
                            ? "bg-primary/10 border-input text-primary shadow-sm"
                            : "bg-background hover:bg-muted/50 border-border text-muted-foreground"
                        }
                      `}
                    >
                      <RadioGroupItem
                        value="company"
                        id="covered-company"
                        className="text-primary border-primary"
                      />
                      <span className="text-xs font-medium">Company</span>
                    </Label>

                    {/* Option: Private */}
                    <Label
                      htmlFor="covered-private"
                      className={`
                        flex items-center justify-start gap-3 p-3 border rounded-lg cursor-pointer transition-all
                        ${
                          value.accommodationCoveredBy === "private"
                            ? "bg-primary/10 border-input text-primary shadow-sm"
                            : "bg-background hover:bg-muted/50 border-border text-muted-foreground"
                        }
                      `}
                    >
                      <RadioGroupItem
                        value="private"
                        id="covered-private"
                        className="text-primary border-primary"
                      />
                      <span className="text-sm font-medium">Private</span>
                    </Label>
                  </RadioGroup>
                </div>
              </div>

              {/* --- OVERNIGHT STAY RADIO --- */}
              <div className="flex flex-col gap-3">
                <Label className="text-base font-medium text-foreground">
                  Overnight Stay?
                </Label>

                <RadioGroup
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
                  value={value.overnightStay}
                  onValueChange={(v) =>
                    update({ overnightStay: v as "yes" | "no" | "" })
                  }
                >
                  <Label
                    htmlFor="overnight-yes"
                    className={`
                      flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
                      ${
                        value.overnightStay === "yes"
                          ? "bg-primary/5 border-input shadow-sm"
                          : "bg-background hover:bg-muted/50 border-border"
                      }
                    `}
                  >
                    <RadioGroupItem
                      value="yes"
                      id="overnight-yes"
                      className="text-primary border-primary"
                    />
                    <span className="text-sm font-medium text-foreground flex-1">
                      Yes
                    </span>
                  </Label>

                  <Label
                    htmlFor="overnight-no"
                    className={`
                      flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
                      ${
                        value.overnightStay === "no"
                          ? "bg-primary/5 border-input shadow-sm"
                          : "bg-background hover:bg-muted/50 border-border"
                      }
                    `}
                  >
                    <RadioGroupItem
                      value="no"
                      id="overnight-no"
                      className="text-primary border-primary"
                    />
                    <span className="text-sm font-medium text-foreground flex-1">
                      No
                    </span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="border-t border-border my-2"></div>

              {/* --- MEALS SELECTOR --- */}
              <div className="flex flex-col gap-4">
                <h3 className="font-medium text-lg text-foreground">Meals</h3>
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
