/**
 * Creates a handler function for toggling shared field state
 */
export function createSharedFieldToggleHandler(
  fieldType: string,
  setSharedFields: React.Dispatch<React.SetStateAction<Set<string>>>,
) {
  return (enabled: boolean) => {
    setSharedFields((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(fieldType);
      } else {
        next.delete(fieldType);
      }
      return next;
    });
  };
}
