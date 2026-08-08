"use client";

import { useParams } from "next/navigation";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { requests } from "../../../_hooks/useRequests";
import { RequestForm } from "../../../_components/RequestForm";

export default function EditRequestPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: request, isLoading, isError, refetch } = requests.useDetail(id);

  return (
    <RequireRole allow={["EMPLOYEE", "HR_MANAGER"]}>
      <PageHeader
        title="Edit request"
        description="Only a draft can be edited. Submitting locks these details in."
      />

      {isLoading && <FullPageSpinner />}
      {isError && (
        <ErrorState body="This request could not be loaded." onRetry={() => void refetch()} />
      )}
      {request && !request.editable && (
        <ErrorState
          title="This request can no longer be edited"
          body="Only a draft can be changed. This request has already been submitted."
        />
      )}
      {request && request.editable && <RequestForm existing={request} />}
    </RequireRole>
  );
}
