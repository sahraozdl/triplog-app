"use client";

import {
  useState,
  DragEvent,
  ChangeEvent,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { Loader2, UploadCloud, FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadedFile } from "@/app/types/DailyLog";
import { Button } from "@/components/ui/button";
import { uploadFile, createHandleUploadError } from "@/lib/utils/tripHelpers";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";

interface FileDropzoneProps {
  id?: string;
  value?: UploadedFile[];
  onChange?: (uploadedFiles: UploadedFile[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  showToast?: (message: string, type?: "success" | "error") => void;
  // dont forget custom upload function - if provided, uses this instead of default uploadFile
  customUpload?: (
    file: File,
  ) => Promise<{ success: boolean; error?: string; file?: UploadedFile }>;
  hideFileList?: boolean;
  className?: string;
  uploadText?: string;
  uploadSubtext?: string;
  disabled?: boolean;
}

export default function FileDropzone({
  value = [],
  onChange,
  onUploadSuccess,
  onUploadError,
  showToast,
  customUpload,
  hideFileList = false,
  className,
  uploadText,
  uploadSubtext,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const valueRef = useRef<UploadedFile[]>(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleUploadError = useMemo(() => {
    if (showToast) {
      return createHandleUploadError(showToast);
    }
    return onUploadError || ((error: string) => alert(error));
  }, [showToast, onUploadError]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled || isUploading) return;

    setIsUploading(true);
    const newUploads: UploadedFile[] = [];
    let hasSuccess = false;

    try {
      for (const file of Array.from(files)) {
        const result = customUpload
          ? await customUpload(file)
          : await uploadFile(file);

        if (!result.success) {
          handleUploadError(result.error || "Failed to upload file");
          continue;
        }

        hasSuccess = true;
        if (result.file) {
          newUploads.push(result.file);
        }
      }

      if (onChange && newUploads.length > 0) {
        const currentFiles = valueRef.current;
        const existingUrls = new Set(currentFiles.map((f) => f.url));
        const uniqueNewUploads = newUploads.filter(
          (f) => !existingUrls.has(f.url),
        );
        if (uniqueNewUploads.length > 0) {
          onChange([...currentFiles, ...uniqueNewUploads]);
        }
      }

      if (onUploadSuccess && hasSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload error:", error);
      handleUploadError("Failed to upload file(s). Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (indexToRemove: number) => {
    if (!onChange) return;
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
    <div
      className={cn("w-full", hideFileList ? "" : "space-y-4", className)}
      id="fileDropzone"
    >
      <Label
        htmlFor="dropzone-file"
        variant="dropzone"
        isDragging={isDragging}
        isUploading={isUploading}
        disabled={disabled}
        hideFileList={hideFileList}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center text-center",
            hideFileList ? "gap-4" : "pt-5 pb-6 px-4",
          )}
        >
          {isUploading ? (
            <>
              <Loader2
                className={cn(
                  "text-primary animate-spin mb-3",
                  hideFileList ? "h-6 w-6" : "h-10 w-10",
                )}
              />
              <p className="text-sm font-medium text-muted-foreground">
                {uploadText || "Uploading files..."}
              </p>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "rounded-full mb-3",
                  hideFileList ? "p-3 bg-muted" : "bg-muted p-3 rounded-full",
                )}
              >
                <UploadCloud
                  className={cn(
                    "text-muted-foreground",
                    hideFileList ? "h-6 w-6" : "h-6 w-6",
                  )}
                />
              </div>
              <div className={hideFileList ? "space-y-1" : ""}>
                <p
                  className={cn(
                    "text-foreground font-medium",
                    hideFileList ? "text-sm" : "mb-1 text-sm",
                  )}
                >
                  {uploadText || (
                    <>
                      <span className="text-primary hover:underline">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploadSubtext || "Images only (JPG, PNG, GIF, WEBP, SVG)"}
                </p>
              </div>
            </>
          )}
        </div>

        <Input
          id="dropzone-file"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileSelect}
          disabled={isUploading || disabled}
        />
      </Label>

      {!hideFileList && value.length > 0 && (
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
