"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { dashboard } from "@/lib/dashboard";
import { cn, formatDate } from "@/lib/utils";
import { cards, type CardSummary } from "../_hooks/useCards";
import { QuickCardDrawer } from "../_components/QuickCardDrawer";
import {
  CreditCard,
  Search,
  X,
  ShieldCheck,
  History,
  IdCard,
  SlidersHorizontal,
  Key,
  Shield,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Wifi,
  Building2,
} from "lucide-react";

type Row = CardSummary;

const STATUS_FILTERS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Revoked", value: "REVOKED" },
  { label: "Lost", value: "LOST" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Printed", value: "PRINTED" },
  { label: "Queued", value: "QUEUED_FOR_PRINT" },
];

export default function CardsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerCardId, setDrawerCardId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = cards.useList({
    page,
    size: 50,
    sort: "createdAt,desc",
  });
  const { data: itStats } = dashboard.useIt();

  const isHR = user?.role === "HR_MANAGER";
  const isIT = user?.role === "IT_ADMIN" || user?.role === "SYSTEM_ADMIN";

  const rawRows: Row[] = data?.content ?? [];

  // KPI calculations
  const totalCount = data?.totalElements ?? rawRows.length;
  const activeCount = itStats?.activeCards ?? rawRows.filter((r) => r.status === "ACTIVE").length;
  const revokedCount = itStats?.revokedCards ?? rawRows.filter((r) => r.status === "REVOKED" || r.status === "VOIDED").length;
  const suspendedCount = rawRows.filter((r) => r.status === "SUSPENDED" || r.status === "LOST" || r.status === "DAMAGED").length;

  // Filter rows locally for instantaneous UI feedback
  const filteredContent = useMemo(() => {
    return rawRows.filter((r) => {
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.cardSerial.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        r.empId.toLowerCase().includes(q) ||
        (r.departmentName && r.departmentName.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [rawRows, statusFilter, searchQuery]);

  const filteredData = data
    ? {
        ...data,
        content: filteredContent,
      }
    : undefined;

  const columns: Column<Row>[] = [
    {
      key: "cardSerial",
      header: "Credential Serial",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-credential border border-blue-200/60 shadow-2xs">
            <Wifi className="h-4 w-4 rotate-90" />
          </div>
          <div>
            <span className="identifier font-bold text-xs sm:text-sm text-ink block">
              {r.cardSerial}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">13.56 MHz RFID</span>
          </div>
        </div>
      ),
    },
    {
      key: "employee",
      header: "Cardholder & Identity",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl border border-rule bg-slate-100 flex items-center justify-center shadow-2xs">
            <img
              src={`/api/v1/cards/${r.id}/photo`}
              alt={r.employeeName}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
            <span className="text-[11px] font-bold text-slate-600 select-none">
              {r.employeeName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-semibold text-ink text-xs sm:text-sm">{r.employeeName}</div>
            <div className="identifier text-[11px] text-slate-500">{r.empId}</div>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-700 font-medium text-xs">{r.departmentName}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Credential Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "issueDate",
      header: "Issue Date",
      render: (r) => (
        <div className="text-xs text-slate-600">
          <span className="font-medium">{formatDate(r.issueDate)}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDrawerCardId(r.id)}
            className="h-8 gap-1 rounded-lg text-xs font-semibold text-credential hover:bg-blue-50"
            title="Inspect credential layout and biometrics"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Inspect</span>
          </Button>

          <Link href={`/it/cards/${r.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 border-rule shadow-2xs"
              title="Full credential lifecycle management"
            >
              <span>Manage</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <RequireRole allow={["IT_ADMIN", "HR_MANAGER", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                Enterprise Card Directory
              </h1>
              <span className="badge-topic text-[10px]">
                Credential Registry
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Directory of issued physical RFID smart cards, active door access badges, and decommissioned credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isHR && (
              <>
                <Link
                  href="/hr"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                  <span>Pending Queue</span>
                </Link>
                <Link
                  href="/hr/history"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                >
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  <span>Decision History</span>
                </Link>
              </>
            )}

            {isIT && !isHR && (
              <>
                <Link
                  href="/it"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                  <span>Access Matrix</span>
                </Link>
                <Link
                  href="/it/areas"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                >
                  <Key className="h-3.5 w-3.5 text-slate-500" />
                  <span>Security Areas</span>
                </Link>
              </>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <IdCard className="h-3.5 w-3.5" />
              <span>Card Directory ({totalCount})</span>
            </span>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE CREDENTIAL KPI PANEL ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Issued Cards */}
          <div
            onClick={() => setStatusFilter("")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "" ? "border-credential ring-2 ring-credential/15" : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Credentials
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <IdCard className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalCount}</span>
              <span className="text-xs font-medium text-slate-400">issued records</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>All physical smart badge records</span>
            </div>
          </div>

          {/* Active & In-Service */}
          <div
            onClick={() => setStatusFilter(statusFilter === "ACTIVE" ? "" : "ACTIVE")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "ACTIVE"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Badges
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{activeCount}</span>
              <span className="text-xs font-medium text-emerald-600">in active service</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operational at all door turnstiles</span>
            </div>
          </div>

          {/* Suspended / Flagged */}
          <div
            onClick={() => setStatusFilter(statusFilter === "SUSPENDED" ? "" : "SUSPENDED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "SUSPENDED"
                ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Suspended / Flagged
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{suspendedCount}</span>
              <span className="text-xs font-medium text-amber-600">temporarily locked</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700 flex items-center gap-1">
              <span>Lost, damaged, or suspended</span>
            </div>
          </div>

          {/* Revoked / Decommissioned */}
          <div
            onClick={() => setStatusFilter(statusFilter === "REVOKED" ? "" : "REVOKED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "REVOKED"
                ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Revoked / Voided
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-2xs">
                <XCircle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-700">{revokedCount}</span>
              <span className="text-xs font-medium text-red-500">decommissioned</span>
            </div>
            <div className="mt-2 text-[11px] text-red-600 flex items-center gap-1">
              <span>Access permanently terminated</span>
            </div>
          </div>
        </div>

        {/* ─── 2. OMNISEARCH & MULTI-FILTER BAR ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Omnisearch by Serial (e.g. CRD-001), Employee Name, EMP ID, Department..."
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

            {/* Results Count & Clear */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-ink">{filteredContent.length}</strong> of{" "}
                <strong className="text-ink">{totalCount}</strong> credentials
              </span>
              {(statusFilter || searchQuery) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStatusFilter("");
                    setSearchQuery("");
                  }}
                  className="h-7 text-[11px] text-slate-500 hover:text-red-600 gap-1 px-2"
                >
                  <X className="h-3 w-3" />
                  <span>Reset filters</span>
                </Button>
              )}
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1.5 flex-shrink-0">
              Filter Status:
            </span>
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none",
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-paper text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-rule/60"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 3. CREDENTIAL DATA TABLE ─── */}
        <div className="rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            page={filteredData}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            rowHref={(r) => `/it/cards/${r.id}`}
            onPageChange={setPage}
            empty={{
              title: searchQuery || statusFilter ? "No matching credentials found" : "No cards issued yet",
              body:
                searchQuery || statusFilter
                  ? "Try adjusting your search query or status filter to see other credentials."
                  : "Cards appear here automatically once approved employee requests are generated and printed.",
            }}
          />
        </div>

        {/* ─── 4. QUICK CARD INSPECTION DRAWER ─── */}
        <QuickCardDrawer
          cardId={drawerCardId}
          onClose={() => setDrawerCardId(null)}
        />
      </div>
    </RequireRole>
  );
}
