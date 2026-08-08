import { StatusBadge } from "@/components/status-badge";

export function DetailHeader({ identifier, title, status, actions }: {
  identifier: string; title: string; status: string; actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 border-b border-rule pb-4">
      <div>
        <p className="identifier text-sm text-slate">{identifier}</p>
        <h1 className="mt-0.5 text-xl font-semibold">{title}</h1>
        <div className="mt-2"><StatusBadge status={status} /></div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
