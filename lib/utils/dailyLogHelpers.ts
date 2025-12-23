import {
  DailyLogFormState,
  WorkTimeLog,
  AccommodationLog,
  MealFields,
} from "@/app/types/DailyLog";

/**
 * Computes the effective worktime log for a given user and date.
 * Returns the user-specific log (log.userId === userId) since each colleague
 * now has their own real database log.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param userId - User ID to get effective log for
 * @param logs - Array of all worktime logs for the date
 * @returns The effective log for the user, or null if none exists
 */
export function effectiveLogForUser(
  date: string,
  userId: string,
  logs: DailyLogFormState[],
): WorkTimeLog | null {
  // Filter logs for the specific date
  const dateLogs = logs.filter((log) => {
    if (log.itemType !== "worktime") return false;
    const logDate = log.dateTime ? log.dateTime.split("T")[0] : "";
    return logDate === date;
  }) as WorkTimeLog[];

  // Return user-specific log (each colleague has their own real database log)
  const userSpecificLog = dateLogs.find((log) => log.userId === userId);
  return userSpecificLog || null;
}

/**
 * Checks if a worktime override has any non-empty fields
 */
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

/**
 * Formats meal information as a string
 * Format: "Breakfast: eaten (covered by Employer)" or "Breakfast: not eaten"
 */
export function formatMeal(mealName: string, meal: MealFields): string {
  if (!meal || !meal.eaten) {
    return `${mealName}: not eaten`;
  }
  const coveredBy = meal.coveredBy || "";
  if (coveredBy) {
    // Capitalize first letter of each word
    const formatted = coveredBy
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return `${mealName}: eaten (covered by ${formatted})`;
  }
  return `${mealName}: eaten`;
}

/**
 * Formats all meals for an accommodation log
 */
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
