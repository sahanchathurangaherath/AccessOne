"use client";

import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { RequestForm } from "../../_components/RequestForm";

export default function NewRequestPage() {
  return (
    <RequireRole allow={["EMPLOYEE", "HR_MANAGER"]}>
      <PageHeader
        title="New card request"
        description="This starts as a draft. Nothing is sent until you submit it."
      />
      <RequestForm />
    </RequireRole>
  );
}
