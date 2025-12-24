"use client";

import { CroissantIcon, Utensils, PizzaIcon } from "lucide-react";
import { MealFields } from "@/app/types/DailyLog";
import { MealCard } from "./MealCard";

type MealsMap = {
  breakfast: MealFields;
  lunch: MealFields;
  dinner: MealFields;
};

export function MealSelector({
  meals,
  onChange,
}: {
  meals: MealsMap;
  onChange: (updatedMeals: MealsMap) => void;
}) {
  const handleUpdate = (key: keyof MealsMap, updates: Partial<MealFields>) => {
    onChange({
      ...meals,
      [key]: { ...meals[key], ...updates },
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* BREAKFAST */}
      <MealCard
        label="Breakfast"
        icon={<CroissantIcon className="h-6 w-6 text-orange-500" />}
        data={meals.breakfast}
        onUpdate={(updates) => handleUpdate("breakfast", updates)}
      />

      {/* LUNCH */}
      <MealCard
        label="Lunch"
        icon={<Utensils className="h-6 w-6 text-blue-500" />}
        data={meals.lunch}
        onUpdate={(updates) => handleUpdate("lunch", updates)}
      />

      {/* DINNER */}
      <MealCard
        label="Dinner"
        icon={<PizzaIcon className="h-6 w-6 text-red-500" />}
        data={meals.dinner}
        onUpdate={(updates) => handleUpdate("dinner", updates)}
      />
    </div>
  );
}
