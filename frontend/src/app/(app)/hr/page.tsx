"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { dashboard } from "@/lib/dashboard";
import { AgeingIndicator } from "./_components/AgeingIndicator";
import { useQueue, useBulkApprove, type PendingRequestRow } from "./_hooks/useApprovals";

const AGEING_FILTERS: { label: string; value?: string }[] = [
  { label: "All" },
  { label: "Normal", value: "NORMAL" },
  { label: "Ageing", value: "AGEING" },
  { label: "Overdue", value: "OVERDUE" },
];

type Row = PendingRequestRow & { id: number };

export default function ApprovalQueuePage() {
  const [ageing, setAgeing] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data, isLoading, isError, refetch } = useQueue({ ageing, page });
  const bulkApprove = useBulkApprove();
  const { data: stats } = dashboard.useHr();

  function toggle(requestId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) next.delete(requestId); else next.add(requestId);
      return next;
    });
  }

  function toggleAll() {
    if (!data) return;
    setSelected((prev) =>
      prev.size === data.content.length ? new Set() : new Set(data.content.map((r) => r.requestId)));
  }

  async function onBulkApprove() {
    try {
      const result = await bulkApprove.mutateAsync([...selected]);
      setSelected(new Set());
      if (result.failureCount === 0) {
        toast.success(`Approved ${result.successCount} request${result.successCount === 1 ? "" : "s"}`);
        return;
      }
      const failed = result.outcomes.filter((o) => !o.success);
      toast.error(
        `${result.successCount} approved, ${result.failureCount} failed: ` +
        failed.map((f) => `#${f.requestId} (${f.message})`).join("; ")
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Bulk approve failed");
    }
  }

  const columns: Column<Row>[] = [
    {
      key: "select", header: "", width: "2.5rem",
      render: (r) => (
        <input
          type="checkbox"
          aria-label={`Select ${r.requestNo}`}
          checked={selected.has(r.requestId)}
          onChange={() => toggle(r.requestId)}
        />
      ),
    },
    { key: "requestNo", header: "Request",
      render: (r) => (
        <Link href={`/hr/requests/${r.requestId}`}
              className="identifier text-credential underline-offset-4 hover:underline">
          {r.requestNo}
        </Link>
      ) },
    { key: "employee", header: "Employee",
      render: (r) => (
        <div>
          <div>{r.employeeName}</div>
          <div className="identifier text-xs text-slate">{r.empId}</div>
        </div>
      ) },
    { key: "dept", header: "Department",
      render: (r) => <span className="text-slate">{r.deptName}</span> },
    { key: "type", header: "Type",
      render: (r) => <span className="text-slate">{r.requestType.toLowerCase()}</span> },
    { key: "status", header: "Status",
      render: (r) => <span className="text-slate">{r.status.replaceAll("_", " ").toLowerCase()}</span> },
    { key: "waiting", header: "Waiting", align: "right",
      render: (r) => <AgeingIndicator hours={r.hoursPending} flag={r.ageingFlag} /> },
  ];

  // DataTable keys rows on `id`; the API's identifier is `requestId`.
  const rows = data ? { ...data, content: data.content.map((r) => ({ ...r, id: r.requestId })) } : data;

  return (
    <RequireRole allow={["HR_MANAGER"]}>
      <PageHeader
        title="Approvals"
        description="Verify card requests and record decisions."
      />

      <StatTileRow>
        <StatTile label="Pending" value={stats?.pending ?? 0} href="/hr" />
        <StatTile
          label="Overdue"
          value={stats?.overdue ?? 0}
          tone={stats && stats.overdue > 0 ? "denied" : "neutral"}
          href="/hr"
        />
        <StatTile label="Decided this week" value={stats?.decidedThisWeek ?? 0} href="/hr/history" />
        <StatTile
          label="Avg. turnaround"
          value={stats ? `${stats.avgTurnaroundHours}h` : "—"}
          hint="This month"
        />
      </StatTileRow>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by ageing">
          {AGEING_FILTERS.map((f) => (
            <button
              key={f.label}
              role="tab"
              aria-selected={ageing === f.value}
              onClick={() => { setAgeing(f.value); setPage(0); setSelected(new Set()); }}
              className={`rounded-card px-3 py-1.5 text-sm ${
                ageing === f.value
                  ? "bg-credential/10 font-medium text-credential"
                  : "text-slate hover:bg-paper"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {data && data.content.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-sm text-credential underline-offset-4 hover:underline"
            >
              {selected.size === data.content.length ? "Clear selection" : "Select all"}
            </button>
          )}
          <Button
            onClick={() => void onBulkApprove()}
            disabled={selected.size === 0 || bulkApprove.isPending}
          >
            Approve selected ({selected.size})
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        page={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onPageChange={(p) => { setPage(p); setSelected(new Set()); }}
        empty={{ title: "No pending requests", body: "Requests appear here once employees submit them." }}
      />
    </RequireRole>
  );
}
