"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { ArrowLeft, FileEdit, RefreshCw } from "lucide-react";
import { requests } from "../../../_hooks/useRequests";
import { RequestForm } from "../../../_components/RequestForm";

export default function EditRequestPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: request, isLoading, isError, refetch } = requests.useDetail(id);

  const isRejected = request?.status === "REJECTED";

  return (
    <RequireRole allow={["EMPLOYEE"]}>
      <div className="space-y-4">
        <Link
          href={`/employee/requests/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-credential transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Request Details</span>
        </Link>

        <PageHeader
          title={isRejected ? "Edit & Resubmit Request" : "Edit Card Request"}
          description={
            isRejected
              ? "Update details, upload a revised portrait photo, or address the revision notes requested by HR before resubmitting."
              : "Update draft details, reason, or photo. Once you submit the request for verification, these details are locked."
          }
          actions={
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-2xs ${
                isRejected
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50/80 text-amber-800"
              }`}
            >
              {isRejected ? <RefreshCw className="h-3.5 w-3.5" /> : <FileEdit className="h-3.5 w-3.5" />}
              <span>{isRejected ? "Revision Required" : "Editing Draft"}</span>
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
            body="Only a draft or a rejected request can be edited. This request is currently locked in verification or processing."
          />
        )}
        {request && request.editable && <RequestForm existing={request} />}
      </div>
    </RequireRole>
  );
}

