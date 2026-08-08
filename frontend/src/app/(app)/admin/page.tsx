"use client";

import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export default function AdminDashboard() {
  return (
    <RequireRole allow={["SYSTEM_ADMIN"]}>
      <PageHeader
        title="Administration"
        description="System-wide configuration, users and the audit trail."
      />
      <EmptyState
        title="Nothing to review"
        body="System activity and administrative tools will appear here."
      />
    </RequireRole>
  );
}
