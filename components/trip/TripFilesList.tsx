"use client";

import { TripAdditionalFile } from "@/app/types/Trip";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TripFilesListProps {
  files: TripAdditionalFile[];
  tripId: string;
  onDelete?: () => void;
  canDelete?: boolean;
}

export function TripFilesList({
  files,
  tripId,
  onDelete,
  canDelete = false,
}: TripFilesListProps) {
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No files uploaded yet.
      </div>
    );
  }

  const handleDelete = async (index: number) => {
    if (!canDelete) return;

    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setDeletingIndex(index);
    try {
      const response = await fetch(`/api/trips/${tripId}/upload/${index}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete file");
      }

      const data = await response.json();
      if (data.success) {
        if (onDelete) {
          onDelete();
        }
      } else {
        throw new Error(data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert(error instanceof Error ? error.message : "Failed to delete file");
    } finally {
      setDeletingIndex(null);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {files.map((file, index) => {
        return (
          <div
            key={`${file.url}-${index}`}
            className="flex flex-row gap-2 sm:gap-3 p-2 sm:p-3 bg-card border rounded-lg shadow-sm group hover:shadow-md transition-shadow justify-between w-full"
          >
            {/* Bottom Row: File Details */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm  font-medium text-foreground wrap-break-word hover:underline hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
                aria-label={`Open file: ${file.name}`}
              >
                {file.name}
              </a>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>{(file.size / 1024).toFixed(1)} KB</span>
                {file.uploadedAt && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            {/* Top Row: and Delete Button */}
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => handleDelete(index)}
                disabled={deletingIndex === index}
                aria-label={`Delete file: ${file.name}`}
                title="Delete file"
              >
                {deletingIndex === index ? (
                  <Loader2
                    className="h-4 w-4 sm:h-5 sm:w-5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <X className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
