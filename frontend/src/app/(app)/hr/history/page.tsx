"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { useApprovalHistory, type ApprovalHistoryRow } from "../_hooks/useApprovals";
import {
  History,
  ShieldCheck,
  IdCard,
  Search,
  X,
  CheckCircle,
  XCircle,
  BarChart2,
  Eye,
  Calendar,
  UserCheck,
} from "lucide-react";

type Row = ApprovalHistoryRow & { id: number };

const DECISION_FILTERS = [
  { label: "All Decisions", value: "" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Verified", value: "VERIFIED" },
];

export default function ApprovalHistoryPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");

  const { data, isLoading, isError, refetch } = useApprovalHistory({ page });

  const rawRows: Row[] = data ? data.content.map((r) => ({ ...r, id: r.requestId })) : [];

  const filteredContent = useMemo(() => {
    return rawRows.filter((r) => {
      const matchesDecision = !decisionFilter || r.decision === decisionFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.requestNo.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        r.empId.toLowerCase().includes(q) ||
        (r.decidedBy && r.decidedBy.toLowerCase().includes(q));
      return matchesDecision && matchesSearch;
    });
  }, [rawRows, decisionFilter, searchQuery]);

  const filteredRows = data
    ? {
        ...data,
        content: filteredContent,
        totalElements: filteredContent.length,
      }
    : data;

  // Stats calculation
  const totalDecisions = rawRows.length;
  const approvedCount = rawRows.filter((r) => r.decision === "APPROVED").length;
  const rejectedCount = rawRows.filter((r) => r.decision === "REJECTED").length;
  const approvalRate = totalDecisions > 0 ? Math.round((approvedCount / totalDecisions) * 100) : 100;

  const columns: Column<Row>[] = [
    {
      key: "requestNo",
      header: "Request ID",
      render: (r) => (
        <Link
          href={`/hr/requests/${r.requestId}`}
          className="identifier font-semibold text-credential bg-blue-50/70 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors text-xs"
        >
          {r.requestNo}
        </Link>
      ),
    },
    {
      key: "employee",
      header: "Employee & ID",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
            {r.employeeName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-ink text-xs sm:text-sm">{r.employeeName}</div>
            <div className="identifier text-[11px] text-slate-500">{r.empId}</div>
          </div>
        </div>
      ),
    },
    {
      key: "decision",
      header: "Decision Outcome",
      render: (r) => <StatusBadge status={r.decision} />,
    },
    {
      key: "decidedBy",
      header: "Authorized By",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs">
          <UserCheck className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">{r.decidedBy ?? "System"}</span>
        </div>
      ),
    },
    {
      key: "decidedAt",
      header: "Timestamp",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="identifier">
            {r.decidedAt ? formatDate(r.decidedAt) : "—"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "5rem",
      render: (r) => (
        <Link
          href={`/hr/requests/${r.requestId}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rule text-xs font-semibold text-slate-600 hover:text-credential hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Audit</span>
        </Link>
      ),
    },
  ];

  return (
    <RequireRole allow={["HR_MANAGER"]}>
      <div className="space-y-6">
        {/* Top Header & Navigation Switcher */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                HR Decision History & Audit Trail
              </h1>
              <span className="badge-topic text-[10px]">
                Immutable Records
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Complete historical record of all approved, verified, and rejected employee card requests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/hr"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>Approval Queue</span>
            </Link>
            <Link
              href="/hr/history"
              className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs"
            >
              <History className="h-3.5 w-3.5" />
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

        {/* ─── 1. EXECUTIVE HISTORY STATS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Concluded Decisions */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Decisions
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <History className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalDecisions}</span>
              <span className="text-xs font-medium text-slate-400">processed</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Concluded authorization records
            </div>
          </div>

          {/* Approved Cards */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Approved Badges
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{approvedCount}</span>
              <span className="text-xs font-medium text-slate-400">authorized</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-medium">
              Sent to print production
            </div>
          </div>

          {/* Rejected Cards */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rejected / Returned
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-2xs">
                <XCircle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-700">{rejectedCount}</span>
              <span className="text-xs font-medium text-slate-400">rejected</span>
            </div>
            <div className="mt-2 text-[11px] text-red-600 font-medium">
              Revisions requested or denied
            </div>
          </div>

          {/* Approval Rate % */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Approval Success Rate
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shadow-2xs">
                <BarChart2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-700">{approvalRate}%</span>
              <span className="text-xs font-medium text-slate-400">efficiency</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Overall request approval ratio
            </div>
          </div>
        </div>

        {/* ─── 2. OMNISEARCH & FILTER BAR ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Live Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by request #, employee name, EMP ID, or reviewer..."
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

            {/* Decision Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {DECISION_FILTERS.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setDecisionFilter(d.value)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                    decisionFilter === d.value
                      ? "bg-credential text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Showing {filteredContent.length} historical records</span>
            <button
              onClick={() => void refetch()}
              className="text-credential hover:underline font-medium"
            >
              Refresh Logs
            </button>
          </div>
        </div>

        {/* ─── 3. DATA TABLE ─── */}
        <DataTable
          columns={columns}
          page={filteredRows}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          onPageChange={setPage}
          empty={{
            title: "No decision records found",
            body: "No historical authorization records match your active search and filters.",
          }}
        />
      </div>
    </RequireRole>
  );
}

