"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { ArrowLeft, FileEdit } from "lucide-react";
import { requests } from "../../../_hooks/useRequests";
import { RequestForm } from "../../../_components/RequestForm";

export default function EditRequestPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: request, isLoading, isError, refetch } = requests.useDetail(id);

  return (
    <RequireRole allow={["EMPLOYEE", "HR_MANAGER"]}>
      <div className="space-y-4">
        <Link
          href={`/employee/requests/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-credential transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Request Details</span>
        </Link>

        <PageHeader
          title="Edit Card Request"
          description="Update draft details, reason, or photo. Once you submit the request for verification, these details are locked."
          actions={
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs font-semibold text-amber-800 shadow-2xs">
              <FileEdit className="h-3.5 w-3.5" />
              <span>Editing Draft</span>
            </div>
          }
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
      </div>
    </RequireRole>
  );
}

