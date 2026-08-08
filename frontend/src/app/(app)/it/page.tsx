"use client";

import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export default function ItDashboard() {
  return (
    <RequireRole allow={["IT_ADMIN"]}>
      <PageHeader
        title="Configuration"
        description="Manage departments, areas and access levels."
      />
      <EmptyState
        title="Nothing configured yet"
        body="Departments, areas and access levels will appear here."
      />
    </RequireRole>
  );
}
