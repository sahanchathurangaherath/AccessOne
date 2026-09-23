"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { FullPageSpinner, ErrorState } from "@/components/states";
import { dashboard } from "@/lib/dashboard";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { formatDate, cn } from "@/lib/utils";
import {
  IdCard,
  Plus,
  ShieldCheck,
  Wifi,
  User,
  AlertCircle,
  FileEdit,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  History,
  Info,
  Check,
  FileText,
} from "lucide-react";
import { requests, type CardRequestSummary, type RequestStatus } from "./_hooks/useRequests";

const STEPPER_STAGES: {
  key: string;
  label: string;
  description: string;
  statuses: RequestStatus[];
}[] = [
  { key: "draft", label: "Draft Created", description: "Details saved", statuses: ["DRAFT"] },
  { key: "submitted", label: "Submitted", description: "Sent to HR", statuses: ["SUBMITTED"] },
  { key: "review", label: "HR Verification", description: "Reviewing credentials", statuses: ["UNDER_VERIFICATION"] },
  { key: "approved", label: "Approved & Queued", description: "Print queue", statuses: ["APPROVED"] },
  { key: "active", label: "Badge Active", description: "Ready / Issued", statuses: [] },
];

function getStepIndex(status: RequestStatus, cardStatus: string | null): number {
  if (cardStatus === "ACTIVE") return 4;
  if (status === "APPROVED") return 3;
  if (status === "UNDER_VERIFICATION") return 2;
  if (status === "SUBMITTED") return 1;
  return 0;
}

