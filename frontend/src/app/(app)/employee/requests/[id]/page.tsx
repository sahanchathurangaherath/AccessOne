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
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  User,
  ShieldCheck,
  FileText,
  AlertCircle,
  RefreshCw,
  Cpu,
  Printer,
  CheckCircle2,
  Clock,
  Check,
  Sparkles,
} from "lucide-react";
import { dashboard } from "@/lib/dashboard";
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
  const { data: stats } = dashboard.useEmployee();

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

      {request.status === "REJECTED" && (
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-4.5 text-sm text-red-800 flex items-start gap-3.5 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="text-base font-bold">Request Rejected / Revision Required by HR</p>
            <p className="text-sm text-red-700 leading-snug">
              This request was rejected during verification. You can review your submitted details, update your photo or documents, and resubmit it for HR verification.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <Link
                href={`/employee/requests/${request.id}/edit`}
                className="inline-flex items-center gap-2 font-semibold text-xs text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-xl shadow-2xs transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Edit & Resubmit Request</span>
              </Link>
            </div>
          </div>
        </div>
      )}

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

          {/* Department Processing & Fulfillment Breakdown: Split into IT vs Print */}
          {(request.status === "APPROVED" || stats?.cardStatus) && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-credential" />
                    <span>Department Processing & Fulfillment Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clear separation between IT digital credential encoding and Print physical badge manufacturing
                  </p>
                </div>
                <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-credential border border-blue-200">
                  2 Distinct Department Units
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. IT Department Section */}
                <Card className="border-blue-200 bg-gradient-to-b from-blue-50/30 to-surface shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b border-blue-100 bg-blue-50/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                        <Cpu className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-ink">IT Department</CardTitle>
                        <p className="text-[11px] text-blue-700 font-semibold">Digital Credential Authority</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Digital Ready
                    </span>
                  </CardHeader>
                  <CardContent className="pt-3.5 space-y-3 text-xs">
                    <div className="rounded-xl bg-white p-3 border border-blue-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Department Unit</span>
                        <span className="font-bold text-ink">IT / SecOps Security</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">QR Verification Token</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Cryptographically Signed
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">NFC / RFID Security Keys</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> 13.56 MHz Standard Formatted
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Access Permission Tier</span>
                        <span className="font-bold text-credential">{request.accessLevelName || "Standard Entry"}</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-blue-50/60 p-2.5 border border-blue-100/80 text-[11px] text-blue-900 leading-relaxed">
                      <strong>IT Department Scope:</strong> Responsible for credential signing, door permissions, and electronic encryption keys.
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Print Department Section */}
                <Card className="border-indigo-200 bg-gradient-to-b from-indigo-50/30 to-surface shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b border-indigo-100 bg-indigo-50/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                        <Printer className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-ink">Print Department</CardTitle>
                        <p className="text-[11px] text-indigo-700 font-semibold">Physical Badge Production & QC</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                      <Clock className="h-3 w-3" />
                      {stats?.cardStatus === "ACTIVE" || stats?.cardStatus === "DISPATCHED"
                        ? "Dispatched"
                        : stats?.cardStatus === "PRINTED"
                        ? "Printed (QC Passed)"
                        : "In Print Queue"}
                    </span>
                  </CardHeader>
                  <CardContent className="pt-3.5 space-y-3 text-xs">
                    <div className="rounded-xl bg-white p-3 border border-indigo-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Department Unit</span>
                        <span className="font-bold text-ink">Print Production Facility</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Physical Substrate</span>
                        <span className="font-semibold text-slate-700">Dual-Sided CR80 Thermal PVC</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Production Status</span>
                        <span className="font-bold text-indigo-900">
                          {stats?.cardStatus === "ACTIVE" || stats?.cardStatus === "DISPATCHED"
                            ? "Completed & Dispatched"
                            : stats?.cardStatus === "PRINTED"
                            ? "Thermal Printed & Verified"
                            : "Awaiting Hardware Printer"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Quality Inspection (QC)</span>
                        <span className="font-semibold text-slate-700">Optical Check & Lamination</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-indigo-50/60 p-2.5 border border-indigo-100/80 text-[11px] text-indigo-900 leading-relaxed">
                      <strong>Print Department Scope:</strong> Responsible for physical thermal burning, laminate overlay, QC inspection, and dispatch.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

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
                  render={
                    <Link href={`/employee/requests/${request.id}/edit`}>
                      {request.status === "REJECTED" ? "Edit & Update Request" : "Edit Draft"}
                    </Link>
                  }
                  className="w-full"
                />
              )}

              {request.editable && (
                <Button
                  onClick={() => void onSubmit()}
                  disabled={!request.hasPhoto || submit.isPending}
                  className="w-full"
                >
                  {request.status === "REJECTED" ? "Resubmit Request" : "Submit request"}
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
