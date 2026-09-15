"use client";

import Link from "next/link";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import type { OnSiteDto } from "../_hooks/useVisitors";
import {
  User,
  Building,
  Clock,
  Calendar,
  AlertTriangle,
  LogOut,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function OnSiteBoard({
  rows,
  onCheckOut,
  isCheckingOut,
}: {
  rows: OnSiteDto[];
  onCheckOut: (row: OnSiteDto) => void;
  isCheckingOut: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-rule bg-surface p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-ink">Zero Visitors Currently On-Site</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          All visitor passes have been checked out or no visits are active. Checked-in visitors will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div
          key={row.visitLogId}
          className={cn(
            "rounded-2xl border bg-surface p-5 shadow-xs transition-all duration-200 flex flex-col justify-between hover:shadow-md",
            row.passOverdue
              ? "border-red-400/80 bg-red-50/20 ring-2 ring-red-500/15"
              : "border-rule hover:border-slate-300"
          )}
        >
          <div>
            {/* Header: Visitor Info & Pass Badge */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-rule bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shadow-2xs">
                  {row.visitorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-sm text-ink leading-tight">{row.visitorName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="rounded-full bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-credential">
                      {row.visitorType.replaceAll("_", " ")}
                    </span>
                    {row.company && (
                      <span className="truncate text-[11px] text-slate-500 font-medium max-w-28">
                        &bull; {row.company}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <span className="identifier rounded-lg bg-paper border border-rule/80 px-2 py-1 text-[11px] font-bold text-slate-800 flex-shrink-0">
                {row.passNo}
              </span>
            </div>

            {/* Visit Details Grid */}
            <div className="mt-4 rounded-xl bg-paper/70 border border-rule/60 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Host Employee
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-36">
                  {row.hostName} ({row.hostEmpId})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Duration On Site
                </span>
                <span className="identifier font-bold text-ink">{formatDuration(row.minutesOnSite)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> Pass Valid Until
                </span>
                <span
                  className={cn(
                    "identifier font-semibold",
                    row.passOverdue ? "text-red-700 font-bold" : "text-slate-700"
                  )}
                >
                  {formatTime(row.validUntil)}
                </span>
              </div>
            </div>

            {/* Overdue Alert Banner */}
            {row.passOverdue && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="font-bold">Pass expired &bull; visitor still on site</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-4 pt-3 border-t border-rule/50 flex items-center gap-2">
            <Button
              size="sm"
              variant={row.passOverdue ? "destructive" : "default"}
              className={cn(
                "flex-1 gap-1.5 rounded-xl text-xs font-semibold h-9",
                !row.passOverdue && "bg-slate-900 text-white hover:bg-slate-800"
              )}
              disabled={isCheckingOut}
              onClick={() => onCheckOut(row)}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Check Out</span>
            </Button>

            <Link href={`/security/passes/${row.passId}`}>
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3 rounded-xl border-rule text-slate-700 hover:bg-slate-50"
                title="View Pass Details"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
