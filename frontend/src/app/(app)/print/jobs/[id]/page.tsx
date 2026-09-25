"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import {
  printJobs,
  useStart,
  useComplete,
  useQc,
  useReprint,
  useCancel,
  useOpenDispatch,
} from "../../_hooks/usePrint";
import {
  ArrowLeft,
  Printer,
  Cpu,
  User,
  Building2,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Truck,
  Sparkles,
  ShieldCheck,
  Ban,
  Layers,
  FileCheck,
  Send,
  Download,
  FileDown,
  Wifi,
} from "lucide-react";

const DISPATCH_METHOD_LABEL: Record<string, string> = {
  COLLECTION: "Direct Front-Desk Collection",
  INTERNAL_MAIL: "Internal Corporate Mail",
  COURIER: "Secured Registered Courier",
};

const COMMON_PRINTERS = [
  "Zebra ZXP Series 7 (Line 01)",
  "Fargo HDP5000 High-Security (Line 02)",
  "Magicard Rio Pro 360 (Line 03)",
  "Evolis Primacy 2 Dual-Sided (Line 04)",
];

const CANCELLABLE = new Set(["QUEUED", "IN_PROGRESS"]);

export default function PrintJobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = Number(params.id);

  const { data: job, isLoading, isError, refetch } = printJobs.useDetail(jobId);

  const start = useStart();
  const complete = useComplete();
  const qc = useQc();
  const reprint = useReprint();
  const cancel = useCancel();
  const openDispatch = useOpenDispatch();

  const [printerName, setPrinterName] = useState("");
  const [qcNotes, setQcNotes] = useState("");
  const [showFail, setShowFail] = useState(false);
  const [confirmPass, setConfirmPass] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [showDispatch, setShowDispatch] = useState(false);
  const [dispatchMethod, setDispatchMethod] = useState("COLLECTION");

  if (isLoading) return <FullPageSpinner />;
  if (isError || !job) {
    return (
      <div className="p-6">
        <ErrorState
          title="Print job not found"
          body="This card production job could not be retrieved from the print server."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  async function run(action: () => Promise<unknown>, ok: string, fail: string) {
    try {
      await action();
      toast.success(ok);
      void refetch();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail ?? fail : "Cannot reach the print server");
    }
  }

  // Determine active stage in progress stepper
  const getStageIndex = (status: string, qcResult: string) => {
    if (status === "CANCELLED") return -1;
    if (status === "QUEUED") return 0;
    if (status === "IN_PROGRESS") return 1;
    if (status === "PRINTED" && qcResult === "PENDING") return 2;
    if (status === "PRINTED" && qcResult === "PASS") return 3;
    if (status === "QC_FAILED") return 2;
    if (status === "COMPLETED" || job.dispatchable) return 4;
    return 2;
  };

  const currentStageIndex = getStageIndex(job.status, job.qcResult);

  const STEPS = [
    { label: "Queued", desc: "Awaiting Printer" },
    { label: "Production", desc: "Thermal Burning" },
    { label: "Printed", desc: "Awaiting QC" },
    { label: "QC Passed", desc: "Physical Inspection" },
    { label: "Dispatch Ready", desc: "Courier Manifest" },
  ];

  return (
    <RequireRole allow={["PRINT_SUPERVISOR", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/print"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rule bg-surface text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">{job.jobNo}</span>
                <StatusBadge status={job.status} />
                {job.jobType === "REPRINT" ? (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    <RotateCcw className="h-3 w-3" /> Reprint Order
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                    Initial Issue
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold tracking-tight text-ink mt-0.5">
                {job.employeeName}
                <span className="text-sm font-normal text-slate-400 ml-2">({job.empId})</span>
                <span className="text-sm font-mono text-slate-500 ml-2">&bull; {job.cardSerial}</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-xl border border-rule bg-surface px-3 py-1.5 text-xs text-slate-600 font-medium shadow-2xs">
              Department: <strong className="text-ink">{job.departmentName}</strong>
            </div>

            <a
              href={`/api/v1/print/jobs/${job.id}/card-file`}
              download={`${job.cardSerial}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Download Print File (PDF)</span>
            </a>
          </div>
        </div>

        {/* ─── 1. PRODUCTION STAGE PROGRESS STEPPER ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
          <div className="grid grid-cols-5 gap-2 relative">
            {STEPS.map((step, idx) => {
              const isPassed = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;
              const isFailed = job.status === "QC_FAILED" && idx === 2;

              return (
                <div key={step.label} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all mb-2",
                      isPassed
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isFailed
                        ? "bg-rose-600 text-white shadow-xs"
                        : isCurrent
                        ? "bg-credential text-white ring-4 ring-credential/20 shadow-xs"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isFailed ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      isCurrent || isPassed ? "text-ink" : "text-slate-400"
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 2. MAIN PRODUCTION CONTENT: 2-COLUMN LAYOUT ─── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2 Cols): Physical Card Mockup & Job Metadata */}
          <div className="space-y-6 lg:col-span-2">
            {/* PHYSICAL SMART CARD BADGE MOCKUP */}
            <div className="surface-panel p-6 rounded-2xl border border-rule bg-surface shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rule/60">
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-credential" />
                    <span>Physical CR80 Smart Badge Layout Preview</span>
                  </h3>
                  <p className="text-xs text-slate">
                    Live visual rendering of the physical ID badge and embedded security credentials
                  </p>
                </div>
                <a
                  href={`/api/v1/print/jobs/${job.id}/card-file`}
                  download={`${job.cardSerial}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-paper px-3.5 py-2 text-xs font-semibold text-ink hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
                >
                  <FileDown className="h-4 w-4 text-credential" />
                  <span>Download Card PDF</span>
                </a>
              </div>

              {/* Realistic CR80 ID Card Visualizer */}
              <div className="flex justify-center py-2">
                <div
                  className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md select-none transition-transform duration-300 hover:scale-[1.01]"
                  style={{ width: "348px", height: "220px" }}
                >
                  {/* Top Header Ribbon */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#1F4B8E] to-blue-800 px-4 py-2.5 text-white shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-blue-200" />
                      <span className="identifier text-[10px] font-extrabold tracking-[0.25em] text-white">
                        ACCESSONE
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3.5 w-3.5 rotate-90 text-blue-200" />
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-blue-100">
                        SMART PASS
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex gap-3.5 p-3.5">
                    {/* Employee Photo */}
                    <div className="relative flex-shrink-0 h-[104px] w-[82px]">
                      <img
                        src={`/api/v1/cards/${job.cardId}/photo`}
                        alt={job.employeeName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='100' viewBox='0 0 80 100'%3E%3Crect width='80' height='100' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%2394a3b8'%3EPHOTO%3C/text%3E%3C/svg%3E";
                        }}
                        className="h-[104px] w-[82px] rounded-lg border border-slate-200 object-cover shadow-xs"
                      />
                      {/* Smart EMV Chip simulation */}
                      <div className="absolute bottom-1 right-1 h-5 w-6 rounded border border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 shadow-xs flex items-center justify-center">
                        <div className="h-3 w-4 border border-amber-400/70 rounded-[2px]" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1 pt-0.5" style={{ maxWidth: "140px" }}>
                      <p className="truncate text-[15px] font-black text-slate-950 tracking-tight leading-tight">
                        {job.employeeName}
                      </p>
                      {job.designation ? (
                        <p className="truncate text-[11.5px] font-bold text-[#1F4B8E] leading-tight">
                          {job.designation}
                        </p>
                      ) : null}
                      <p className="truncate text-[10.5px] text-slate-500 font-medium">
                        {job.departmentName}
                      </p>
                      <div className="pt-1.5">
                        <p className="font-mono text-[13px] font-black text-slate-900 tracking-wider">
                          {job.empId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Scaled 96px QR Code (Bottom-Right) */}
                  <div className="absolute bottom-2 right-2.5 flex flex-col items-center">
                    <img
                      src={`/api/v1/cards/${job.cardId}/qr?size=240`}
                      alt="QR Code"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f8fafc'/%3E%3Crect x='12' y='12' width='24' height='24' fill='%231e293b'/%3E%3Crect x='60' y='12' width='24' height='24' fill='%231e293b'/%3E%3Crect x='12' y='60' width='24' height='24' fill='%231e293b'/%3E%3C/svg%3E";
                      }}
                      className="h-[96px] w-[96px] rounded-lg border border-slate-300 bg-white p-1 shadow-xs"
                    />
                    <span className="text-[7.5px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                      VERIFY SCAN
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3.5 flex items-center gap-2">
                    <p className="identifier font-mono text-[9.5px] font-bold tracking-wider text-slate-500">
                      {job.cardSerial}
                    </p>
                    <StatusBadge status={job.status} className="scale-90 origin-left" />
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCTION & QUALITY SPECIFICATIONS */}
            <Card className="rounded-2xl border-rule bg-surface shadow-xs">
              <CardHeader className="border-b border-rule/60 pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-credential" />
                  <span>Production Timestamps & Quality Inspection Log</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Queued for Production
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{new Date(job.queuedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Printed & Laminated At
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <Printer className="h-4 w-4 text-slate-400" />
                      <span>{job.printedAt ? new Date(job.printedAt).toLocaleString() : "Not printed yet"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Assigned Thermal Printer
                    </span>
                    <p className="font-semibold text-ink font-mono text-xs">
                      {job.printerName || "Unassigned"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Quality Control (QC) Result
                    </span>
                    <div className="flex items-center gap-2">
                      {job.qcResult === "PASS" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Passed Inspection
                        </span>
                      ) : job.qcResult === "FAIL" ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="h-3.5 w-3.5" /> QC Failed / Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded">
                          <Clock className="h-3.5 w-3.5" /> Pending QC
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {job.qcNotes && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                      QC Defect Notes
                    </span>
                    <p className="text-xs text-rose-950 leading-relaxed">{job.qcNotes}</p>
                  </div>
                )}

                {job.cancelledReason && (
                  <div className="rounded-xl bg-slate-100 border border-slate-300 p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Job Cancellation Reason
                    </span>
                    <p className="text-xs text-slate-900 leading-relaxed">{job.cancelledReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col): Production & QC Action Console */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-rule bg-surface shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-rule/60 pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <Printer className="h-4 w-4 text-credential" />
                  <span>Production Console</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* 1. START PRINTING (QUEUED) */}
                {job.status === "QUEUED" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Select Production Printer Station</label>
                      <select
                        value={printerName}
                        onChange={(e) => setPrinterName(e.target.value)}
                        className="w-full h-10 rounded-xl border border-rule bg-paper px-3 text-xs text-ink focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20"
                      >
                        <option value="">-- Choose Printer Station --</option>
                        {COMMON_PRINTERS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Or Type Custom Printer Name</label>
                      <Input
                        placeholder="e.g. Printer-Floor2-01"
                        value={printerName}
                        onChange={(e) => setPrinterName(e.target.value)}
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <Button
                      className="w-full rounded-xl bg-credential text-white hover:bg-credential/90 font-semibold text-xs h-10 gap-2 shadow-xs"
                      disabled={!printerName.trim() || start.isPending}
                      onClick={() =>
                        void run(
                          () => start.mutateAsync({ id: jobId, body: { printerName: printerName.trim() } }),
                          "Print job started on hardware",
                          "Could not start the job"
                        )
                      }
                    >
                      <Printer className="h-4 w-4" />
                      <span>Start Printing Now</span>
                    </Button>
                  </div>
                )}

                {/* 2. MARK PRINTED (IN_PROGRESS) */}
                {job.status === "IN_PROGRESS" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      Card is currently burning on printer <strong>{job.printerName}</strong>.
                    </p>
                    <Button
                      className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-10 gap-2 shadow-xs"
                      disabled={complete.isPending}
                      onClick={() => setConfirmComplete(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Card Printed & Ejected</span>
                    </Button>
                  </div>
                )}

                {/* 3. QUALITY CHECK (PRINTED) */}
                {job.status === "PRINTED" && !showFail && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Physical Inspection Stage
                    </span>
                    <Button
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 gap-2 shadow-xs"
                      disabled={qc.isPending}
                      onClick={() => setConfirmPass(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Pass Quality Inspection</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs h-10 gap-2"
                      onClick={() => setShowFail(true)}
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject / Fail Quality Check</span>
                    </Button>
                  </div>
                )}

                {/* FAIL QC FORM */}
                {job.status === "PRINTED" && showFail && (
                  <div className="space-y-2 rounded-xl bg-rose-50/60 border border-rose-200 p-3">
                    <label className="text-xs font-bold text-rose-900">Specify Defect / Rejection Reason</label>
                    <Textarea
                      value={qcNotes}
                      onChange={(e) => setQcNotes(e.target.value)}
                      placeholder="e.g. Hologram misaligned, portrait smudged, RFID chip defective..."
                      className="rounded-xl min-h-20 text-xs bg-white"
                    />
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl text-xs font-semibold flex-1"
                        disabled={!qcNotes.trim() || qc.isPending}
                        onClick={() =>
                          void run(
                            async () => {
                              await qc.mutateAsync({ id: jobId, body: { result: "FAIL", notes: qcNotes.trim() } });
                              setShowFail(false);
                              setQcNotes("");
                            },
                            "Quality check recorded as failed",
                            "Could not record QC failure"
                          )
                        }
                      >
                        Confirm Rejection
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-xs"
                        onClick={() => {
                          setShowFail(false);
                          setQcNotes("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* 4. REPRINT JOB (QC_FAILED) */}
                {job.status === "QC_FAILED" && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-rose-700">
                      This job failed inspection. Create a reprint order to issue a replacement card immediately.
                    </p>
                    <Button
                      className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-10 gap-2 shadow-xs"
                      disabled={reprint.isPending}
                      onClick={() =>
                        void run(
                          async () => {
                            const created = await reprint.mutateAsync({ id: jobId });
                            router.push(`/print/jobs/${created.id}`);
                          },
                          "Reprint order created successfully",
                          "Could not create reprint job"
                        )
                      }
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Generate Reprint Order</span>
                    </Button>
                  </div>
                )}

                {/* 5. SEND TO DISPATCH (DISPATCHABLE) */}
                {job.dispatchable && (
                  <div className="space-y-3 pt-2 border-t border-rule/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Courier & Delivery Routing
                    </span>

                    {!showDispatch ? (
                      <Button
                        className="w-full rounded-xl bg-credential text-white hover:bg-credential/90 font-semibold text-xs h-10 gap-2 shadow-xs"
                        onClick={() => setShowDispatch(true)}
                      >
                        <Truck className="h-4 w-4" />
                        <span>Send to Dispatch Manifest</span>
                      </Button>
                    ) : (
                      <div className="space-y-2 rounded-xl bg-blue-50/60 border border-blue-200 p-3">
                        <label className="text-xs font-bold text-blue-950">Select Dispatch Channel</label>
                        <Select value={dispatchMethod} onValueChange={(v) => setDispatchMethod(v ?? "COLLECTION")}>
                          <SelectTrigger className="w-full rounded-xl bg-white text-xs h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {Object.entries(DISPATCH_METHOD_LABEL).map(([value, label]) => (
                              <SelectItem key={value} value={value} className="text-xs">
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="rounded-xl bg-credential text-white hover:bg-credential/90 text-xs font-semibold flex-1"
                            disabled={openDispatch.isPending}
                            onClick={() =>
                              void run(
                                async () => {
                                  const record = await openDispatch.mutateAsync({ printJobId: jobId, dispatchMethod });
                                  router.push(`/print/dispatch/${record.id}`);
                                },
                                "Dispatch manifest opened",
                                "Could not open dispatch record"
                              )
                            }
                          >
                            <Send className="h-3.5 w-3.5 mr-1" />
                            <span>Confirm Manifest</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-xs"
                            onClick={() => setShowDispatch(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. CANCEL JOB */}
                {CANCELLABLE.has(job.status) && (
                  <div className="pt-2 border-t border-rule/60">
                    {!showCancel ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs gap-1.5 h-9"
                        onClick={() => setShowCancel(true)}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>Cancel Production Job</span>
                      </Button>
                    ) : (
                      <div className="space-y-2 rounded-xl bg-rose-50/60 border border-rose-200 p-3">
                        <label className="text-xs font-bold text-rose-900">Reason for Cancellation</label>
                        <Textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="State why this print job is being cancelled..."
                          className="rounded-xl min-h-16 text-xs bg-white"
                        />
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl text-xs font-semibold flex-1"
                            disabled={!cancelReason.trim() || cancel.isPending}
                            onClick={() =>
                              void run(
                                async () => {
                                  await cancel.mutateAsync({ id: jobId, body: { reason: cancelReason.trim() } });
                                  setShowCancel(false);
                                  setCancelReason("");
                                },
                                "Job successfully cancelled",
                                "Could not cancel the job"
                              )
                            }
                          >
                            Confirm Cancel
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-xs"
                            onClick={() => {
                              setShowCancel(false);
                              setCancelReason("");
                            }}
                          >
                            Go Back
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Production Note */}
            <div className="rounded-2xl border border-rule bg-slate-50/70 p-4 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-ink flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-credential" />
                Physical Production Standard:
              </span>
              <p className="text-slate-500 leading-relaxed">
                All RFID credentials undergo optical OCR and contactless antenna checks before being dispatched to cardholders.
              </p>
            </div>
          </div>
        </div>

        {/* ─── CONFIRM DIALOGS ─── */}
        <ConfirmDialog
          open={confirmComplete}
          onOpenChange={setConfirmComplete}
          title="Mark Card Printed"
          body="Confirms that the physical smart card has finished thermal printing and lamination, advancing to Quality Inspection."
          confirmLabel="Mark Printed"
          isPending={complete.isPending}
          onConfirm={() => {
            setConfirmComplete(false);
            void run(() => complete.mutateAsync(jobId), "Card marked printed", "Could not complete printing");
          }}
        />

        <ConfirmDialog
          open={confirmPass}
          onOpenChange={setConfirmPass}
          title="Pass Quality Inspection"
          body="Certifies that the printed badge matches visual standards, antenna resonance, and hologram requirements. Card becomes eligible for dispatch."
          confirmLabel="Pass Inspection"
          isPending={qc.isPending}
          onConfirm={() => {
            setConfirmPass(false);
            void run(
              () => qc.mutateAsync({ id: jobId, body: { result: "PASS" } }),
              "Quality inspection passed",
              "Could not record QC pass"
            );
          }}
        />
      </div>
    </RequireRole>
  );
}

