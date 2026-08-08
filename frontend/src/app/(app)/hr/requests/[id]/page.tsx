"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DetailHeader } from "@/components/detail-header";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusTimeline } from "@/components/status-timeline";
import { ApiError } from "@/lib/api";
import {
  approvals, useVerify, useApprove, useReject, useComment,
} from "../../_hooks/useApprovals";

export default function ApprovalDecisionPage() {
  const params = useParams<{ id: string }>();
  const requestId = Number(params.id);

  const { data: approval, isLoading, isError, refetch } = approvals.useDetail(requestId);
  const { data: timeline } = approvals.useTimeline(requestId);

  const verify = useVerify();
  const approve = useApprove();
  const reject = useReject();
  const comment = useComment();

  const [confirmVerify, setConfirmVerify] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
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
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not add the comment");
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
            <CardHeader><CardTitle>Supporting documents</CardTitle></CardHeader>
            <CardContent>
              {approval.documents.length === 0 && (
                <p className="text-sm text-slate">No documents uploaded.</p>
              )}
              {approval.documents.length > 0 && (
                <ul className="divide-y divide-rule">
                  {approval.documents.map((doc) => (
                    <li key={doc.id} className="py-2 text-sm">
                      <a
                        href={`/api/v1/requests/${requestId}/documents/${doc.id}/download`}
                        className="font-medium text-credential underline-offset-4 hover:underline"
                      >
                        {doc.fileName}
                      </a>
                      <p className="text-xs text-slate">
                        {doc.documentType.replaceAll("_", " ").toLowerCase()} ·{" "}
                        {(doc.fileSizeBytes / 1024).toFixed(0)} KB
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
                <div key={c.id} className="border-b border-rule pb-2 text-sm last:border-0">
                  <p>{c.text}</p>
                  <p className="identifier text-xs text-slate">
                    {c.commentedBy} · {fmt(c.commentedAt)}
                  </p>
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
            <CardHeader><CardTitle>Decision</CardTitle></CardHeader>
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

              {!approval.canVerify && !approval.canDecide && (
                <p className="text-sm text-slate">This decision is concluded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
