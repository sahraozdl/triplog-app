"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CroissantIcon, HamburgerIcon, PizzaIcon } from "lucide-react";
import { MealsFields } from "@/app/types/DailyLog";
import { Switch } from "../ui/switch";
//radio group items are not aligned properly
//radio selector wont reset with a second click after selection
const mealItems = [
  {
    key: "breakfast",
    label: "Breakfast",
    icon: <CroissantIcon className="h-8 w-8" />,
  },
  { key: "lunch", label: "Lunch", icon: <HamburgerIcon className="h-8 w-8" /> },
  { key: "dinner", label: "Dinner", icon: <PizzaIcon className="h-8 w-8" /> },
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
  return (
    <div className="flex flex-col gap-8 w-full">
      {mealItems.map((meal) => {
        const current = meals[meal.key as keyof MealsFields];

        return (
          <div
            key={meal.key}
            className="flex flex-col gap-3 border rounded-lg p-4 bg-input-back/40"
          >
            {/* Meal row */}
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

            {/* Covered By — only if eaten */}
            {current.eaten && (
              <RadioGroup
                value={current.coveredBy}
                onValueChange={(value) =>
                  updateMeal(meal.key, { coveredBy: value })
                }
                className="flex gap-6 mt-3"
              >
                <div className="flex items-center gap-2 w-1/2 bg-input-back p-2 rounded-md border border-input-border">
                  <RadioGroupItem id={`${meal.key}-company`} value="company" />
                  <Label htmlFor={`${meal.key}-company`}>Company</Label>
                </div>

                <div className="flex items-center gap-2 w-1/2 bg-input-back p-2 rounded-md border border-input-border">
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
