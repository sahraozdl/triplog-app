"use client";

import { TripAdditionalFile } from "@/app/types/Trip";
import { FileIcon, X, Image as ImageIcon, Loader2 } from "lucide-react";
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
    <div className="space-y-2">
      {files.map((file, index) => {
        const isImage =
          file.type?.startsWith("image/") ||
          file.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);

        return (
          <div
            key={`${file.url}-${index}`}
            className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
              <div className="bg-primary/10 p-2 rounded shrink-0">
                {isImage ? (
                  <ImageIcon className="h-4 w-4 text-primary" />
                ) : (
                  <FileIcon className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground truncate hover:underline hover:text-primary transition-colors"
                >
                  {file.name}
                </a>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  {file.uploadedAt && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => handleDelete(index)}
                disabled={deletingIndex === index}
                title="Delete file"
              >
                {deletingIndex === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
