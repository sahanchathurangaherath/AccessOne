"use client";

import { useState } from "react";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { cards, type CardSummary } from "../_hooks/useCards";

type Row = CardSummary;

export default function CardsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = cards.useList({ page, size: 20, sort: "createdAt,desc" });

  const columns: Column<Row>[] = [
    { key: "cardSerial", header: "Serial", render: (r) => <span className="identifier">{r.cardSerial}</span> },
    { key: "employeeName", header: "Employee", render: (r) => `${r.employeeName} (${r.empId})` },
    { key: "departmentName", header: "Department", render: (r) => r.departmentName },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "issueDate", header: "Issued", render: (r) => new Date(r.issueDate).toLocaleDateString() },
  ];

  return (
    <RequireRole allow={["IT_ADMIN", "HR_MANAGER"]}>
      <PageHeader
        title="Cards"
        description="Every card generated once a request is approved -- its credentials, status and history."
      />

      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        rowHref={(r) => `/it/cards/${r.id}`}
        onPageChange={setPage}
        empty={{ title: "No cards yet", body: "Cards appear here once an approved request generates one." }}
      />
    </RequireRole>
  );
}
