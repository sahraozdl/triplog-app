"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CroissantIcon, Utensils, PizzaIcon } from "lucide-react";
import { MealFields, MealCoveredBy } from "@/app/types/DailyLog";

type MealsMap = {
  breakfast: MealFields;
  lunch: MealFields;
  dinner: MealFields;
};
// I will move it later to a separate file
function MealCard({
  label,
  icon,
  data,
  onUpdate,
}: {
  label: string;
  icon: React.ReactNode;
  data: MealFields;
  onUpdate: (updates: Partial<MealFields>) => void;
}) {
  const handleRadioToggle = (newValue: MealCoveredBy) => {
    if (data.coveredBy === newValue) {
      onUpdate({ coveredBy: "" });
    } else {
      onUpdate({ coveredBy: newValue });
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 border rounded-xl p-4 transition-all duration-200 ${
        data.eaten
          ? "bg-background border-border shadow-sm"
          : "bg-muted/50 border-border opacity-80"
      }`}
    >
      {/* Header: Icon + Label + Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              data.eaten ? "bg-accent-foreground" : "bg-border border"
            }`}
          >
            {icon}
          </div>
          <Label className="text-base font-semibold cursor-pointer">
            {label}
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground cursor-pointer">
            {data.eaten ? "Eaten" : "Not Eaten"}
          </Label>
          <Switch
            checked={data.eaten}
            onCheckedChange={(checked) =>
              onUpdate({
                eaten: checked,
                coveredBy: checked ? data.coveredBy : "",
              })
            }
          />
        </div>
      </div>

      {/* Content: Radio Group */}
      {data.eaten && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3 block">
            Paid By / Covered Via
          </Label>

          <RadioGroup
            value={data.coveredBy}
            onValueChange={(val) => handleRadioToggle(val as MealCoveredBy)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {/* Option 1: Company */}
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.coveredBy === "company"
                  ? "bg-muted border-border"
                  : "bg-background hover:bg-border"
              }`}
            >
              <RadioGroupItem value="company" id={`${label}-company`} />
              <span className="text-sm font-medium">Company</span>
            </label>

            {/* Option 2: Employee */}
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.coveredBy === "employee"
                  ? "bg-muted border-border"
                  : "bg-background hover:bg-border"
              }`}
            >
              <RadioGroupItem value="employee" id={`${label}-employee`} />
              <span className="text-sm font-medium">Employee</span>
            </label>

            {/* Option 3: Partner */}
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.coveredBy === "partner"
                  ? "bg-muted border-border"
                  : "bg-background hover:bg-border"
              }`}
            >
              <RadioGroupItem value="partner" id={`${label}-partner`} />
              <span className="text-sm font-medium">Partner</span>
            </label>

            {/* Option 4: Included in Accommodation */}
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.coveredBy === "included in accommodation"
                  ? "bg-muted border-border"
                  : "bg-background hover:bg-border"
              }`}
            >
              <RadioGroupItem
                value="included in accommodation"
                id={`${label}-included`}
              />
              <span className="text-sm font-medium leading-tight">
                Included in accommodation
              </span>
            </label>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}

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
