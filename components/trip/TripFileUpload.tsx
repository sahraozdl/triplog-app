"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TripFileUploadProps {
  tripId: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

export function TripFileUpload({
  tripId,
  onUploadSuccess,
  onUploadError,
  disabled = false,
}: TripFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

    const hasValidMime = validImageTypes.some((type) =>
      file.type.toLowerCase().startsWith(type),
    );
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );

    if (!hasValidMime && !hasValidExtension) {
      return "Invalid file type. Only images are allowed.";
    }

    return null;
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const validationError = validateFile(file);
        if (validationError) {
          if (onUploadError) {
            onUploadError(validationError);
          } else {
            alert(validationError);
          }
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/trips/${tripId}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Upload failed");
        }
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      if (onUploadError) {
        onUploadError(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled || uploading) return;
    handleUpload(e.target.files);
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30",
          (disabled || uploading) && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div
            className={cn(
              "p-3 rounded-full",
              dragActive ? "bg-primary/10" : "bg-muted",
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {uploading ? "Uploading..." : "Upload images to this trip"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag and drop images here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: JPG, PNG, GIF, WEBP, SVG
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id={`trip-upload-${tripId}`}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Select Images"}
          </Button>
        </div>
      </div>
    </div>
  );
}
