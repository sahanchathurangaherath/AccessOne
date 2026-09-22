"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import {
  X,
  ExternalLink,
  ShieldCheck,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Building2,
  FileText,
  BadgeCheck,
  Check,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  approvals,
  useVerify,
  useApprove,
  useReject,
  useComment,
} from "../_hooks/useApprovals";

interface QuickReviewDrawerProps {
  requestId: number | null;
  onClose: () => void;
  onDecisionMade?: () => void;
}

export function QuickReviewDrawer({
  requestId,
  onClose,
  onDecisionMade,
}: QuickReviewDrawerProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [commentText, setCommentText] = useState("");

  const {
    data: approval,
    isLoading,
    isError,
    refetch,
  } = approvals.useDetail(requestId ?? 0);

  const verify = useVerify();
  const approve = useApprove();
  const reject = useReject();
  const comment = useComment();

  if (!requestId) return null;

  const busy =
    verify.isPending || approve.isPending || reject.isPending || comment.isPending;

  async function handleVerify() {
    if (!requestId) return;
    try {
      await verify.mutateAsync(requestId);
      toast.success("Request verified successfully");
      void refetch();
      onDecisionMade?.();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.problem.detail : "Could not verify request"
      );
    }
  }

  async function handleApprove() {
    if (!requestId) return;
    try {
      await approve.mutateAsync(requestId);
      toast.success(`Request ${approval?.requestNo ?? ""} approved and sent to print queue`);
      onDecisionMade?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.problem.detail : "Could not approve request"
      );
    }
  }

  async function handleReject() {
    if (!requestId) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      await reject.mutateAsync({ id: requestId, reason: rejectReason.trim() });
      toast.success(`Request ${approval?.requestNo ?? ""} rejected`);
      setRejectMode(false);
      setRejectReason("");
      onDecisionMade?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.problem.detail : "Could not reject request"
      );
    }
  }

  async function handleAddComment() {
    if (!requestId || !commentText.trim()) return;
    try {
      await comment.mutateAsync({ id: requestId, body: { text: commentText.trim() } });
      toast.success("Comment added");
      setCommentText("");
      void refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.problem.detail : "Could not add comment"
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-xl bg-surface border-l border-rule shadow-2xl flex flex-col justify-between animate-slide-in-right">
          {/* 1. Header */}
          <div className="p-5 sm:p-6 border-b border-rule bg-slate-50/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="identifier text-xs font-bold text-credential bg-blue-100/80 px-2.5 py-0.5 rounded-md border border-blue-200">
                  {approval?.requestNo ?? `REQ-${requestId}`}
                </span>
                {approval && <StatusBadge status={approval.decision} />}
              </div>
              <h2 className="topic-title-lg text-ink">Quick Review & Authorization</h2>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/hr/requests/${requestId}`}
                className="p-2 rounded-xl text-slate-500 hover:text-credential hover:bg-white border border-transparent hover:border-rule transition-colors"
                title="Open full page view"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-ink hover:bg-white border border-transparent hover:border-rule transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 2. Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-credential" />
                <p className="text-xs font-medium text-slate-500">Loading request credentials...</p>
              </div>
            )}

            {isError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Failed to load request details</p>
                  <p className="mt-1 text-slate-600">Please check your network and try again.</p>
                </div>
              </div>
            )}

            {approval && (
              <>
                {/* Employment Status Alert if inactive */}
                {!approval.employeeStillActive && (
                  <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-start gap-2.5 animate-fade-in shadow-xs">
                    <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Former Employee Record Detected</p>
                      <p className="mt-0.5 text-red-700 font-normal">
                        This employee is marked as inactive in HR directory records. Reject this card request.
                      </p>
                    </div>
                  </div>
                )}

                {/* Employee Directory Profile Card */}
                <div className="rounded-2xl border border-rule bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <BadgeCheck className="h-4 w-4 text-credential" />
                      <span>Employee Directory Identity</span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        approval.employeeStillActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {approval.employeeStillActive ? "ACTIVE STAFF" : "INACTIVE / RESIGNED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400">Full Name</span>
                      <p className="font-bold text-ink">{approval.employeeName}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Employee ID</span>
                      <p className="identifier font-semibold text-slate-700">{approval.empId}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Department</span>
                      <p className="font-medium text-slate-700 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {approval.deptName}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Designation</span>
                      <p className="font-medium text-slate-700">{approval.designation}</p>
                    </div>
                  </div>
                </div>

                {/* CR80 Smart Badge & Biometric Preview */}
                <div className="rounded-2xl border border-rule bg-white p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-credential" />
                      Card Mockup & Portrait Check
                    </span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-credential">
                      CR80 RFID Smart Badge
                    </span>
                  </div>

                  {/* Badge visual */}
                  <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md select-none">
                    <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#1F4B8E] to-blue-800 px-3.5 py-2 text-white">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
                        <span className="identifier text-[9px] font-bold tracking-[0.2em] text-white">
                          ACCESSONE ID
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
                          src={`/api/v1/requests/${approval.requestId}/photo`}
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

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-xs font-bold text-ink leading-tight">
                          {approval.employeeName}
                        </p>
                        <p className="truncate text-[11px] font-semibold text-credential">
                          {approval.designation}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {approval.deptName}
                        </p>
                        <div className="pt-2">
                          <span className="identifier rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {approval.empId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supporting Documents */}
                {approval.documents && approval.documents.length > 0 && (
                  <div className="rounded-2xl border border-rule bg-white p-4 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-slate-500" />
                      Attached Documents ({approval.documents.length})
                    </span>
                    <div className="space-y-1.5">
                      {approval.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-3.5 w-3.5 text-credential shrink-0" />
                            <span className="truncate font-medium text-slate-700">
                              {doc.fileName || doc.documentType}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification History */}
                {(approval.verifiedBy || approval.decidedBy) && (
                  <div className="rounded-2xl border border-rule bg-slate-50/70 p-4 space-y-2 text-xs">
                    <span className="font-bold text-slate-700">Audit Stamp</span>
                    <div className="space-y-1 text-slate-600">
                      {approval.verifiedBy && (
                        <p>
                          Verified by <strong className="text-ink">{approval.verifiedBy}</strong> on{" "}
                          {formatDate(approval.verifiedAt ?? "")}
                        </p>
                      )}
                      {approval.decidedBy && (
                        <p>
                          Decided by <strong className="text-ink">{approval.decidedBy}</strong> on{" "}
                          {formatDate(approval.decidedAt ?? "")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Internal Reviewer Comments Trail */}
                <div className="rounded-2xl border border-rule bg-white p-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-500" />
                    Reviewer Notes & Audit Trail
                  </span>

                  <div className="space-y-2">
                    {approval.comments && approval.comments.length > 0 ? (
                      approval.comments.map((c) => (
                        <div key={c.id} className="rounded-xl bg-slate-50 p-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-slate-700">{c.commentedBy}</span>
                            <span>{formatDate(c.commentedAt)}</span>
                          </div>
                          <p className="text-slate-700 leading-snug">{c.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add an internal note..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleAddComment();
                      }}
                      className="flex-1 rounded-xl border border-rule px-3 py-1.5 text-xs outline-none focus:border-credential"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || busy}
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3. Sticky Action Footer */}
          {approval && (
            <div className="p-4 sm:p-5 border-t border-rule bg-white/95 backdrop-blur-md shadow-lg space-y-3">
              {rejectMode ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      Reason for Rejection / Revision Request *
                    </label>
                    <button
                      onClick={() => setRejectMode(false)}
                      className="text-xs text-slate-400 hover:text-ink cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <Textarea
                    placeholder="Provide specific instructions for the employee or reason for denial..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-20 text-xs rounded-xl"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRejectMode(false)}
                      className="text-xs rounded-xl"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || busy}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl"
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {approval.canVerify && (
                      <Button
                        onClick={handleVerify}
                        disabled={busy}
                        variant="outline"
                        className="rounded-xl text-xs font-semibold border-rule gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                        Verify Record
                      </Button>
                    )}

                    {approval.canDecide && (
                      <Button
                        onClick={() => setRejectMode(true)}
                        disabled={busy}
                        variant="outline"
                        className="rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 hover:border-red-200 border-rule gap-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    )}
                  </div>

                  {approval.canDecide && (
                    <Button
                      onClick={handleApprove}
                      disabled={busy || !approval.employeeStillActive}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs gap-1.5 px-5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve & Queue Print
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