export default function EmployeePortalPage() {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { data: requestList, isLoading, isError, refetch } = requests.useList({ page: 0 });
  const { data: stats } = dashboard.useEmployee();

  if (isLoading) return <FullPageSpinner />;
  if (isError) {
    return (
      <ErrorState
        body="Could not load your ID badge and request dashboard. Please check your network connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  const allRequests: CardRequestSummary[] = requestList?.content ?? [];

  // Identify the primary active / in-flight request
  const activeRequest = allRequests.find(
    (r) =>
      r.status === "DRAFT" ||
      r.status === "SUBMITTED" ||
      r.status === "UNDER_VERIFICATION" ||
      r.status === "APPROVED" ||
      r.status === "REJECTED"
  ) ?? null;

  // Closed or previous requests for collapsible history
  const historyRequests = allRequests.filter(
    (r) => r.id !== activeRequest?.id
  );

  const hasActiveCard = stats?.cardStatus === "ACTIVE";
  const isDraft = activeRequest?.status === "DRAFT";
  const isPipeline = activeRequest && ["SUBMITTED", "UNDER_VERIFICATION", "APPROVED"].includes(activeRequest.status);
  const isRejected = activeRequest?.status === "REJECTED";
  const currentStep = activeRequest ? getStepIndex(activeRequest.status, stats?.cardStatus ?? null) : -1;

  const displayName = activeRequest?.employeeName ?? user?.username ?? "Employee";
  const displayEmpId = activeRequest?.empId ?? (user?.employeeId ? `EMP-${user.employeeId}` : "EMP-001");
  const displayRole = user?.role ? ROLE_LABEL[user.role] : "Staff Member";

  // Context-aware single primary action in header
  let headerAction = null;
  if (isDraft) {
    headerAction = (
      <Link
        href={`/employee/requests/${activeRequest.id}/edit`}
        className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#173B72] transition-all"
      >
        <FileEdit className="h-4 w-4" />
        <span>Resume Draft & Upload</span>
      </Link>
    );
  } else if (isPipeline) {
    headerAction = (
      <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-semibold text-credential shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
        </span>
        <span>Active Request: <span className="font-bold text-ink">{activeRequest.requestNo}</span></span>
      </div>
    );
  } else if (isRejected) {
    headerAction = (
      <Link
        href={`/employee/requests/${activeRequest.id}/edit`}
        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Edit & Resubmit</span>
      </Link>
    );
  } else {
    headerAction = (
      <Link
        href="/employee/requests/new"
        className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#173B72] transition-all"
      >
        <Plus className="h-4 w-4" />
        <span>{hasActiveCard ? "Request Replacement ID" : "Start Initial ID Application"}</span>
      </Link>
    );
  }

  return (
    <RequireRole allow={["EMPLOYEE", "HR_MANAGER"]}>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Employee ID & Access Dashboard"
          description="Manage your corporate credentials, monitor real-time issuance milestones, and report badge changes."
          actions={headerAction}
        />

        {/* 1. TOP SECTION: Digital ID Card Preview / Active Identity Hub */}
        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          {/* Active Card Preview Visualizer */}
          <div className="lg:col-span-6 xl:col-span-5 rounded-2xl border border-rule bg-surface p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-rule">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-credential border border-blue-100">
                  <IdCard className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink">
                    Physical Smart ID Badge
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                    hasActiveCard
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : stats?.cardStatus === "SUSPENDED"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      hasActiveCard ? "bg-emerald-600 animate-pulse" : "bg-slate-400"
                    )}
                  />
                  {stats?.cardStatus?.replaceAll("_", " ") ?? "NO ACTIVE CARD"}
                </span>
              </div>
            </div>

            {/* Smart Badge Graphic */}
            <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md select-none transition-transform hover:scale-[1.01]">
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#1F4B8E] to-blue-800 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-blue-200" />
                  <span className="identifier text-xs font-bold tracking-[0.2em] text-white">
                    CEYLON METRO
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 rotate-90 text-blue-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    SECURE RFID
                  </span>
                </div>
              </div>

              <div className="flex gap-4 p-4.5">
                {/* Photo */}
                <div className="relative flex-shrink-0 h-28 w-22">
                  {activeRequest?.id ? (
                    <img
                      src={`/api/v1/requests/${activeRequest.id}/photo`}
                      alt={displayName}
                      className="h-28 w-22 rounded-lg border border-slate-200 object-cover shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='112' viewBox='0 0 88 112'%3E%3Crect width='88' height='112' fill='%23f8fafc'/%3E%3Ccircle cx='44' cy='42' r='16' fill='%23cbd5e1'/%3E%3Cpath d='M22 92 C22 68, 66 68, 66 92' fill='%23cbd5e1'/%3E%3Ctext x='50%25' y='104' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' font-weight='700' fill='%2394a3b8'%3EPORTRAIT%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="flex h-28 w-22 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <User className="h-10 w-10 stroke-1" />
                      <span className="mt-1.5 text-[10px] font-bold">PORTRAIT</span>
                    </div>
                  )}
                  {/* EMV Chip */}
                  <div className="absolute bottom-1.5 right-1.5 h-4.5 w-5.5 rounded border border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 shadow-xs flex items-center justify-center">
                    <div className="h-2.5 w-3.5 border border-amber-400/60 rounded-xs" />
                  </div>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate text-base font-bold text-ink leading-tight">
                    {displayName}
                  </p>
                  <p className="truncate text-sm font-semibold text-credential">
                    {displayRole}
                  </p>
                  <div className="pt-2">
                    <span className="identifier rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-200">
                      {displayEmpId}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-xs text-slate-500 font-medium">
                      Door Access: Multi-Zone
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-rule">
              {hasActiveCard ? (
                <>
                  <Link
                    href="/employee/requests/new"
                    className="inline-flex items-center gap-2 rounded-xl border border-rule bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <RefreshCw className="h-4 w-4 text-credential" />
                    Request Replacement / Renewal
                  </Link>
                  <Link
                    href="/employee/requests/new"
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100/60 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Report Lost or Stolen
                  </Link>
                </>
              ) : (
                <div className="flex items-center justify-between w-full text-sm text-slate-500">
                  <span>No active physical badge on record.</span>
                  {!activeRequest && (
                    <Link
                      href="/employee/requests/new"
                      className="font-bold text-credential hover:underline text-sm inline-flex items-center gap-1"
                    >
                      Start Card Request →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Overview / Policy Summary Card */}
          <div className="lg:col-span-6 xl:col-span-7 rounded-2xl border border-rule bg-surface p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2 pb-3 border-b border-rule">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-credential border border-blue-100">
                  <Info className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink">
                  Access & Identity Guidelines
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your AccessOne smart badge grants physical entry to authorized zones across Ceylon Metro headquarters and regional campuses. Keep your card visible at all times within corporate premises.
              </p>
            </div>

            {/* Quick Badges / Feature Cards */}
            <div className="grid gap-3.5 sm:grid-cols-3">
              <div className="rounded-xl border border-rule bg-paper/50 p-3.5">
                <p className="text-xs font-bold uppercase text-slate-400">Card Type</p>
                <p className="mt-1 text-sm font-bold text-ink">Smart RFID CR80</p>
                <p className="text-xs text-slate-500">Contactless 13.56MHz</p>
              </div>

              <div className="rounded-xl border border-rule bg-paper/50 p-3.5">
                <p className="text-xs font-bold uppercase text-slate-400">Lost Card Policy</p>
                <p className="mt-1 text-sm font-bold text-ink">Instant Revoke</p>
                <p className="text-xs text-slate-500">Immediate badge voiding</p>
              </div>

              <div className="rounded-xl border border-rule bg-paper/50 p-3.5">
                <p className="text-xs font-bold uppercase text-slate-400">Turnaround</p>
                <p className="mt-1 text-sm font-bold text-ink">24–48 Hours</p>
                <p className="text-xs text-slate-500">Print queue & dispatch</p>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3.5 text-sm text-slate-700 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-credential shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-credential">Corporate Security Reminder: </span>
                Never share or loan your card. If misplaced, report immediately to deactivate RFID door credentials.
              </div>
            </div>
          </div>
        </div>

        {/* 2. MIDDLE SECTION: Request Stepper & Lifecycle Container */}
        {activeRequest ? (
          <div className="rounded-2xl border border-rule bg-surface p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header of Stepper Container */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="identifier text-sm font-bold text-credential bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    {activeRequest.requestNo}
                  </span>
                  <StatusBadge status={activeRequest.status} />
                  {isDraft && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                      Uncommitted Draft
                    </span>
                  )}
                  {isPipeline && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                      In Review Pipeline
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-lg font-bold text-ink">
                  {isDraft
                    ? `Draft ${activeRequest.requestType} Request Workspace`
                    : `${activeRequest.requestType} ID Card Request Tracker`}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Initiated on {formatDate(activeRequest.createdAt)}
                  {activeRequest.submittedAt && ` · Submitted on ${formatDate(activeRequest.submittedAt)}`}
                </p>
              </div>

              {/* Strict Conditional Action Button */}
              <div className="flex items-center gap-2">
                {isDraft && (
                  <Link
                    href={`/employee/requests/${activeRequest.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-xl bg-credential px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#173B72] transition-all"
                  >
                    <FileEdit className="h-4 w-4" />
                    <span>Edit Draft & Upload</span>
                  </Link>
                )}

                {isPipeline && (
                  <Link
                    href={`/employee/requests/${activeRequest.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-credential px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#173B72] transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>Track In-Progress Request</span>
                  </Link>
                )}

                {isRejected && (
                  <Link
                    href={`/employee/requests/${activeRequest.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Edit & Resubmit</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Rejection Banner */}
            {isRejected && (
              <div className="rounded-xl border border-red-200 bg-red-50/80 p-4.5 text-sm text-red-800 flex items-start gap-3.5 animate-fade-in">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-base font-bold">Revision Required by HR Reviewer</p>
                  <p className="text-sm text-red-700 leading-snug">
                    Your request requires updates before it can be approved. Please edit the draft, check uploaded photos or documents, and resubmit.
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/employee/requests/${activeRequest.id}/edit`}
                      className="inline-flex items-center gap-2 font-semibold text-sm text-red-800 bg-white border border-red-300 px-3.5 py-2 rounded-xl shadow-2xs hover:bg-red-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Edit Details & Resubmit Request
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Compact Connected Milestone Stepper */}
            <div className="space-y-6 pt-2 pb-1">
              <div className="relative">
                {/* Connecting track line */}
                <div className="hidden sm:block absolute top-5 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(Math.min(currentStep, 4) / 4) * 100}%` }}
                  />
                </div>

                {/* 5 Spaced Step Nodes */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-2 relative z-10">
                  {STEPPER_STAGES.map((step, idx) => {
                    const isDone = currentStep > idx;
                    const isCurrent = currentStep === idx;
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center text-center p-2 rounded-xl transition-all"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all bg-white mb-2 shadow-2xs",
                            isDone
                              ? "bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-50"
                              : isCurrent
                              ? "bg-credential text-white shadow-xs ring-4 ring-blue-100"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          )}
                        >
                          {isDone ? <Check className="h-4.5 w-4.5" /> : idx + 1}
                        </div>
                        <p
                          className={cn(
                            "text-sm font-bold leading-tight",
                            isCurrent
                              ? "text-credential font-extrabold"
                              : isDone
                              ? "text-slate-800"
                              : "text-slate-400"
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 leading-snug">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Single-Line Milestone Guidance */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-4.5 py-3 flex items-center justify-between text-sm text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Info className="h-4.5 w-4.5 text-credential shrink-0" />
                  <span>
                    {isDraft
                      ? "Pre-submission mode: Complete your details and attach a photo to send for HR verification."
                      : activeRequest.status === "SUBMITTED"
                      ? "Your card request has been submitted to HR. Verification in progress."
                      : activeRequest.status === "UNDER_VERIFICATION"
                      ? "HR is reviewing your records and identity documents."
                      : activeRequest.status === "APPROVED"
                      ? "Approved by HR. Card is queued for physical printing and RFID flashing."
                      : "Card lifecycle is active."}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                  Step {currentStep + 1} of 5
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty In-Progress State */
          <div className="rounded-2xl border border-dashed border-rule bg-surface p-8 text-center shadow-xs space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-credential">
              <IdCard className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-ink">
              {hasActiveCard ? "No Pending Card Requests" : "Welcome to AccessOne — ID Badge Application"}
            </h3>
            <p className="max-w-md mx-auto text-sm text-slate-500 leading-relaxed">
              {hasActiveCard
                ? "Your corporate RFID badge is active. You can request a replacement or renewal whenever needed."
                : "You do not currently have a smart ID badge. Start your application to provide your photo and details for HR verification."}
            </p>
            <div className="pt-2">
              <Link
                href="/employee/requests/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-credential text-white text-sm font-semibold hover:bg-credential/90 shadow-xs transition-colors"
              >
                <Plus className="h-5 w-5" />
                {hasActiveCard ? "Request Replacement Badge" : "Start Initial ID Application"}
              </Link>
            </div>
          </div>
        )}

        {/* 3. BOTTOM SECTION: Past Request History & Audit Trail */}
        <div className="rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-slate-500" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Past Request History & Audit Trail ({historyRequests.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable record of past issued badges, previous replacements, and closed requests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <span>{historyOpen ? "Hide Audit History" : "View Audit History"}</span>
              {historyOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </button>

          {historyOpen && (
            <div className="border-t border-rule animate-fade-in overflow-x-auto">
              {historyRequests.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No previous closed or archived requests found in audit history.
                </p>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-rule bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Request Reference</th>
                      <th className="py-3 px-4">Application Type</th>
                      <th className="py-3 px-4">Department Unit</th>
                      <th className="py-3 px-4">Submission Date</th>
                      <th className="py-3 px-4">Audit Status</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule text-slate-700">
                    {historyRequests.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400 group-hover:text-credential transition-colors shrink-0" />
                            <span className="identifier text-xs font-bold text-ink">
                              {r.requestNo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200/80">
                            {r.requestType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                          {r.departmentName || "General Staff"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {r.submittedAt ? formatDate(r.submittedAt) : formatDate(r.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <Link
                            href={`/employee/requests/${r.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-credential hover:text-[#173B72] bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/60 px-3 py-1.5 rounded-lg transition-all shadow-2xs"
                          >
                            <span>Inspect Record</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </RequireRole>
  );
}

