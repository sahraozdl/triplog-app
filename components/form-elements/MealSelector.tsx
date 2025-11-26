"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CroissantIcon, HamburgerIcon, PizzaIcon } from "lucide-react";
import { MealsFields } from "@/app/types/DailyLog";
import { Switch } from "../ui/switch";

const mealItems = [
  {
    key: "breakfast",
    label: "Breakfast",
    icon: <CroissantIcon className="h-7 w-7" />,
  },
  { key: "lunch", label: "Lunch", icon: <HamburgerIcon className="h-7 w-7" /> },
  { key: "dinner", label: "Dinner", icon: <PizzaIcon className="h-7 w-7" /> },
];

export function MealSelector({
  meals,
  onChange,
}: {
  meals: MealsFields;
  onChange: (updatedMeals: MealsFields) => void;
}) {
  const updateMeal = (
    mealKey: string,
    updates: Partial<{ eaten: boolean; coveredBy: string }>,
  ) => {
    onChange({
      ...meals,
      [mealKey]: {
        ...meals[mealKey as keyof MealsFields],
        ...updates,
      },
    });
  };
  // not sure if this is needed but i'll leave it here for now
  const handleRadioToggle = (
    mealKey: string,
    currentValue: string,
    newValue: string,
  ) => {
    if (currentValue === newValue) {
      updateMeal(mealKey, { coveredBy: "" });
    } else {
      updateMeal(mealKey, { coveredBy: newValue });
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {mealItems.map((meal) => {
        const current = meals[meal.key as keyof MealsFields];

        return (
          <div
            key={meal.key}
            className="flex flex-col gap-4 border rounded-lg p-4 bg-input-back/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {meal.icon}
                <Label className="text-base">{meal.label}</Label>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor={`${meal.key}-eaten`} className="text-sm">
                  Eaten?
                </Label>
                <Switch
                  id={`${meal.key}-eaten`}
                  checked={current.eaten}
                  onCheckedChange={(checked: boolean) =>
                    updateMeal(meal.key, {
                      eaten: checked,
                      coveredBy: checked ? current.coveredBy : "",
                    })
                  }
                />
              </div>
            </div>

            {current.eaten && (
              <RadioGroup
                value={current.coveredBy}
                onValueChange={(value) =>
                  handleRadioToggle(meal.key, current.coveredBy, value)
                }
                className="
                  grid grid-cols-1 
                  sm:grid-cols-2 
                  gap-3 mt-2
                "
              >
                <div className="flex items-center gap-2 p-3 rounded-md border bg-input-back">
                  <RadioGroupItem id={`${meal.key}-company`} value="company" />
                  <Label htmlFor={`${meal.key}-company`}>Company</Label>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-md border bg-input-back">
                  <RadioGroupItem
                    id={`${meal.key}-employee`}
                    value="employee"
                  />
                  <Label htmlFor={`${meal.key}-employee`}>Employee</Label>
                </div>
              </RadioGroup>
            )}
          </div>
        );
      })}
    </div>
  );
}
