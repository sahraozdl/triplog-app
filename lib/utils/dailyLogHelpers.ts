import {
  DailyLogFormState,
  WorkTimeLog,
  AccommodationLog,
  MealFields,
} from "@/app/types/DailyLog";

export function effectiveLogForUser(
  date: string,
  userId: string,
  logs: DailyLogFormState[],
): WorkTimeLog | null {
  const dateLogs = logs.filter((log) => {
    if (log.itemType !== "worktime") return false;
    const logDate = log.dateTime ? log.dateTime.split("T")[0] : "";
    return logDate === date;
  }) as WorkTimeLog[];

  const userSpecificLog = dateLogs.find((log) => log.userId === userId);
  return userSpecificLog || null;
}

export function hasNonEmptyOverride(override: {
  description?: string;
  startTime?: string;
  endTime?: string;
}): boolean {
  if (!override) return false;
  return !!(
    (override.description && override.description.trim()) ||
    (override.startTime && override.startTime.trim()) ||
    (override.endTime && override.endTime.trim())
  );
}

export function formatMeal(mealName: string, meal: MealFields): string {
  if (!meal || !meal.eaten) {
    return `${mealName}: not eaten`;
  }
  const coveredBy = meal.coveredBy || "";
  if (coveredBy) {
    const formatted = coveredBy
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return `${mealName}: eaten (covered by ${formatted})`;
  }
  return `${mealName}: eaten`;
}

export function formatMeals(accommodation: AccommodationLog): string {
  if (!accommodation.meals) return "";

  const meals: string[] = [];
  if (accommodation.meals.breakfast) {
    meals.push(formatMeal("Breakfast", accommodation.meals.breakfast));
  }
  if (accommodation.meals.lunch) {
    meals.push(formatMeal("Lunch", accommodation.meals.lunch));
  }
  if (accommodation.meals.dinner) {
    meals.push(formatMeal("Dinner", accommodation.meals.dinner));
  }

  return meals.join("\n");
}
