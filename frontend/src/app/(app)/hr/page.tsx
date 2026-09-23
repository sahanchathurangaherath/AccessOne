"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { dashboard } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { AgeingIndicator } from "./_components/AgeingIndicator";
import { QuickReviewDrawer } from "./_components/QuickReviewDrawer";
import { useQueue, useBulkApprove, type PendingRequestRow } from "./_hooks/useApprovals";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Timer,
  CheckCheck,
  Search,
  History,
  Eye,
  CheckCircle2,
  X,
  ShieldCheck,
  IdCard,
} from "lucide-react";

const AGEING_FILTERS: { label: string; value?: string }[] = [
  { label: "All Ageing" },
  { label: "Normal (<24h)", value: "NORMAL" },
  { label: "Ageing (24-48h)", value: "AGEING" },
  { label: "Overdue (>48h)", value: "OVERDUE" },
];

const CARD_TYPE_FILTERS = [
  { label: "All Types", value: "" },
  { label: "New Card", value: "NEW" },
  { label: "Replacement", value: "REPLACEMENT" },
  { label: "Renewal", value: "RENEWAL" },
];

type Row = PendingRequestRow & { id: number };

export default function ApprovalQueuePage() {
  const [ageing, setAgeing] = useState<string | undefined>();
  const [cardTypeFilter, setCardTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawerRequestId, setDrawerRequestId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQueue({ ageing, page });
  const bulkApprove = useBulkApprove();
  const { data: stats } = dashboard.useHr();

  function toggle(requestId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  }

  function toggleAll() {
    if (!filteredRows) return;
    setSelected((prev) =>
      prev.size === filteredRows.content.length
        ? new Set()
        : new Set(filteredRows.content.map((r) => r.requestId))
    );
  }

  async function onBulkApprove() {
    try {
      const result = await bulkApprove.mutateAsync([...selected]);
      setSelected(new Set());
      if (result.failureCount === 0) {
        toast.success(
          `Approved ${result.successCount} request${result.successCount === 1 ? "" : "s"}`
        );
        void refetch();
        return;
      }
      const failed = result.outcomes.filter((o) => !o.success);
      toast.error(
        `${result.successCount} approved, ${result.failureCount} failed: ` +
          failed.map((f) => `#${f.requestId} (${f.message})`).join("; ")
      );
      void refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.problem.detail : "Bulk approve failed"
      );
    }
  }

  // Filter queue rows by live search query and card type
  const filteredContent = useMemo(() => {
    const rawRows: Row[] = data ? data.content.map((r) => ({ ...r, id: r.requestId })) : [];
    return rawRows.filter((r) => {
      const matchesType = !cardTypeFilter || r.requestType.toUpperCase() === cardTypeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.requestNo.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        r.empId.toLowerCase().includes(q) ||
        r.deptName.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [data, cardTypeFilter, searchQuery]);

  const filteredRows = data
    ? {
        ...data,
        content: filteredContent,
        totalElements: filteredContent.length,
      }
    : data;

  const columns: Column<Row>[] = [
    {
      key: "select",
      header: "",
      width: "2.5rem",
      render: (r) => (
        <input
          type="checkbox"
          aria-label={`Select ${r.requestNo}`}
          checked={selected.has(r.requestId)}
          onChange={() => toggle(r.requestId)}
          className="h-4 w-4 rounded border-rule text-credential focus:ring-credential/20 cursor-pointer"
        />
      ),
    },
    {
      key: "requestNo",
      header: "Request ID",
      render: (r) => (
        <button
          onClick={() => setDrawerRequestId(r.requestId)}
          className="identifier font-semibold text-credential bg-blue-50/70 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors text-xs cursor-pointer text-left"
        >
          {r.requestNo}
        </button>
      ),
    },
    {
      key: "employee",
      header: "Employee & Identity",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl border border-rule bg-slate-100 flex items-center justify-center shadow-2xs">
            <span className="text-[11px] font-bold text-slate-600 select-none">
              {r.employeeName.slice(0, 2).toUpperCase()}
            </span>
            <img
              src={`/api/v1/requests/${r.requestId}/photo`}
              alt={r.employeeName}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div>
            <div className="font-semibold text-ink text-xs sm:text-sm">{r.employeeName}</div>
            <div className="identifier text-[11px] text-slate-500">{r.empId}</div>
          </div>
        </div>
      ),
    },
    {
      key: "dept",
      header: "Department",
      render: (r) => (
        <div>
          <span className="text-slate-700 font-medium text-xs">{r.deptName}</span>
          <div className="text-[11px] text-slate-400">{r.designation}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Card Type",
      render: (r) => {
        const type = r.requestType.toUpperCase();
        return (
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              type === "NEW"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : type === "REPLACEMENT"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            )}
          >
            {type}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "waiting",
      header: "Ageing / Queue SLA",
      align: "right",
      render: (r) => <AgeingIndicator hours={r.hoursPending} flag={r.ageingFlag} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "6rem",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDrawerRequestId(r.requestId)}
            className="h-8 px-2.5 text-xs font-semibold rounded-xl border-rule text-slate-700 hover:text-credential hover:border-credential/40 hover:bg-blue-50/50 shadow-2xs gap-1 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-credential" />
            <span>Review</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RequireRole allow={["HR_MANAGER"]}>
      <div className="space-y-6">
        {/* Top Header & Mode Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                HR Verification & Authorization Center
              </h1>
              <span className="badge-topic text-[10px]">
                HRIS Portal
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Verify employee directory credentials, review biometrics, and authorize physical smart badge printing.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/hr"
              className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Pending Queue ({stats?.pending ?? 0})</span>
            </Link>
            <Link
              href="/hr/history"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <History className="h-3.5 w-3.5 text-slate-500" />
              <span>Decision History</span>
            </Link>
            <Link
              href="/it/cards"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <IdCard className="h-3.5 w-3.5 text-slate-500" />
              <span>Card Directory</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE KPI & SLA OVERVIEW PANEL ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pending Verification */}
          <div
            onClick={() => setAgeing(undefined)}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              !ageing ? "border-credential ring-2 ring-credential/15" : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Verification
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{stats?.pending ?? 0}</span>
              <span className="text-xs font-medium text-slate-400">in queue</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Awaiting HR authorization</span>
            </div>
          </div>

          {/* Overdue / SLA Breached */}
          <div
            onClick={() => setAgeing(ageing === "OVERDUE" ? undefined : "OVERDUE")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              ageing === "OVERDUE"
                ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/30"
                : (stats?.overdue ?? 0) > 0
                ? "border-red-200"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                SLA Breach (&gt;48h)
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-2xs">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-700">{stats?.overdue ?? 0}</span>
              <span className="text-xs font-medium text-slate-400">overdue</span>
            </div>
            <div className="mt-2 text-[11px] text-red-600 font-semibold">
              {(stats?.overdue ?? 0) > 0
                ? "Requires immediate action"
                : "Zero SLA breaches"}
            </div>
          </div>

          {/* Decided This Week */}
          <Link
            href="/hr/history"
            className="rounded-2xl border border-rule bg-surface p-5 shadow-xs hover:shadow-md transition-all select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Decided This Week
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {stats?.decidedThisWeek ?? 0}
              </span>
              <span className="text-xs font-medium text-slate-400">cards approved</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-medium">
              View historical logs →
            </div>
          </Link>

          {/* Avg Turnaround Time */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Avg. Turnaround
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <Timer className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-credential">
                {stats ? `${stats.avgTurnaroundHours}h` : "—"}
              </span>
              <span className="text-xs font-medium text-slate-400">target: &lt;24h</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Benchmark for this calendar month
            </div>
          </div>
        </div>

        {/* ─── 2. OMNISEARCH & MULTI-FILTER BAR ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Live Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee name, EMP ID, or REQ#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-rule bg-slate-50/60 focus:bg-white focus:border-credential outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Card Type Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {CARD_TYPE_FILTERS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setCardTypeFilter(t.value)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                    cardTypeFilter === t.value
                      ? "bg-credential text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ageing SLA Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">SLA Filter:</span>
              {AGEING_FILTERS.map((f) => (
                <button
                  key={f.label}
                  role="tab"
                  aria-selected={ageing === f.value}
                  onClick={() => {
                    setAgeing(f.value);
                    setPage(0);
                    setSelected(new Set());
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                    ageing === f.value
                      ? "bg-slate-800 text-white shadow-2xs font-semibold"
                      : "text-slate-500 hover:bg-slate-100 hover:text-ink"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-400">
              Showing {filteredContent.length} active requests in view
            </span>
          </div>
        </div>

        {/* ─── 4. DATA TABLE ─── */}
        <DataTable
          columns={columns}
          page={filteredRows}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          onPageChange={(p) => {
            setPage(p);
            setSelected(new Set());
          }}
          empty={{
            title: "No pending requests matching filters",
            body: "All matching employee card requests have been processed or no results found.",
          }}
        />

        {/* ─── 5. FLOATING BATCH ACTION TOOLBAR ─── */}
        {selected.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in-right border border-slate-700">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{selected.size} request{selected.size === 1 ? "" : "s"} selected</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer px-2"
              >
                {selected.size === (filteredRows?.content.length ?? 0) ? "Deselect All" : "Select All"}
              </button>

              <Button
                onClick={() => void onBulkApprove()}
                disabled={bulkApprove.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-4 py-2 h-auto shadow-xs gap-1.5"
              >
                <CheckCheck className="h-4 w-4" />
                Bulk Approve ({selected.size})
              </Button>
            </div>
          </div>
        )}

        {/* ─── 6. SIDE QUICK-REVIEW DRAWER ─── */}
        <QuickReviewDrawer
          requestId={drawerRequestId}
          onClose={() => setDrawerRequestId(null)}
          onDecisionMade={() => {
            void refetch();
          }}
        />
      </div>
    </RequireRole>
  );
}

