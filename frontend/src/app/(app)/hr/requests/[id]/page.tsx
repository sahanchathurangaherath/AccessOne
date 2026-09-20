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
import { Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  approvals, useVerify, useApprove, useReject, useComment,
  useDeleteComment, useRemovePendingRequest,
} from "../../_hooks/useApprovals";

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
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Designation" value={approval.designation} />
              <Row label="Department" value={approval.deptName} />
              {approval.rejectionReason && <Row label="Rejection reason" value={approval.rejectionReason} />}
              <Row label="Verified by" value={approval.verifiedBy ? `${approval.verifiedBy} · ${fmt(approval.verifiedAt)}` : "—"} />
              <Row label="Decided by" value={approval.decidedBy ? `${approval.decidedBy} · ${fmt(approval.decidedAt)}` : "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {approval.documents.length === 0 && (
                <p className="text-sm text-slate">No documents attached to this request.</p>
              )}
              {approval.documents.length > 0 && (
                <ul className="divide-y divide-rule text-sm">
                  {approval.documents.map((d) => (
                    <li key={d.id} className="flex justify-between py-2">
                      <a
                        href={`/api/v1/requests/${requestId}/documents/${d.id}/download`}
                        className="text-credential underline-offset-4 hover:underline"
                      >
                        {d.fileName}
                      </a>
                      <p className="text-xs text-slate">
                        {d.documentType.replaceAll("_", " ").toLowerCase()} ·{" "}
                        {(d.fileSizeBytes / 1024).toFixed(0)} KB
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {approval.comments.length === 0 && (
                <p className="text-sm text-slate">No comments yet.</p>
              )}
              {approval.comments.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 border-b border-rule pb-2 text-sm last:border-0">
                  <div className="flex-1">
                    <p>{c.text}</p>
                    <p className="identifier text-xs text-slate">
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
                  placeholder="Add a note for the record"
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

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <StatusTimeline entries={timeline ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Decision & Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {/* Never derive these from the decision string on the
                  frontend -- canVerify/canDecide come from the same
                  Decision.canTransitionTo the service enforces with. */}
              {approval.canVerify && (
                <Button onClick={() => setConfirmVerify(true)} disabled={verify.isPending}>
                  Verify
                </Button>
              )}

              {approval.canDecide && !showReject && (
                <>
                  <Button
                    onClick={() => setConfirmApprove(true)}
                    disabled={approve.isPending || !approval.employeeStillActive}
                  >
                    Approve
                  </Button>
                  <Button variant="outline" onClick={() => setShowReject(true)}>
                    Reject
                  </Button>
                </>
              )}

              {approval.canDecide && showReject && (
                <div className="space-y-2">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Say what needs to be corrected"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => void onReject()}
                      disabled={!rejectReason.trim() || reject.isPending}
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
                <p className="text-sm text-slate">This decision is concluded.</p>
              )}
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
