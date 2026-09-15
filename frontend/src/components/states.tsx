import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FolderOpen, AlertCircle, ShieldAlert, Loader2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-rule bg-surface/90 px-8 py-7 shadow-sm backdrop-blur">
        <Loader2 className="h-7 w-7 animate-spin text-credential" />
        <p className="text-xs font-medium text-slate">Loading system data...</p>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-rule bg-surface p-4 shadow-xs" aria-busy="true" aria-label="Loading results">
      <div className="h-9 w-full rounded-lg bg-slate-100 animate-shimmer" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 w-full rounded-lg bg-slate-100/70 animate-shimmer" />
      ))}
    </div>
  );
}

/** An empty screen is an invitation to act, not a dead end. */
export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-rule bg-surface px-6 py-14 text-center shadow-xs", className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {icon || <FolderOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Errors say what happened and what to do. */
export function ErrorState({
  title = "Could not load data",
  body,
  onRetry,
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-10 text-center shadow-xs"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-red-700">{body}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-5 gap-2 border-red-200 bg-surface text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

export function NotAuthorised() {
  return (
    <EmptyState
      icon={<ShieldAlert className="h-6 w-6 text-amber-600" />}
      title="You do not have access to this section"
      body="Your account role does not include access to this operational area. Contact your system administrator if you need elevation."
    />
  );
}
