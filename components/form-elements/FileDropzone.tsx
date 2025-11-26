"use client";

import { useState, DragEvent } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdditionalFields } from "@/app/types/DailyLog";
// created for ui right now its not functional but will be updated in the future
export default function FileDropzone({
  value,
  onChange,
}: {
  value: AdditionalFields["uploadedFiles"];
  onChange: (uploadedFiles: AdditionalFields["uploadedFiles"]) => void;
}) {
  const update = (uploadedFiles: AdditionalFields["uploadedFiles"]) =>
    onChange?.(uploadedFiles);

  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      update([
        ...value,
        {
          url: "",
          name: file.name,
          type: file.type,
          size: file.size,
        } as AdditionalFields["uploadedFiles"][number],
      ]);
    }
  }
  async function uploadToVercelBlob(file: File) {
    setUploading(true);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-vercel-filename": file.name,
      },
      body: file,
    });

    const { url } = await res.json();
    setUploading(false);
    return { url, name: file.name, type: file.type, size: file.size };
  }
  async function onFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files;
    if (!selected) return;

    const uploadedFiles: AdditionalFields["uploadedFiles"] = [];

    for (const file of selected) {
      const uploaded = await uploadToVercelBlob(file);
      uploadedFiles.push(uploaded);
    }

    onChange([...value, ...uploadedFiles]);
  }

  return (
    <div className="w-full flex justify-center items-center">
      <label
        htmlFor="dropzone-file"
        className={cn(
          "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          "bg-muted/20 hover:bg-muted/30 dark:bg-muted/30 dark:hover:bg-muted/40",
          "border-muted-foreground/30 dark:border-muted-foreground/20",
          isDragging && "bg-primary/10 border-primary text-primary",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="h-10 w-10 text-muted-foreground" />

          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>

          <p className="text-xs text-muted-foreground">
            PNG, JPG, PDF (MAX. 10MB)
          </p>

          {fileName && (
            <p className="text-sm font-medium mt-3 text-primary">
              Selected: {fileName}
            </p>
          )}
          {uploading && (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              <p className="text-sm font-medium mt-3 text-muted-foreground">
                Uploading...
              </p>
            </div>
          )}
        </div>

        <input
          id="dropzone-file"
          type="file"
          multiple
          className="hidden"
          onChange={onFileSelect}
        />
      </label>
    </div>
  );
}
