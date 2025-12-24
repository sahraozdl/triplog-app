export function shouldShareByDefault(appliedTo: string[]): boolean {
  return appliedTo.length > 0;
}
export function getInitialSharedFields(
  appliedTo: string[],
  allFieldTypes: string[] = [
    "travel",
    "worktime",
    "accommodation",
    "additional",
  ],
): Set<string> {
  if (appliedTo.length === 0) {
    return new Set();
  }
  return new Set(allFieldTypes);
}

export function updateSharedFieldsOnAppliedToChange(
  currentSharedFields: Set<string>,
  appliedTo: string[],
  allFieldTypes: string[] = [
    "travel",
    "worktime",
    "accommodation",
    "additional",
  ],
): Set<string> {
  if (appliedTo.length === 0) {
    return new Set();
  }

  const newSet = new Set(currentSharedFields);
  allFieldTypes.forEach((type) => {
    newSet.add(type);
  });
  return newSet;
}
