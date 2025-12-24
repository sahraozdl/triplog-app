export function isoToDateString(isoString: string | undefined): string {
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

export function dateStringToISO(dateString: string): string {
  if (!dateString) return "";
  try {
    const parts = dateString.split("-");
    if (parts.length !== 3) return "";

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return "";

    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

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

export function validateDateRange(
  startDate: string,
  endDate: string | undefined,
): boolean {
  if (!startDate) return false;
  if (!endDate) return true;
  return startDate <= endDate;
}
