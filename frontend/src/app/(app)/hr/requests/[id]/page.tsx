"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DetailHeader } from "@/components/detail-header";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusTimeline } from "@/components/status-timeline";
import {
  Trash2,
  Building2,
  Briefcase,
  UserCheck,
  ShieldCheck,
  IdCard,
  Wifi,
  CheckCircle2,
  FileText,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  approvals, useVerify, useApprove, useReject, useComment,
  useDeleteComment, useRemovePendingRequest,
} from "../../_hooks/useApprovals";
import { AiGatekeeperCard } from "@/components/ai/AiGatekeeperCard";

export default function ApprovalDecisionPage() {
  const params = useParams<{ id: string }>();
  const requestId = Number(params.id);
  const router = useRouter();

  const { data: approval, isLoading, isError, refetch } = approvals.useDetail(requestId);
  const { data: timeline } = approvals.useTimeline(requestId);

  const verify = useVerify();
  const approve = useApprove();
  const reject = useReject();
  const comment = useComment();
  const deleteComment = useDeleteComment();
  const removePendingRequest = useRemovePendingRequest();

  const [confirmVerify, setConfirmVerify] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [commentText, setCommentText] = useState("");

  if (isLoading) return <FullPageSpinner />;
  if (isError || !approval) {
    return (
      <ErrorState
        body="This approval could not be loaded."
        onRetry={() => void refetch()}
      />
    );
  }

  async function onVerify() {
    setConfirmVerify(false);
    try {
      await verify.mutateAsync(requestId);
      toast.success("Request verified");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not verify the request");
    }
  }

  async function onApprove() {
    setConfirmApprove(false);
    try {
      await approve.mutateAsync(requestId);
      toast.success("Request approved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not approve the request");
    }
  }

  async function onReject() {
    try {
      await reject.mutateAsync({ id: requestId, reason: rejectReason });
      toast.success("Request rejected");
      setShowReject(false);
      setRejectReason("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not reject the request");
    }
  }

  async function onComment() {
    if (!commentText.trim()) return;
    try {
      await comment.mutateAsync({ id: requestId, body: { text: commentText.trim() } });
      setCommentText("");
      toast.success("Comment added");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not add the comment");
    }
  }

  async function onDeleteComment(commentId: number) {
    try {
      await deleteComment.mutateAsync({ requestId, commentId });
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not delete comment");
    }
  }

  async function onRemoveDuplicate() {
    setConfirmRemove(false);
    try {
      await removePendingRequest.mutateAsync({ requestId, reason: "Duplicate or incorrectly raised request removed by HR" });
      toast.success("Pending request removed from queue");
      router.push("/hr");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not remove request");
    }
  }

  return (
    <RequireRole allow={["HR_MANAGER"]}>
      <div className="mb-4">
        <Link
          href="/hr"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Approval Queue
        </Link>
      </div>

      <DetailHeader
        identifier={approval.requestNo}
        title={`${approval.employeeName} (${approval.empId})`}
        status={approval.decision}
      />

      {!approval.employeeStillActive && (
        <div role="alert" className="mb-4 rounded-card border border-denied/30 bg-denied/5 px-3 py-2 text-sm text-denied">
          This employee has left. Reject the request instead of approving it.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* AI Gatekeeper Autonomous Triage & HITL Approval */}
          <AiGatekeeperCard
            requestId={requestId}
            onOneClickApprove={async () => {
              if (approval.canVerify) {
                try {
                  await verify.mutateAsync(requestId);
                } catch {
                  // continue
                }
              }
              await onApprove();
            }}
            isApproving={approve.isPending || verify.isPending}
          />

          {/* Structured 2x2 Employment & Verification Details Grid */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Employment & Review Data</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Briefcase className="h-3.5 w-3.5 text-credential" />
                    <span>Designation & Role</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{approval.designation || "—"}</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Building2 className="h-3.5 w-3.5 text-credential" />
                    <span>Department Unit</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{approval.deptName || "—"}</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                    <span>HR Record Verification</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {approval.verifiedBy ? (
                      <>
                        <span className="font-bold">{approval.verifiedBy}</span>
                        <span className="text-xs text-slate-500 block">{fmt(approval.verifiedAt)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Pending Verification</span>
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                    <span>Final Decision Status</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {approval.decidedBy ? (
                      <>
                        <span className="font-bold">{approval.decidedBy}</span>
                        <span className="text-xs text-slate-500 block">{fmt(approval.decidedAt)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Awaiting Decision</span>
                    )}
                  </p>
                </div>
              </div>

              {approval.rejectionReason && (
                <div className="rounded-xl border border-denied/30 bg-denied/5 p-3.5 text-sm text-denied">
                  <span className="font-bold block text-xs uppercase tracking-wider mb-1">Rejection Reason</span>
                  {approval.rejectionReason}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-credential" />
                <CardTitle className="text-base font-bold text-ink">Supporting Documents</CardTitle>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {approval.documents.length} attached
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {approval.documents.length === 0 && (
                <p className="text-sm text-slate-400">No documents attached to this request.</p>
              )}
              {approval.documents.length > 0 && (
                <ul className="divide-y divide-rule text-sm">
                  {approval.documents.map((d) => (
                    <li key={d.id} className="flex justify-between items-center py-2.5">
                      <a
                        href={`/api/v1/requests/${requestId}/documents/${d.id}/download`}
                        className="font-medium text-credential underline-offset-4 hover:underline"
                      >
                        {d.fileName}
                      </a>
                      <p className="text-xs text-slate-500">
                        {d.documentType.replaceAll("_", " ").toLowerCase()} ·{" "}
                        {(d.fileSizeBytes / 1024).toFixed(0)} KB
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Comments Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-credential" />
                <CardTitle className="text-base font-bold text-ink">Audit Notes & Comments</CardTitle>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {approval.comments.length} notes
              </span>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {approval.comments.length === 0 && (
                <p className="text-sm text-slate-400">No comments yet on this request.</p>
              )}
              {approval.comments.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 border-b border-rule pb-2.5 text-sm last:border-0">
                  <div className="flex-1">
                    <p className="text-ink font-medium">{c.text}</p>
                    <p className="identifier text-xs text-slate-500 mt-0.5">
                      {c.commentedBy} · {fmt(c.commentedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete comment added in error"
                    onClick={() => void onDeleteComment(c.id)}
                    disabled={deleteComment.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add an internal HR note or review audit remark..."
                  className="flex-1"
                />
                <Button
                  onClick={() => void onComment()}
                  disabled={!commentText.trim() || comment.isPending}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Decision Actions + CR80 Smart Badge Preview + Audit Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Decision & Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-2.5">
              {approval.canVerify && (
                <Button onClick={() => setConfirmVerify(true)} disabled={verify.isPending} className="w-full">
                  Verify Record
                </Button>
              )}

              {approval.canDecide && !showReject && (
                <>
                  <Button
                    onClick={() => setConfirmApprove(true)}
                    disabled={approve.isPending || !approval.employeeStillActive}
                    className="w-full"
                  >
                    Approve & Queue for Printing
                  </Button>
                  <Button variant="outline" onClick={() => setShowReject(true)} className="w-full">
                    Reject Request
                  </Button>
                </>
              )}

              {approval.canDecide && showReject && (
                <div className="space-y-2 pt-1">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Specify the reason for rejection (e.g. invalid photo, mismatched department)"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => void onReject()}
                      disabled={!rejectReason.trim() || reject.isPending}
                      className="flex-1"
                    >
                      Confirm rejection
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowReject(false); setRejectReason(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {(approval.canVerify || approval.canDecide) && (
                <Button
                  variant="ghost"
                  className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
                  onClick={() => setConfirmRemove(true)}
                  disabled={removePendingRequest.isPending}
                >
                  Remove / Cancel Request
                </Button>
              )}

              {!approval.canVerify && !approval.canDecide && (
                <p className="text-sm text-slate-500 text-center py-1">This decision workflow is concluded.</p>
              )}
            </CardContent>
          </Card>

          {/* Physical CR80 Smart Badge & Portrait Mockup Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <IdCard className="h-4 w-4 text-credential" />
                  Physical Badge Preview
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-credential">
                  CR80 RFID
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md select-none">
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#1F4B8E] to-blue-800 px-3.5 py-2 text-white">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
                    <span className="identifier text-[9.5px] font-extrabold tracking-[0.25em] text-white uppercase">
                      ACCESSONE
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wifi className="h-3 w-3 rotate-90 text-blue-200" />
                    <span className="text-[8px] font-semibold uppercase tracking-wider text-blue-100">
                      SMART PASS
                    </span>
                  </div>
                </div>

                <div className="flex gap-3.5 p-3.5">
                  <div className="relative flex-shrink-0 h-24 w-20">
                    <img
                      src={`/api/v1/requests/${requestId}/photo`}
                      alt={approval.employeeName}
                      className="h-24 w-20 rounded-lg border border-slate-200 object-cover shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='96' viewBox='0 0 80 96'%3E%3Crect width='80' height='96' fill='%23f8fafc'/%3E%3Ccircle cx='40' cy='36' r='14' fill='%23cbd5e1'/%3E%3Cpath d='M20 78 C20 58, 60 58, 60 78' fill='%23cbd5e1'/%3E%3Ctext x='50%25' y='88' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='8' font-weight='700' fill='%2394a3b8'%3EPHOTO%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="absolute bottom-1.5 right-1.5 h-4 w-5 rounded border border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 shadow-xs flex items-center justify-center">
                      <div className="h-2 w-3 border border-amber-400/60 rounded-xs" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                    <p className="truncate text-[13px] font-black text-slate-950 leading-tight">
                      {approval.employeeName}
                    </p>
                    <p className="truncate text-[11px] font-bold text-credential">
                      {approval.designation}
                    </p>
                    <p className="truncate text-[10px] text-slate-500 font-medium">
                      {approval.deptName}
                    </p>
                    <div className="pt-1.5">
                      <p className="font-mono text-xs font-black text-slate-900 tracking-wider">
                        {approval.empId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-paper/80 p-2.5 text-xs text-slate-600 border border-rule">
                <CheckCircle2 className="h-4 w-4 text-credential shrink-0" />
                <span>Verify portrait clarity before issuing approval for card encoding.</span>
              </div>
            </CardContent>
          </Card>

          {/* Audit Timeline Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Lifecycle Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StatusTimeline entries={timeline ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove this pending request?"
        body="This cancels and removes the duplicate or incorrectly raised request from the active queue."
        confirmLabel="Remove Request"
        destructive
        onConfirm={() => void onRemoveDuplicate()}
        isPending={removePendingRequest.isPending}
      />

      <ConfirmDialog
        open={confirmVerify}
        onOpenChange={setConfirmVerify}
        title="Verify this request?"
        body="Confirms the employee record checks out. This does not approve the card -- it unlocks the decision step."
        confirmLabel="Verify"
        onConfirm={() => void onVerify()}
        isPending={verify.isPending}
      />

      <ConfirmDialog
        open={confirmApprove}
        onOpenChange={setConfirmApprove}
        title="Approve this request?"
        body="The employee's card request will be approved and queued for card generation."
        confirmLabel="Approve"
        onConfirm={() => void onApprove()}
        isPending={approve.isPending}
      />
    </RequireRole>
  );
}

function fmt(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
