import { StatusBadge } from "@/components/status-badge";

export function DetailHeader({ identifier, title, status, actions }: {
  identifier: string; title: string; status: string; actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-rule bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="identifier rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-200">
            {identifier}
          </span>
          <StatusBadge status={status} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
