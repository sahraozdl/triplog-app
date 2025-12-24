"use client";

import { ReactNode, useId } from "react";

interface TripInfoFieldProps {
  label: string;
  value: string | ReactNode;
  icon?: ReactNode;
  title?: string;
  className?: string;
}

export function TripInfoField({
  label,
  value,
  icon,
  title,
  className = "",
}: TripInfoFieldProps) {
  const fieldId = useId();

  return (
    <div
      className={`flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm ${className}`}
    >
      {icon && (
        <span className="shrink-0 mt-0.5" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <label htmlFor={fieldId} className="text-muted-foreground block mb-0.5">
          {label}
        </label>
        <div
          id={fieldId}
          className="font-medium wrap-break-word sm:truncate"
          title={typeof value === "string" ? value : title}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
