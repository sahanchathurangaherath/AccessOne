import React from "react";
import { cn } from "@/lib/utils";

export interface SectionBannerProps {
  icon?: React.ReactNode;
  badge?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: "default" | "tinted" | "card";
  className?: string;
}

/**
 * SectionBanner provides a high-contrast, light-themed topic container
 * that visually demarcates sections and establishes clear visual hierarchy.
 */
export function SectionBanner({
  icon,
  badge,
  title,
  description,
  actions,
  variant = "default",
  className,
}: SectionBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4",
        variant === "default" && "section-banner",
        variant === "tinted" && "section-banner-tinted",
        variant === "card" && "rounded-xl border border-rule bg-white p-4 sm:p-5 shadow-xs",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-credential border border-blue-100 shadow-2xs mt-0.5">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="topic-title-lg text-ink">{title}</h2>
            {badge && <span className="badge-topic">{badge}</span>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
