/**
 * Date conversion utilities for trip dates
 * Converts between ISO datetime strings (from DB) and YYYY-MM-DD date strings (for inputs)
 * Uses noon UTC to avoid timezone rollovers
 */

/**
 * Converts an ISO datetime string to a YYYY-MM-DD date string
 * @param isoString - ISO datetime string from database (e.g., "2025-11-29T13:00:00.000Z")
 * @returns YYYY-MM-DD date string (e.g., "2025-11-29") or empty string if invalid
 */
export function isoToDateString(isoString: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Converts a YYYY-MM-DD date string to an ISO datetime string using noon UTC
 * This avoids timezone rollovers by using a consistent time (12:00 UTC)
 * @param dateString - YYYY-MM-DD date string (e.g., "2025-11-29")
 * @returns ISO datetime string (e.g., "2025-11-29T12:00:00.000Z") or empty string if invalid
 */
export function dateStringToISO(dateString: string): string {
  if (!dateString) return "";
  try {
    // Parse YYYY-MM-DD
    const parts = dateString.split("-");
    if (parts.length !== 3) return "";

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return "";

    // Create date at noon UTC to avoid timezone rollovers
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    // Validate the date (catches invalid dates like Feb 30)
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return "";
    }

    return date.toISOString();
  } catch {
    return "";
  }
}

/**
 * Validates that startDate <= endDate (string comparison of YYYY-MM-DD)
 * @param startDate - YYYY-MM-DD date string
 * @param endDate - YYYY-MM-DD date string (optional)
 * @returns true if valid (startDate <= endDate or endDate is empty)
 */
export function validateDateRange(
  startDate: string,
  endDate: string | undefined,
): boolean {
  if (!startDate) return false;
  if (!endDate) return true; // End date is optional
  return startDate <= endDate;
}
