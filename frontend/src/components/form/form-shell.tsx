import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FormShellProps = {
  onSubmit: (e: React.FormEvent) => void;
  formError?: string | null;
  isPending?: boolean;
  submitLabel: string;
  onCancel: () => void;
  children: React.ReactNode;
  className?: string;
  submitIcon?: React.ReactNode;
};

/** The form-level error banner, submit/cancel buttons and pending state -- every form repeats these. */
export function FormShell({
  onSubmit,
  formError,
  isPending,
  submitLabel,
  onCancel,
  children,
  className,
  submitIcon,
}: FormShellProps) {
  return (
    <form onSubmit={onSubmit} noValidate className={cn("space-y-6", className)}>
      {children}
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-sm text-red-700 shadow-xs animate-fade-in"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="leading-snug">{formError}</div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-3">
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-credential px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#173B72] transition-all cursor-pointer inline-flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              {submitIcon}
              {submitLabel}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl border-rule bg-white text-slate-700 hover:bg-slate-100 text-sm px-4 py-2.5 transition-all cursor-pointer"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

