"use client";

import { useState, DragEvent, ChangeEvent, useRef, useEffect } from "react";
import { Loader2, UploadCloud, FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadedFile } from "@/app/types/DailyLog";
import { Button } from "@/components/ui/button";

export default function FileDropzone({
  value = [],
  onChange,
}: {
  value: UploadedFile[];
  onChange: (uploadedFiles: UploadedFile[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Use ref to always have the latest value for async operations
  const valueRef = useRef<UploadedFile[]>(value);

  // Update ref whenever value prop changes
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

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

    setIsUploading(true);
    const newUploads: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        const validationError = validateFile(file);
        if (validationError) {
          alert(validationError);
          continue;
        }

        const response = await fetch(
          `/api/upload?filename=${encodeURIComponent(file.name)}`,
          {
            method: "POST",
            body: file,
            headers: {
              // Don't set Content-Type, let the browser set it with boundary for multipart
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error || `Upload failed with status ${response.status}`;
          console.error("Upload error:", errorMessage, response.status);
          throw new Error(errorMessage);
        }

        const blob = await response.json();

        if (!blob || !blob.url) {
          throw new Error("Invalid response from upload endpoint");
        }

        newUploads.push({
          url: blob.url,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }

      // Use ref to get the latest value, avoiding stale closure issues
      // This is important when uploading multiple files in quick succession
      const currentFiles = valueRef.current;
      // Check for duplicates by URL to avoid adding the same file twice
      const existingUrls = new Set(currentFiles.map((f) => f.url));
      const uniqueNewUploads = newUploads.filter(
        (f) => !existingUrls.has(f.url),
      );
      onChange([...currentFiles, ...uniqueNewUploads]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file(s). Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (indexToRemove: number) => {
    const updated = value.filter((_, index) => index !== indexToRemove);
    onChange(updated);
  };

  function onDragOver(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }

  function onFileSelect(e: ChangeEvent<HTMLInputElement>) {
    handleUpload(e.target.files);
    e.target.value = "";
  }

  return (
    <div className="w-full space-y-4">
      <label
        htmlFor="dropzone-file"
        className={cn(
          "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          "bg-muted/5 hover:bg-muted/10",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/20 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-60",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Uploading files...
              </p>
            </>
          ) : (
            <>
              <div className="bg-muted p-3 rounded-full mb-3">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mb-1 text-sm text-foreground font-medium">
                <span className="text-primary hover:underline">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                Images only (JPG, PNG, GIF, WEBP, SVG)
              </p>
            </>
          )}
        </div>

        <input
          id="dropzone-file"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileSelect}
          disabled={isUploading}
        />
      </label>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={`${file.url}-${index}`}
              className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-primary/10 p-2 rounded">
                  <FileIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground truncate hover:underline hover:text-primary transition-colors"
                  >
                    {file.name}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
