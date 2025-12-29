"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { isValidRoute, isDynamicSegment } from "@/lib/utils/routeValidation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname) return null;

  const allSegments = pathname.split("/").filter(Boolean);

  // Filter out dynamic segments (IDs) from display, but keep track of original indices
  const segmentsWithIndices = allSegments
    .map((segment, originalIndex) => ({ segment, originalIndex }))
    .filter(({ segment }) => !isDynamicSegment(segment));

  // Extract just the segment values for easier processing
  const segments = segmentsWithIndices.map(({ segment }) => segment);

  // If no segments remain after filtering, just show Home
  if (segments.length === 0) {
    return (
      <Breadcrumb className="px-4 py-3 md:px-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const crumbs = segments.map((segment, i) => {
    // Reconstruct the full path up to this point, including any dynamic segments
    // that were filtered out, to properly check if the route exists
    const segmentIndex = segmentsWithIndices[i].originalIndex;
    const fullPathUpToThisPoint =
      "/" + allSegments.slice(0, segmentIndex + 1).join("/");

    // Check if this route exists as a valid static page
    const routeExists = isValidRoute(fullPathUpToThisPoint);

    const isLast = i === segments.length - 1;

    // Format the segment for display
    const formatted = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // If it's the last item, always render as non-clickable
    if (isLast) {
      return (
        <BreadcrumbItem key={fullPathUpToThisPoint}>
          <BreadcrumbPage>{formatted}</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    // If the route doesn't exist, render as non-clickable
    if (!routeExists) {
      return (
        <BreadcrumbItem key={fullPathUpToThisPoint}>
          <BreadcrumbPage>{formatted}</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    // Route exists, render as clickable link
    return (
      <BreadcrumbItem key={fullPathUpToThisPoint}>
        <BreadcrumbLink href={fullPathUpToThisPoint}>
          {formatted}
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
  });

  return (
    <Breadcrumb className="px-4 py-3 md:px-8">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>

        {segments.length > 0 && <BreadcrumbSeparator />}

        {crumbs.map((c, i) => (
          <div key={i} className="flex items-center">
            {c}
            {i !== crumbs.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
