export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 pb-1">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
          {badge && <span className="badge-topic">{badge}</span>}
        </div>
        {description && <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
