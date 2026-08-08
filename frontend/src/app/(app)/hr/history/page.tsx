"use client";

import { useState } from "react";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/data-table";
import { useApprovalHistory, type ApprovalHistoryRow } from "../_hooks/useApprovals";

type Row = ApprovalHistoryRow & { id: number };

const columns: Column<Row>[] = [
  { key: "requestNo", header: "Request",
    render: (r) => <span className="identifier">{r.requestNo}</span> },
  { key: "employee", header: "Employee",
    render: (r) => (
      <div>
        <div>{r.employeeName}</div>
        <div className="identifier text-xs text-slate">{r.empId}</div>
      </div>
    ) },
  { key: "decision", header: "Decision",
    render: (r) => <StatusBadge status={r.decision} /> },
  { key: "decidedBy", header: "Decided by",
    render: (r) => <span className="identifier text-slate">{r.decidedBy ?? "—"}</span> },
  { key: "decidedAt", header: "Decided at",
    render: (r) => (
      <span className="identifier text-slate">
        {r.decidedAt ? new Date(r.decidedAt).toLocaleString() : "—"}
      </span>
    ) },
];

export default function ApprovalHistoryPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useApprovalHistory({ page });

  const rows = data ? { ...data, content: data.content.map((r) => ({ ...r, id: r.requestId })) } : data;

  return (
    <RequireRole allow={["HR_MANAGER"]}>
      <PageHeader
        title="Approval history"
        description="Every concluded decision, most recent first."
      />
      <DataTable
        columns={columns}
        page={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onPageChange={setPage}
        empty={{ title: "No decisions yet", body: "Approved and rejected requests appear here." }}
      />
    </RequireRole>
  );
}
