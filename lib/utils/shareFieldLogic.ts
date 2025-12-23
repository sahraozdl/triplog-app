/**
 * Shared logic for field-level sharing behavior
 */

/**
 * Determines if a field should be shared by default based on selected colleagues
 * @param appliedTo - Array of selected colleague user IDs
 * @returns true if there are selected colleagues, false otherwise
 */
export function shouldShareByDefault(appliedTo: string[]): boolean {
  return appliedTo.length > 0;
}

/**
 * Gets the initial shared fields set based on selected colleagues
 * @param appliedTo - Array of selected colleague user IDs
 * @param allFieldTypes - Array of all field types to consider
 * @returns Set of field types that should be shared
 */
export function getInitialSharedFields(
  appliedTo: string[],
  allFieldTypes: string[] = ["travel", "worktime", "accommodation", "additional"],
): Set<string> {
  if (appliedTo.length === 0) {
    return new Set();
  }
  return new Set(allFieldTypes);
}

/**
 * Updates shared fields when appliedTo changes
 * @param currentSharedFields - Current set of shared field types
 * @param appliedTo - Array of selected colleague user IDs
 * @param allFieldTypes - Array of all field types to consider
 * @returns Updated set of shared field types
 */
export function updateSharedFieldsOnAppliedToChange(
  currentSharedFields: Set<string>,
  appliedTo: string[],
  allFieldTypes: string[] = ["travel", "worktime", "accommodation", "additional"],
): Set<string> {
  if (appliedTo.length === 0) {
    // If no colleagues selected, unshare all fields
    return new Set();
  }

  // If colleagues are selected, ensure all fields are shared
  // (user can still manually unshare individual fields)
  const newSet = new Set(currentSharedFields);
  allFieldTypes.forEach((type) => {
    newSet.add(type);
  });
  return newSet;
}

