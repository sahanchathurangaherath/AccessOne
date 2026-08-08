"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";

type FileUploadFieldProps = {
  label: string;
  name: string;
  accept: string;
  maxBytes: number;
  hint?: string;
  onChange: (file: File | null) => void;
  /** Shown when the record already has a file and none has been chosen yet, e.g. "A photo is already attached." */
  existingLabel?: string;
};

/**
 * Drag or click, with the limits stated before the user picks a file --
 * never as a rejection after. `accept` and `maxBytes` are props because a
 * card photo and a police report have different rules.
 */
export function FileUploadField({
  label, name, accept, maxBytes, hint, onChange, existingLabel,
}: FileUploadFieldProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onChange(file);
  }

  const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <p className="text-xs text-slate">{hint ?? `Up to ${maxMb} MB.`}</p>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="cursor-pointer rounded-card border border-dashed border-rule bg-paper px-4 py-6 text-center transition-colors hover:border-credential/50"
      >
        <input
          ref={inputRef}
          id={name}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-slate">
          {fileName
            ? <span className="font-medium text-ink">{fileName}</span>
            : "Click or drag a file here"}
        </p>
      </div>
      {existingLabel && !fileName && (
        <p className="text-xs text-granted">{existingLabel}</p>
      )}
    </div>
  );
}
