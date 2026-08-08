import { Label } from "@/components/ui/label";

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
      <Label htmlFor={name}>
        {label}
        {required && <span className="ml-0.5 text-denied" aria-hidden="true">*</span>}
      </Label>
      {children}
      {hint && <p id={hintId} className="text-xs text-slate">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-denied">{error}</p>
      )}
    </div>
  );
}
