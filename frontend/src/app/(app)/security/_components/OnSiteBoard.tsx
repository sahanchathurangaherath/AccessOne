import { EmptyState } from "@/components/states";
import { CredentialChip } from "@/components/credential-chip";
import { Button } from "@/components/ui/button";
import type { OnSiteDto } from "../_hooks/useVisitors";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Answers one question -- who is in the building right now -- at a glance
 * from across a desk. The overdue case gets a text warning as well as a
 * border colour, because meaning must never depend on colour alone.
 */
export function OnSiteBoard({
  rows, onCheckOut, isCheckingOut,
}: { rows: OnSiteDto[]; onCheckOut: (row: OnSiteDto) => void; isCheckingOut: boolean }) {
  if (rows.length === 0) {
    return (
      <EmptyState title="Nobody on site" body="Visitors appear here when they are checked in." />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <li
          key={row.visitLogId}
          className={`rounded-card border bg-surface p-4 ${row.passOverdue ? "border-denied/40" : "border-rule"}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{row.visitorName}</p>
              {row.company && <p className="truncate text-sm text-slate">{row.company}</p>}
            </div>
            <CredentialChip serial={row.passNo} status={row.passOverdue ? "denied" : "granted"} />
          </div>

          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate">Host</dt>
              <dd className="truncate">{row.hostName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate">On site</dt>
              <dd className="identifier">{formatDuration(row.minutesOnSite)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate">Valid until</dt>
              <dd className="identifier">{formatTime(row.validUntil)}</dd>
            </div>
          </dl>

          {row.passOverdue && (
            <p className="mt-3 rounded-card bg-denied/5 px-2 py-1 text-xs text-denied">
              Pass expired -- visitor still on site
            </p>
          )}

          <Button
            size="sm" variant="outline" className="mt-3 w-full"
            disabled={isCheckingOut}
            onClick={() => onCheckOut(row)}
          >
            Check out
          </Button>
        </li>
      ))}
    </ul>
  );
}
