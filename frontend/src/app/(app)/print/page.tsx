"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { dashboard } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { printJobs, type PrintJobRow } from "./_hooks/usePrint";
import {
  Printer,
  Truck,
  BarChart3,
  Search,
  X,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Cpu,
  User,
  Building2,
  Sparkles,
} from "lucide-react";

function waitingSince(queuedAt: string) {
  const ms = Date.now() - new Date(queuedAt).getTime();
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return { text: "under 1h", urgent: false };
  if (hours < 24) return { text: `${Math.floor(hours)}h in queue`, urgent: hours > 8 };
  const days = Math.floor(hours / 24);
  return { text: `${days}d in queue`, urgent: true };
}

const STATUS_FILTERS = [
  { label: "All Jobs", value: "" },
  { label: "Queued", value: "QUEUED" },
  { label: "In Production", value: "IN_PROGRESS" },
  { label: "Printed", value: "PRINTED" },
  { label: "QC Failed", value: "QC_FAILED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const TYPE_FILTERS = [
  { label: "All Types", value: "" },
  { label: "Initial Issuance", value: "INITIAL" },
  { label: "Reprint / Replacement", value: "REPRINT" },
];

export default function PrintQueuePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  
  const { data, isLoading, isError, refetch } = printJobs.useList({ size: 100, sort: "queuedAt,desc" });
  const { data: stats } = dashboard.usePrint();

  const rawRows: PrintJobRow[] = data?.content ?? [];

  // KPI Calculations
  const queuedCount = stats?.queued ?? rawRows.filter((r) => r.status === "QUEUED").length;
  const inProgressCount = stats?.inProgress ?? rawRows.filter((r) => r.status === "IN_PROGRESS").length;
  const printedTodayCount = stats?.printedToday ?? rawRows.filter((r) => r.status === "PRINTED" || r.status === "COMPLETED").length;
  const reprintRatePct = stats?.reprintRatePct ?? 0;

  // Filter content
  const filteredContent = useMemo(() => {
    return rawRows.filter((r) => {
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const matchesType = !typeFilter || r.jobType === typeFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.jobNo.toLowerCase().includes(q) ||
        r.cardSerial.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        r.empId.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q) ||
        (r.printerName && r.printerName.toLowerCase().includes(q));
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [rawRows, statusFilter, typeFilter, search]);

  const pagedData = useMemo(() => ({
    content: filteredContent,
    page: 0,
    size: filteredContent.length || 20,
    totalElements: filteredContent.length,
    totalPages: 1,
    first: true,
    last: true,
    empty: filteredContent.length === 0,
  }), [filteredContent]);

  const columns: Column<PrintJobRow>[] = [
    {
      key: "jobNo",
      header: "Production Job #",
      render: (j) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-credential border border-blue-200/60 flex items-center justify-center font-bold text-xs shadow-2xs">
            <Printer className="h-4 w-4" />
          </div>
          <div>
            <span className="identifier font-bold text-xs sm:text-sm text-ink block">{j.jobNo}</span>
            {j.jobType === "REPRINT" ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200/70">
                <RotateCcw className="h-2.5 w-2.5" /> Reprint
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Initial Issuance</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "cardSerial",
      header: "Target Smart Card",
      render: (j) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 shadow-2xs">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="identifier font-bold text-xs sm:text-sm text-ink block">{j.cardSerial}</span>
            <span className="text-[10px] text-slate-400 font-mono">CR80 RFID RFID-IC</span>
          </div>
        </div>
      ),
    },
    {
      key: "employeeName",
      header: "Cardholder Profile",
      render: (j) => (
        <div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-xs sm:text-sm text-ink">{j.employeeName}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
            <span className="identifier text-slate-400">{j.empId}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-slate-400" />
              {j.departmentName}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Job Status",
      render: (j) => (
        <div className="space-y-1">
          <StatusBadge status={j.status} />
          {j.printerName && (
            <span className="text-[10px] font-mono text-slate-400 block">
              via {j.printerName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "waiting",
      header: "Queue Ageing",
      render: (j) => {
        const info = waitingSince(j.queuedAt);
        return (
          <div className="flex items-center gap-1.5">
            <Clock className={cn("h-3.5 w-3.5", info.urgent ? "text-amber-500" : "text-slate-400")} />
            <span className={cn("text-xs font-medium", info.urgent ? "text-amber-700 font-semibold" : "text-slate-600")}>
              {info.text}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (j) => (
        <Link href={`/print/jobs/${j.id}`}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-xs gap-1 text-slate-700 border-rule hover:bg-slate-50 font-semibold"
          >
            <span>Process</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <RequireRole allow={["PRINT_SUPERVISOR", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Card Production & Print Queue
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-credential border border-blue-200/60">
                Print Operations
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Manage thermal badge printing, holographic laminating, quality inspection, and courier dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <Printer className="h-3.5 w-3.5" />
              <span>Print Queue ({rawRows.length})</span>
            </span>
            <Link
              href="/print/dispatch"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Truck className="h-3.5 w-3.5 text-slate-500" />
              <span>Dispatch Hub</span>
            </Link>
            <Link
              href="/print/reports"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Production Reports</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE PRODUCTION KPIS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => setStatusFilter(statusFilter === "QUEUED" ? "" : "QUEUED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "QUEUED"
                ? "border-credential ring-2 ring-credential/15 bg-blue-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Queued for Print
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <Layers className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{queuedCount}</span>
              <span className="text-xs font-medium text-slate-400">jobs pending</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Awaiting printer allocation</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "" : "IN_PROGRESS")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "IN_PROGRESS"
                ? "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                In Production
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shadow-2xs">
                <Printer className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-700">{inProgressCount}</span>
              <span className="text-xs font-medium text-purple-600">burning</span>
            </div>
            <div className="mt-2 text-[11px] text-purple-700">Engaged on physical hardware</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "PRINTED" ? "" : "PRINTED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "PRINTED"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Printed Today
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{printedTodayCount}</span>
              <span className="text-xs font-medium text-emerald-600">cards</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700">Completed production batch</div>
          </div>

          <Link
            href="/print/reports"
            className="rounded-2xl border border-rule p-5 transition-all bg-surface shadow-xs hover:shadow-md hover:border-credential"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Reprint & Defect Rate
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{reprintRatePct}%</span>
              <span className="text-xs font-medium text-slate-400">rate</span>
            </div>
            <div className="mt-2 text-[11px] text-credential font-semibold flex items-center gap-1">
              <span>View defect analytics</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </Link>
        </div>

        {/* ─── 2. OMNISEARCH & MULTI-DIMENSIONAL FILTERS ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job #, card serial, employee name, or department..."
                className="h-10 w-full rounded-xl border border-rule bg-paper pl-10 pr-9 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {TYPE_FILTERS.map((t) => {
                const active = typeFilter === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTypeFilter(t.value)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none flex-shrink-0",
                      active
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-paper text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-rule/60"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-rule/60">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "rounded-xl px-3 py-1 text-xs font-medium transition-all select-none flex-shrink-0",
                    active
                      ? "bg-credential/10 text-credential font-bold border border-credential/30"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 3. PRINT JOBS DATA TABLE ─── */}
        <div className="rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            page={pagedData}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            rowHref={(j) => `/print/jobs/${j.id}`}
            empty={{
              title: search || statusFilter || typeFilter ? "No matching print jobs found" : "Print queue is clear",
              body:
                search || statusFilter || typeFilter
                  ? "Try adjusting your search query or status/type filter."
                  : "Approved card requests from HR and IT will queue here automatically for production.",
            }}
          />
        </div>
      </div>
    </RequireRole>
  );
}

