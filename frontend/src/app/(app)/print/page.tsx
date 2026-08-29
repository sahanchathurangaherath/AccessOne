"use client";

import { useState } from "react";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { dashboard } from "@/lib/dashboard";
import { printJobs, type PrintJobRow } from "./_hooks/usePrint";

function waitingSince(queuedAt: string) {
  const ms = Date.now() - new Date(queuedAt).getTime();
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return "under an hour";
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function PrintQueuePage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = printJobs.useList({ page, size: 20, sort: "queuedAt,asc" });
  const { data: stats } = dashboard.usePrint();

  const columns: Column<PrintJobRow>[] = [
    { key: "jobNo", header: "Job",
      render: (j) => (
        <span className="flex items-center gap-2">
          <span className="identifier">{j.jobNo}</span>
          {j.jobType === "REPRINT" && (
            <span className="rounded-card border border-pending/30 bg-pending/10
                             px-1.5 py-0.5 text-[10px] font-medium text-pending">
              reprint
            </span>
          )}
        </span>
      ) },
    { key: "cardSerial", header: "Card", render: (j) => <span className="identifier">{j.cardSerial}</span> },
    { key: "employeeName", header: "Employee", render: (j) => `${j.employeeName} (${j.empId})` },
    { key: "status", header: "Status", render: (j) => <StatusBadge status={j.status} /> },
    { key: "waiting", header: "Waiting", render: (j) => waitingSince(j.queuedAt) },
  ];

  return (
    <RequireRole allow={["PRINT_SUPERVISOR"]}>
      <PageHeader
        title="Production"
        description="Run the print queue, quality checks and dispatch."
      />

      <StatTileRow>
        <StatTile label="Queued" value={stats?.queued ?? 0} />
        <StatTile label="In progress" value={stats?.inProgress ?? 0} />
        <StatTile label="Printed today" value={stats?.printedToday ?? 0} />
        <StatTile label="Reprint rate" value={stats ? `${stats.reprintRatePct}%` : "—"} href="/print/reports" />
      </StatTileRow>

      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        rowHref={(j) => `/print/jobs/${j.id}`}
        onPageChange={setPage}
        empty={{ title: "Print queue is empty", body: "Cards queued for printing will appear here." }}
      />
    </RequireRole>
  );
}
