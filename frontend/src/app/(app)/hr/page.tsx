"use client";

import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export default function HrDashboard() {
  return (
    <RequireRole allow={["HR_MANAGER"]}>
      <PageHeader
        title="Approvals"
        description="Verify card requests and record decisions."
      />
      <EmptyState
        title="No pending requests"
        body="Requests appear here once employees submit them."
      />
    </RequireRole>
  );
}
