"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { dashboard } from "@/lib/dashboard";
import { requests, type CardRequestSummary, type RequestStatus } from "./_hooks/useRequests";

const FILTERS: { label: string; value?: RequestStatus }[] = [
  { label: "All" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under verification", value: "UNDER_VERIFICATION" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const columns: Column<CardRequestSummary>[] = [
  { key: "requestNo", header: "Request",
    render: (r) => <span className="identifier">{r.requestNo}</span> },
  { key: "type", header: "Type",
    render: (r) => <span className="text-slate">{r.requestType.toLowerCase()}</span> },
  { key: "status", header: "Status",
    render: (r) => <StatusBadge status={r.status} /> },
  { key: "submitted", header: "Submitted",
    render: (r) => (
      <span className="identifier text-slate">
        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
      </span>
    ) },
];

export default function MyRequestsPage() {
  const [status, setStatus] = useState<RequestStatus | undefined>();
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = requests.useList({ status, page });
  const { data: stats } = dashboard.useEmployee();

  return (
    <RequireRole allow={["EMPLOYEE", "HR_MANAGER"]}>
      <PageHeader
        title="My requests"
        description="Raise a card request and follow its progress."
        actions={
          <Button render={<Link href="/employee/requests/new">New request</Link>} />
        }
      />

      <StatTileRow>
        <StatTile label="Card status" value={stats?.cardStatus?.replaceAll("_", " ").toLowerCase() ?? "—"} />
        <StatTile
          label="Requests in progress"
          value={stats?.requestsInProgress ?? 0}
          tone={stats && stats.requestsInProgress > 0 ? "pending" : "neutral"}
        />
      </StatTileRow>

      <div className="mb-4 flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={status === f.value}
            onClick={() => { setStatus(f.value); setPage(0); }}
            className={`rounded-card px-3 py-1.5 text-sm ${
              status === f.value
                ? "bg-credential/10 font-medium text-credential"
                : "text-slate hover:bg-paper"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        rowHref={(r) => `/employee/requests/${r.id}`}
        onPageChange={setPage}
        empty={{
          title: "No requests yet",
          body: "Raise a request when you need a new ID card, or to replace a lost one.",
          action: <Button render={<Link href="/employee/requests/new">New request</Link>} />,
        }}
      />
    </RequireRole>
  );
}
