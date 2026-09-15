"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { ErrorState, TableSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { dashboard } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { OnSiteBoard } from "./_components/OnSiteBoard";
import { useOnSite, useCheckOut, type OnSiteDto } from "./_hooks/useVisitors";
import {
  ShieldCheck,
  Users,
  CreditCard,
  History,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  X,
  RefreshCw,
  Lock,
} from "lucide-react";

export default function SecurityDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useOnSite();
  const checkOut = useCheckOut();
  const { data: stats } = dashboard.useSecurity();

  const rawRows: OnSiteDto[] = data ?? [];

  // Filter on-site visitors by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rawRows;
    const q = searchQuery.toLowerCase().trim();
    return rawRows.filter(
      (r) =>
        r.visitorName.toLowerCase().includes(q) ||
        r.passNo.toLowerCase().includes(q) ||
        r.hostName.toLowerCase().includes(q) ||
        (r.company && r.company.toLowerCase().includes(q))
    );
  }, [rawRows, searchQuery]);

  async function onCheckOut(row: OnSiteDto) {
    try {
      await checkOut.mutateAsync(row.passId);
      toast.success(`${row.visitorName} successfully checked out`);
      void refetch();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not check out this visitor");
    }
  }

  return (
    <RequireRole allow={["SECURITY_OFFICER", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Security Operations & On-Site Activity
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-credential border border-blue-200/60">
                Live Occupancy
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Live monitoring of checked-in visitors, physical turnstile sensors, and pass validity windows.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>On-Site Activity ({stats?.onSiteNow ?? rawRows.length})</span>
            </span>
            <Link
              href="/security/visitors"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>Visitor Register</span>
            </Link>
            <Link
              href="/security/passes"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 text-slate-500" />
              <span>Temporary Passes</span>
            </Link>
            <Link
              href="/security/access"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <History className="h-3.5 w-3.5 text-slate-500" />
              <span>Access Decision Log</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE SECURITY KPIS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* On Site Now */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                On-Site Occupancy
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{stats?.onSiteNow ?? rawRows.length}</span>
              <span className="text-xs font-medium text-slate-400">visitors checked in</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time occupancy tracking</span>
            </div>
          </div>

          {/* Open Alerts / Overdue */}
          <div
            className={cn(
              "rounded-2xl border p-5 shadow-xs select-none bg-surface",
              (stats?.openAlerts ?? 0) > 0 || rawRows.some((r) => r.passOverdue)
                ? "border-red-300 ring-2 ring-red-500/15 bg-red-50/20"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Overdue Pass Alerts
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-2xs">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-700">
                {stats?.openAlerts ?? rawRows.filter((r) => r.passOverdue).length}
              </span>
              <span className="text-xs font-medium text-red-600">breached passes</span>
            </div>
            <div className="mt-2 text-[11px] text-red-600">Requires desk escort or checkout</div>
          </div>

          {/* Denied Attempts Today */}
          <Link href="/security/access" className="group block focus-visible:outline-none">
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Denied Attempts
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-2xs">
                  <XCircle className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-red-700">{stats?.deniedToday ?? 0}</span>
                <span className="text-xs font-medium text-slate-400">today</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 group-hover:text-credential transition-colors">
                View sensor log audits &rarr;
              </div>
            </div>
          </Link>

          {/* Expiring Within Hour */}
          <Link href="/security/passes" className="group block focus-visible:outline-none">
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Expiring Soon (&lt;1h)
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                  <Clock className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-700">{stats?.expiringWithinHour ?? 0}</span>
                <span className="text-xs font-medium text-amber-600">passes expiring</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-700">Automatic extension available</div>
            </div>
          </Link>
        </div>

        {/* ─── 2. LIVE ON-SITE SEARCH & CONTROLS ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active visitors by name, pass #, company, or host..."
              className="h-10 w-full rounded-xl border border-rule bg-paper pl-10 pr-9 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="gap-1.5 rounded-xl text-xs h-9"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", isRefetching && "animate-spin")} />
              <span>Refresh Roster</span>
            </Button>

            <Link href="/security/visitors">
              <Button size="sm" className="gap-1.5 rounded-xl bg-credential text-white hover:bg-credential/90 text-xs h-9">
                <Users className="h-3.5 w-3.5" />
                <span>Register Visitor</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── 3. ON-SITE ROSTER BOARD ─── */}
        {isLoading && <TableSkeleton rows={3} />}
        {isError && (
          <ErrorState body="The on-site occupancy roster could not be loaded." onRetry={() => void refetch()} />
        )}
        {!isLoading && !isError && (
          <OnSiteBoard
            rows={filteredRows}
            onCheckOut={(row) => void onCheckOut(row)}
            isCheckingOut={checkOut.isPending}
          />
        )}
      </div>
    </RequireRole>
  );
}
