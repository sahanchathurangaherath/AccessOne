import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
};

/** Label, control, hint and error in one place, so no module has to remember role="alert" every time. */
export function Field({ label, name, error, hint, required, children }: FieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={name}
          className="text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
          {required && (
            <span className="ml-1 font-bold text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      </div>
      {children}
      {hint && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-red-600 animate-fade-in"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

