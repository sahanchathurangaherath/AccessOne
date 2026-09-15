"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDispatchList, type DispatchRow } from "../_hooks/usePrint";
import {
  Truck,
  Printer,
  BarChart3,
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Cpu,
  User,
  Building2,
  Mail,
  PackageCheck,
  Send,
} from "lucide-react";

const METHOD_FILTERS = [
  { label: "All Methods", value: "" },
  { label: "Front-Desk Collection", value: "COLLECTION" },
  { label: "Internal Mail", value: "INTERNAL_MAIL" },
  { label: "Courier Delivery", value: "COURIER" },
];

const STATUS_FILTERS = [
  { label: "All Statuses", value: "" },
  { label: "Pending Dispatch", value: "PENDING" },
  { label: "In Transit", value: "DISPATCHED" },
  { label: "Delivered & Active", value: "DELIVERED" },
  { label: "Returned Undelivered", value: "RETURNED" },
];

export default function DispatchListPage() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError, refetch } = useDispatchList(0, 50);

  const rawRows: DispatchRow[] = data?.content ?? [];

  // KPI Calculations
  const pendingCount = rawRows.filter((r) => r.status === "PENDING").length;
  const inTransitCount = rawRows.filter((r) => r.status === "DISPATCHED").length;
  const deliveredCount = rawRows.filter((r) => r.status === "DELIVERED").length;
  const returnedCount = rawRows.filter((r) => r.status === "RETURNED").length;

  // Filter content
  const filteredContent = useMemo(() => {
    return rawRows.filter((r) => {
      const matchesMethod = !methodFilter || r.dispatchMethod === methodFilter;
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.jobNo.toLowerCase().includes(q) ||
        r.cardSerial.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q);
      return matchesMethod && matchesStatus && matchesSearch;
    });
  }, [rawRows, methodFilter, statusFilter, search]);

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

  const columns: Column<DispatchRow>[] = [
    {
      key: "jobNo",
      header: "Manifest / Job #",
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-credential border border-blue-200/60 flex items-center justify-center font-bold text-xs shadow-2xs">
            <PackageCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="identifier font-bold text-xs sm:text-sm text-ink block">{d.jobNo}</span>
            <span className="text-[10px] text-slate-400 font-mono">Manifest #{d.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: "cardSerial",
      header: "Enclosed Smart Card",
      render: (d) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 shadow-2xs">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="identifier font-bold text-xs sm:text-sm text-ink block">{d.cardSerial}</span>
            <span className="text-[10px] text-slate-400 font-mono">Active on Handover</span>
          </div>
        </div>
      ),
    },
    {
      key: "employeeName",
      header: "Recipient Cardholder",
      render: (d) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-xs sm:text-sm text-ink">{d.employeeName}</span>
        </div>
      ),
    },
    {
      key: "dispatchMethod",
      header: "Delivery Routing",
      render: (d) => {
        const method = d.dispatchMethod;
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper px-2.5 py-1 text-xs font-medium text-slate-700">
            {method === "COLLECTION" ? (
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
            ) : method === "INTERNAL_MAIL" ? (
              <Mail className="h-3.5 w-3.5 text-purple-600" />
            ) : (
              <Truck className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span>
              {method === "COLLECTION"
                ? "Desk Collection"
                : method === "INTERNAL_MAIL"
                ? "Internal Mail"
                : "Courier Delivery"}
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Dispatch Status",
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (d) => (
        <Link href={`/print/dispatch/${d.id}`}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-xs gap-1 text-slate-700 border-rule hover:bg-slate-50 font-semibold"
          >
            <span>Handover</span>
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
                Card Dispatch & Delivery Hub
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-credential border border-blue-200/60">
                Logistics & Handover
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Track courier dispatches, department mail bags, and front-desk handovers that activate employee access.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/print"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print Queue</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <Truck className="h-3.5 w-3.5" />
              <span>Dispatch Hub ({rawRows.length})</span>
            </span>
            <Link
              href="/print/reports"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Production Reports</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE DISPATCH KPIS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => setStatusFilter(statusFilter === "PENDING" ? "" : "PENDING")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "PENDING"
                ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Dispatch
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{pendingCount}</span>
              <span className="text-xs font-medium text-amber-600">awaiting send</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700">Passed QC and packaged</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "DISPATCHED" ? "" : "DISPATCHED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "DISPATCHED"
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                In Transit
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
                <Send className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700">{inTransitCount}</span>
              <span className="text-xs font-medium text-blue-600">in courier transit</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-700">En route to employee</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "DELIVERED" ? "" : "DELIVERED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "DELIVERED"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Delivered & Active
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{deliveredCount}</span>
              <span className="text-xs font-medium text-emerald-600">active badges</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Activated at door turnstiles</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "RETURNED" ? "" : "RETURNED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "RETURNED"
                ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Returned Undelivered
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-2xs">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">{returnedCount}</span>
              <span className="text-xs font-medium text-slate-400">cards</span>
            </div>
            <div className="mt-2 text-[11px] text-rose-700">Requires re-dispatch</div>
          </div>
        </div>

        {/* ─── 2. OMNISEARCH & METHOD FILTERS ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dispatch by job #, card serial, or employee name..."
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
              {METHOD_FILTERS.map((m) => {
                const active = methodFilter === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMethodFilter(m.value)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none flex-shrink-0",
                      active
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-paper text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-rule/60"
                    )}
                  >
                    {m.label}
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

        {/* ─── 3. DISPATCH DATA TABLE ─── */}
        <div className="rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            page={pagedData}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            rowHref={(d) => `/print/dispatch/${d.id}`}
            empty={{
              title: search || methodFilter || statusFilter ? "No matching dispatch records" : "No cards in dispatch queue",
              body:
                search || methodFilter || statusFilter
                  ? "Try adjusting your search query or delivery method filter."
                  : "Cards approved during quality inspection will move here to be routed to cardholders.",
            }}
          />
        </div>
      </div>
    </RequireRole>
  );
}

