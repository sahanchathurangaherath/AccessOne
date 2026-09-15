"use client";

import { useRef, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type FileUploadFieldProps = {
  label: string;
  name: string;
  accept: string;
  maxBytes: number;
  hint?: string;
  onChange: (file: File | null) => void;
  /** Shown when the record already has a file and none has been chosen yet, e.g. "A photo is already attached." */
  existingLabel?: string;
  existingPreviewUrl?: string;
};

/**
 * Modern interactive drag & drop file upload with live image preview,
 * drag-over animations, instant client-side size validation, and remove/replace actions.
 */
export function FileUploadField({
  label,
  name,
  accept,
  maxBytes,
  hint,
  onChange,
  existingLabel,
  existingPreviewUrl,
}: FileUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPreviewUrl ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("http") && !previewUrl.startsWith("/api/")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileSelected(selectedFile: File | null) {
    setLocalError(null);
    if (!selectedFile) return;

    if (selectedFile.size > maxBytes) {
      const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
      setLocalError(`File exceeds maximum size of ${maxMb} MB. (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`);
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    onChange(selectedFile);
  }

  function handleRemove() {
    setFile(null);
    setPreviewUrl(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  }

  const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </Label>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>

      {/* When a file or preview is available */}
      {previewUrl || (file && !file.type.startsWith("image/")) ? (
        <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-blue-50/40 p-4 transition-all animate-fade-in">
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                <img
                  src={previewUrl}
                  alt="Uploaded preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-credential">
                <ImageIcon className="h-7 w-7" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="truncate text-xs font-bold text-ink">
                  {file?.name ?? "Attached photo"}
                </p>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {file
                  ? `${(file.size / 1024).toFixed(0)} KB · ${file.type.split("/")[1]?.toUpperCase() ?? "IMAGE"}`
                  : existingLabel ?? "Attached on file"}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-rule bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-ink transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 shadow-xs hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0] ?? null;
            handleFileSelected(dropped);
          }}
          className={cn(
            "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none",
            isDragging
              ? "border-credential bg-blue-50/60 scale-[1.008] shadow-sm ring-4 ring-blue-500/10"
              : "border-slate-200 bg-white hover:border-credential/60 hover:bg-blue-50/20"
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 mb-3",
              isDragging
                ? "bg-credential text-white scale-110 shadow-md"
                : "bg-blue-50 text-credential group-hover:bg-credential group-hover:text-white group-hover:scale-105"
            )}
          >
            <UploadCloud className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">
              <span className="text-credential underline-offset-4 group-hover:underline">
                Click to upload
              </span>{" "}
              or drag & drop
            </p>
            <p className="text-xs text-slate-500">
              Accepted formats: {accept.replaceAll("image/", "").replaceAll(",", ", ").toUpperCase()} (Max {maxMb} MB)
            </p>
          </div>

          {existingLabel && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {existingLabel}
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        id={name}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
      />

      {localError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{localError}</span>
        </div>
      )}
    </div>
  );
}
