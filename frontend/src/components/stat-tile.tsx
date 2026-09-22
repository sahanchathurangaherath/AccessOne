import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

export type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "denied" | "pending" | "granted";
  href?: string;
  icon?: ReactNode;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
  change?: number;
  changeLabel?: string;
  loading?: boolean;
};

/** High-production enterprise Stat Tile supporting metrics, trends, icons and links */
export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  href,
  icon,
  iconBg = "bg-blue-50 text-blue-700",
  trend,
  change,
  changeLabel,
  loading = false,
}: StatTileProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-emerald-700"
      : trend === "down"
      ? "text-red-700"
      : "text-slate-500";

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5 rounded-2xl border border-rule bg-surface p-4 sm:p-4.5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-24 rounded bg-slate-200 animate-shimmer" />
            <div className="h-7 w-16 rounded bg-slate-200 animate-shimmer" />
          </div>
          {icon && (
            <div className="h-9 w-9 rounded-xl bg-slate-100 animate-shimmer" />
          )}
        </div>
      </div>
    );
  }

  const body = (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-rule bg-surface p-4 sm:p-4.5 shadow-xs transition-all duration-200 hover:shadow-sm hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p
            className={cn(
              "identifier mt-1 text-2xl sm:text-3xl font-black tracking-tight text-ink",
              tone === "denied" && "text-denied",
              tone === "pending" && "text-pending",
              tone === "granted" && "text-granted"
            )}
          >
            {value}
          </p>
        </div>

        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
              iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(trend || change !== undefined || changeLabel || hint) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate">
          {trend && (
            <span className={cn("inline-flex items-center gap-1 font-semibold", trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" />
              {change !== undefined && (
                <span>
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              )}
            </span>
          )}
          {(changeLabel || hint) && (
            <span className="text-slate-500 text-[11px]">{changeLabel || hint}</span>
          )}
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatTileRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      {children}
    </div>
  );
}
