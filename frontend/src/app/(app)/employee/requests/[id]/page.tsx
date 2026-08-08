"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DetailHeader } from "@/components/detail-header";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusTimeline } from "@/components/status-timeline";
import { ApiError } from "@/lib/api";
import {
  requests, useSubmitRequest, useWithdrawRequest,
  useUploadDocument, useDeleteDocument, type DocumentType,
} from "../../_hooks/useRequests";

const DOCUMENT_LABEL: Record<DocumentType, string> = {
  PHOTO: "Photo",
  NIC_COPY: "NIC copy",
  APPOINTMENT_LETTER: "Appointment letter",
  POLICE_REPORT: "Police report",
  OTHER: "Other",
};

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const { data: request, isLoading, isError, refetch } = requests.useDetail(id);
  const { data: timeline } = requests.useTimeline(id);

  const submit = useSubmitRequest();
  const withdraw = useWithdrawRequest();
  const deleteRequest = requests.useRemove();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const [docType, setDocType] = useState<DocumentType>("NIC_COPY");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !request) {
    return (
      <ErrorState
        body="This request could not be loaded. It may not exist, or you may not have access to it."
        onRetry={() => void refetch()}
      />
    );
  }

  async function onSubmit() {
    try {
      await submit.mutateAsync(id);
      toast.success("Request submitted");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not submit the request");
    }
  }

  async function onWithdraw() {
    setConfirmWithdraw(false);
    try {
      await withdraw.mutateAsync(id);
      toast.success("Request withdrawn");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not withdraw the request");
    }
  }

  async function onDelete() {
    setConfirmDelete(false);
    try {
      await deleteRequest.mutateAsync(id);
      toast.success("Draft deleted");
      router.push("/employee");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not delete this draft");
    }
  }

  async function onUploadDocument(file: File | null) {
    if (!file) return;
    try {
      await uploadDocument.mutateAsync({ id, file, documentType: docType });
      toast.success("Document uploaded");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not upload the document");
    }
  }

  async function onDeleteDocument(docId: number) {
    try {
      await deleteDocument.mutateAsync({ id, docId });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not remove the document");
    }
  }

  return (
    <RequireRole allow={["EMPLOYEE", "HR_MANAGER"]}>
      <DetailHeader
        identifier={request.requestNo}
        title={`${request.requestType.toLowerCase()} request for ${request.employeeName}`}
        status={request.status}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Employee" value={`${request.employeeName} (${request.empId})`} />
              <Row label="Designation" value={request.designation} />
              <Row label="Department" value={request.departmentName} />
              {request.reason && <Row label="Reason" value={request.reason} />}
              {request.accessLevelName && <Row label="Requested access level" value={request.accessLevelName} />}
              <Row label="Photo" value={request.hasPhoto ? "Attached" : "Not attached"} />
              <Row
                label="Submitted"
                value={request.submittedAt ? new Date(request.submittedAt).toLocaleString() : "—"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supporting documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.documents.length === 0 && (
                <p className="text-sm text-slate">No documents uploaded yet.</p>
              )}
              {request.documents.length > 0 && (
                <ul className="divide-y divide-rule">
                  {request.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <a
                          href={`/api/v1/requests/${id}/documents/${doc.id}/download`}
                          className="font-medium text-credential underline-offset-4 hover:underline"
                        >
                          {doc.fileName}
                        </a>
                        <p className="text-xs text-slate">
                          {doc.documentType.replaceAll("_", " ").toLowerCase()} ·{" "}
                          {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      {request.editable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void onDeleteDocument(doc.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {request.editable && (
                <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
                  <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DOCUMENT_LABEL) as DocumentType[]).map((t) => (
                        <SelectItem key={t} value={t}>{DOCUMENT_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => void onUploadDocument(e.target.files?.[0] ?? null)}
                    className="text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline entries={timeline ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {/* Never derive these from status on the frontend -- the
                  server computes editable/withdrawable/deletable from the
                  same rules the service enforces, so there is one source
                  of truth for what a request may do next. */}
              {request.editable && (
                <Button
                  variant="outline"
                  render={<Link href={`/employee/requests/${request.id}/edit`}>Edit</Link>}
                />
              )}

              {request.editable && (
                <Button
                  onClick={() => void onSubmit()}
                  disabled={!request.hasPhoto || submit.isPending}
                >
                  Submit request
                </Button>
              )}
              {request.editable && !request.hasPhoto && (
                <p className="text-xs text-slate">Attach a photo before you can submit.</p>
              )}

              {request.withdrawable && (
                <Button variant="outline" onClick={() => setConfirmWithdraw(true)}>
                  Withdraw
                </Button>
              )}

              {request.deletable && (
                <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                  Delete draft
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmWithdraw}
        onOpenChange={setConfirmWithdraw}
        title="Withdraw this request?"
        body="This closes the request. You can raise a new one later if you still need a card."
        confirmLabel="Withdraw"
        destructive
        onConfirm={() => void onWithdraw()}
        isPending={withdraw.isPending}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this draft?"
        body="This cannot be undone. Its documents are removed too."
        confirmLabel="Delete"
        destructive
        onConfirm={() => void onDelete()}
        isPending={deleteRequest.isPending}
      />
    </RequireRole>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
