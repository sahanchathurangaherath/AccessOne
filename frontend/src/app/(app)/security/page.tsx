"use client";

import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export default function SecurityDashboard() {
  return (
    <RequireRole allow={["SECURITY_OFFICER"]}>
      <PageHeader
        title="Visitors"
        description="Register visitors and issue temporary passes."
      />
      <EmptyState
        title="No visitors on site"
        body="Checked-in visitors will appear here."
      />
    </RequireRole>
  );
}
