"use client";

import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export default function PrintDashboard() {
  return (
    <RequireRole allow={["PRINT_SUPERVISOR"]}>
      <PageHeader
        title="Production"
        description="Run the print queue, quality checks and dispatch."
      />
      <EmptyState
        title="Print queue is empty"
        body="Cards queued for printing will appear here."
      />
    </RequireRole>
  );
}
