import { Button } from "@/components/ui/button";

type FormShellProps = {
  onSubmit: (e: React.FormEvent) => void;
  formError?: string | null;
  isPending?: boolean;
  submitLabel: string;
  onCancel: () => void;
  children: React.ReactNode;
};

/** The form-level error banner, submit/cancel buttons and pending state -- every form repeats these. */
export function FormShell({
  onSubmit, formError, isPending, submitLabel, onCancel, children,
}: FormShellProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-5">
      {children}
      {formError && (
        <div role="alert"
             className="rounded-card border border-denied/30 bg-denied/5 px-3 py-2 text-sm text-denied">
          {formError}
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
