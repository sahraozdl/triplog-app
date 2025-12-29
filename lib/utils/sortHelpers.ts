export function sortByLatestOrder<T>(
  items: T[],
  getDate: (item: T) => string,
): T[] {
  return [...items].sort((a, b) => {
    const dateA = getDate(a);
    const dateB = getDate(b);

    // Handle invalid dates
    const timeA = new Date(dateA).getTime();
    const timeB = new Date(dateB).getTime();

    // If either date is invalid, put invalid dates at the end
    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;

    // Sort in descending order (newest first)
    return timeB - timeA;
  });
}
