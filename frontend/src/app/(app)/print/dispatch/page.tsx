"use client";

import { useState } from "react";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useDispatchList, type DispatchRow } from "../_hooks/usePrint";

export default function DispatchListPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useDispatchList(page, 20);

  const columns: Column<DispatchRow>[] = [
    { key: "jobNo", header: "Job", render: (d) => <span className="identifier">{d.jobNo}</span> },
    { key: "cardSerial", header: "Card", render: (d) => <span className="identifier">{d.cardSerial}</span> },
    { key: "employeeName", header: "Employee", render: (d) => d.employeeName },
    { key: "dispatchMethod", header: "Method", render: (d) => d.dispatchMethod.replaceAll("_", " ").toLowerCase() },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
  ];

  return (
    <RequireRole allow={["PRINT_SUPERVISOR"]}>
      <PageHeader
        title="Dispatch"
        description="Cards on their way to the people they were issued to. Handover is what activates a card."
      />

      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        rowHref={(d) => `/print/dispatch/${d.id}`}
        onPageChange={setPage}
        empty={{ title: "Nothing dispatched yet", body: "Cards sent from the print queue appear here." }}
      />
    </RequireRole>
  );
}
