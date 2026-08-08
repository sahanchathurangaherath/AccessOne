import { Skeleton } from "@/components/ui/skeleton";

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="sr-only">Loading</span>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-rule border-t-credential"
           aria-hidden="true" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** An empty screen is an invitation to act, not a dead end. */
export function EmptyState({
  title, body, action,
}: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-rule bg-surface px-6 py-12 text-center">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Errors say what happened and what to do. They do not apologise. */
export function ErrorState({
  title = "Could not load this",
  body,
  onRetry,
}: { title?: string; body: string; onRetry?: () => void }) {
  return (
    <div role="alert"
         className="rounded-card border border-denied/30 bg-denied/5 px-6 py-8 text-center">
      <h2 className="text-base font-medium text-denied">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink">{body}</p>
      {onRetry && (
        <button onClick={onRetry}
                className="mt-4 text-sm font-medium text-credential underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function NotAuthorised() {
  return (
    <EmptyState
      title="You do not have access to this section"
      body="Your role does not include this area. Contact your system administrator if you need it."
    />
  );
}
