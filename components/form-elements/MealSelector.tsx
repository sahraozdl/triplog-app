"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CroissantIcon, HamburgerIcon, PizzaIcon } from "lucide-react";
//radio group items are not aligned properly
//radio selector wont reset with a second click after selection
const meals = [
  {
    value: "breakfast",
    label: "Breakfast",
    icon: <CroissantIcon className="h-10 w-10" />,
  },
  {
    value: "lunch",
    label: "Lunch",
    icon: <HamburgerIcon className="h-10 w-10" />,
  },
  {
    value: "dinner",
    label: "Dinner",
    icon: <PizzaIcon className="h-10 w-10" />,
  },
];

export function MealSelector() {
  return (
    <div className="flex flex-col gap-10 w-full">

      {meals.map((meal) => (
        <div
          key={meal.value}
          className="w-full flex flex-col gap-1"
        >
          <Label className="text-base font-medium">{meal.label} covered by:</Label>

              <RadioGroup
                className="flex flex-row gap-12"
              >
                <div className="flex items-center gap-2 w-1/2 bg-input-back/60 p-2 rounded-lg border border-input-border">
                  <RadioGroupItem
                    id={`${meal.value}-company`}
                    value="company"
                  />
                  <Label htmlFor={`${meal.value}-company`}>Company</Label>
                </div>

                <div className="flex w-1/2 gap-2 items-center bg-input-back/60 p-2 rounded-lg border border-input-border">
                  <RadioGroupItem
                    id={`${meal.value}-employee`}
                    value="employee"
                  />
                  <Label htmlFor={`${meal.value}-employee`}>Employee</Label>
                </div>
              </RadioGroup>
            </div>
      ))}
    </div>
  );
}
