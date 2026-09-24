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
  ArrowLeft,
  Briefcase,
  Building2,
  User,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";
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
    <RequireRole allow={["EMPLOYEE"]}>
      <div className="mb-4">
        <Link
          href="/employee"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Requests
        </Link>
      </div>

      <DetailHeader
        identifier={request.requestNo}
        title={`${request.requestType.toLowerCase()} request for ${request.employeeName}`}
        status={request.status}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Structured 2x2 Employment & Request Details Grid */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Request & Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <User className="h-3.5 w-3.5 text-credential" />
                    <span>Employee Identity</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{request.employeeName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 identifier font-semibold">{request.empId}</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Briefcase className="h-3.5 w-3.5 text-credential" />
                    <span>Designation & Role</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{request.designation || "—"}</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Building2 className="h-3.5 w-3.5 text-credential" />
                    <span>Department</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{request.departmentName || "—"}</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-credential" />
                    <span>Requested Access Level</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{request.accessLevelName || "Standard Entry"}</p>
                </div>
              </div>

              {(request.reason || request.submittedAt) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {request.reason && (
                    <div className="rounded-xl border border-rule bg-paper/40 p-3 text-xs text-slate-600 sm:col-span-2">
                      <span className="font-bold text-slate-700 block mb-0.5">Request Reason / Purpose:</span>
                      {request.reason}
                    </div>
                  )}
                  {request.submittedAt && (
                    <div className="text-xs text-slate-500">
                      Submitted on: <span className="font-semibold text-ink">{new Date(request.submittedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supporting Documents Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-credential" />
                <CardTitle className="text-base font-bold text-ink">Supporting Documents</CardTitle>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {request.documents.length} uploaded
              </span>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {request.documents.length === 0 && (
                <p className="text-sm text-slate-400">No documents uploaded yet.</p>
              )}
              {request.documents.length > 0 && (
                <ul className="divide-y divide-rule">
                  {request.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <a
                          href={`/api/v1/requests/${id}/documents/${doc.id}/download`}
                          className="font-medium text-credential underline-offset-4 hover:underline"
                        >
                          {doc.fileName}
                        </a>
                        <p className="text-xs text-slate-500">
                          {doc.documentType.replaceAll("_", " ").toLowerCase()} ·{" "}
                          {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      {request.editable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-600 transition-colors"
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
        </div>

        {/* Right Column: Actions + CR80 Physical Smart Badge Preview + Lifecycle Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-2.5">
              {request.editable && (
                <Button
                  variant="outline"
                  render={<Link href={`/employee/requests/${request.id}/edit`}>Edit</Link>}
                  className="w-full"
                />
              )}

              {request.editable && (
                <Button
                  onClick={() => void onSubmit()}
                  disabled={!request.hasPhoto || submit.isPending}
                  className="w-full"
                >
                  Submit request
                </Button>
              )}
              {request.editable && !request.hasPhoto && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg p-2 border border-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Attach a portrait photo before you can submit.</span>
                </div>
              )}

              {request.withdrawable && (
                <Button variant="outline" onClick={() => setConfirmWithdraw(true)} className="w-full">
                  Withdraw Request
                </Button>
              )}

              {request.deletable && (
                <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="w-full">
                  Delete Draft
                </Button>
              )}

              {!request.editable && !request.withdrawable && !request.deletable && (
                <p className="text-sm text-slate-500 text-center py-1">No pending actions required.</p>
              )}
            </CardContent>
          </Card>

          {/* Lifecycle Timeline Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Request Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StatusTimeline entries={timeline ?? []} />
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
