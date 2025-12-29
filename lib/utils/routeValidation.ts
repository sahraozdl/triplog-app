/**
 * Valid static routes in the application.
 * These are routes that have a corresponding page.tsx file without dynamic segments.
 *
 * Note: Routes with dynamic segments (like [tripId], [logId]) are not included
 * as their parent segments don't have standalone pages.
 */
export const VALID_STATIC_ROUTES = new Set([
  "/",
  "/dashboard",
  "/settings",
  "/reports",
  "/newTrip",
  "/login",
]);

/**
 * Checks if a route path exists as a valid static page.
 *
 * @param path - The route path to check (e.g., "/dashboard", "/newDailyLog")
 * @returns true if the route exists as a static page, false otherwise
 */
export function isValidRoute(path: string): boolean {
  // Normalize the path
  const normalizedPath =
    path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;

  return VALID_STATIC_ROUTES.has(normalizedPath);
}

/**
 * Checks if a route segment represents a dynamic route parameter.
 * Dynamic segments in Next.js are wrapped in brackets like [tripId], [logId], etc.
 * In actual URLs, these become actual ID values (UUIDs, MongoDB ObjectIds, etc.)
 *
 * @param segment - The URL segment to check
 * @returns true if the segment looks like a dynamic parameter value
 */
export function isDynamicSegment(segment: string): boolean {
  // Check if segment matches patterns like [tripId], [logId], etc. (file system format)
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return true;
  }

  // Check for UUID format (e.g., "550e8400-e29b-41d4-a716-446655440000")
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment,
    )
  ) {
    return true;
  }

  // Check for MongoDB ObjectId format (24 hex characters)
  if (/^[0-9a-f]{24}$/i.test(segment)) {
    return true;
  }

  // Check for long alphanumeric IDs (20+ characters) that are likely dynamic parameters
  // This catches other ID formats while avoiding false positives for normal route names
  if (/^[a-zA-Z0-9_-]{20,}$/.test(segment)) {
    return true;
  }

  return false;
}
