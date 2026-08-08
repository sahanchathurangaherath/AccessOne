import { StatusBadge } from "@/components/status-badge";
import type { TimelineEntry } from "@/lib/resource";

/** Lifted out of Module 1's detail page. Every module with a status history gets this for one hook call. */
export function StatusTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate">No history yet.</p>;
  }

  return (
    <ol className="relative border-l border-rule pl-6">
      {entries.map((entry, i) => (
        <li key={i} className="mb-6 last:mb-0">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-credential" />
          <StatusBadge status={entry.status} />
          <p className="mt-1 text-sm text-slate">
            {entry.note} · <span className="identifier">{entry.changedBy}</span>
          </p>
          <time className="identifier text-xs text-slate">
            {new Date(entry.changedAt).toLocaleString()}
          </time>
        </li>
      ))}
    </ol>
  );
}
