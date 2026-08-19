"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DetailHeader } from "@/components/detail-header";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import {
  printJobs, useStart, useComplete, useQc, useReprint, useCancel, useOpenDispatch,
} from "../../_hooks/usePrint";

const DISPATCH_METHOD_LABEL: Record<string, string> = {
  COLLECTION: "Collection", INTERNAL_MAIL: "Internal mail", COURIER: "Courier",
};

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
    return <ErrorState body="This print job could not be loaded." onRetry={() => void refetch()} />;
  }

  async function run(action: () => Promise<unknown>, ok: string, fail: string) {
    try {
      await action();
      toast.success(ok);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail ?? fail : "Cannot reach the server");
    }
  }

  return (
    <RequireRole allow={["PRINT_SUPERVISOR"]}>
      <DetailHeader
        identifier={job.jobNo}
        title={`${job.employeeName} (${job.empId}) — ${job.cardSerial}`}
        status={job.status}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Job</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Type" value={job.jobType} />
              <Row label="Department" value={job.departmentName} />
              <Row label="Printer" value={job.printerName ?? "—"} />
              <Row label="Queued" value={fmt(job.queuedAt)} />
              <Row label="Printed" value={fmt(job.printedAt)} />
              {job.qcResult !== "PENDING" && <Row label="QC result" value={job.qcResult} />}
              {job.qcNotes && <Row label="QC notes" value={job.qcNotes} />}
              {job.cancelledReason && <Row label="Cancelled" value={job.cancelledReason} />}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {job.status === "QUEUED" && (
                <div className="space-y-2">
                  <Input
                    placeholder="Printer name"
                    value={printerName}
                    onChange={(e) => setPrinterName(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    disabled={!printerName.trim() || start.isPending}
                    onClick={() => void run(
                      () => start.mutateAsync({ id: jobId, body: { printerName: printerName.trim() } }),
                      "Job started", "Could not start the job")}
                  >
                    Start printing
                  </Button>
                </div>
              )}

              {job.status === "IN_PROGRESS" && (
                <Button className="w-full" disabled={complete.isPending} onClick={() => setConfirmComplete(true)}>
                  Mark printed
                </Button>
              )}

              {job.status === "PRINTED" && !showFail && (
                <>
                  <Button className="w-full" disabled={qc.isPending} onClick={() => setConfirmPass(true)}>
                    Pass quality check
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => setShowFail(true)}>
                    Fail quality check
                  </Button>
                </>
              )}

              {job.status === "PRINTED" && showFail && (
                <div className="space-y-2">
                  <Textarea
                    value={qcNotes}
                    onChange={(e) => setQcNotes(e.target.value)}
                    placeholder="Say what was wrong with the card"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      disabled={!qcNotes.trim() || qc.isPending}
                      onClick={() => void run(
                        async () => {
                          await qc.mutateAsync({ id: jobId, body: { result: "FAIL", notes: qcNotes.trim() } });
                          setShowFail(false);
                          setQcNotes("");
                        },
                        "Quality check recorded as failed", "Could not record the result")}
                    >
                      Confirm failure
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowFail(false); setQcNotes(""); }}>Cancel</Button>
                  </div>
                </div>
              )}

              {job.status === "QC_FAILED" && (
                <Button
                  className="w-full"
                  disabled={reprint.isPending}
                  onClick={() => void run(
                    async () => {
                      const created = await reprint.mutateAsync({ id: jobId });
                      router.push(`/print/jobs/${created.id}`);
                    },
                    "Reprint job created", "Could not create the reprint")}
                >
                  Reprint
                </Button>
              )}

              {job.dispatchable && !showDispatch && (
                <Button className="w-full" onClick={() => setShowDispatch(true)}>
                  Send to dispatch
                </Button>
              )}

              {job.dispatchable && showDispatch && (
                <div className="space-y-2">
                  <Select value={dispatchMethod} onValueChange={(v) => setDispatchMethod(v ?? "COLLECTION")}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DISPATCH_METHOD_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      disabled={openDispatch.isPending}
                      onClick={() => void run(async () => {
                        const record = await openDispatch.mutateAsync({ printJobId: jobId, dispatchMethod });
                        router.push(`/print/dispatch/${record.id}`);
                      }, "Dispatch record opened", "Could not open a dispatch record")}
                    >
                      Confirm
                    </Button>
                    <Button variant="ghost" onClick={() => setShowDispatch(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {CANCELLABLE.has(job.status) && !showCancel && (
                <Button variant="outline" className="w-full" onClick={() => setShowCancel(true)}>
                  Cancel job
                </Button>
              )}

              {CANCELLABLE.has(job.status) && showCancel && (
                <div className="space-y-2">
                  <Textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Say why this job is being cancelled"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      disabled={!cancelReason.trim() || cancel.isPending}
                      onClick={() => void run(
                        async () => {
                          await cancel.mutateAsync({ id: jobId, body: { reason: cancelReason.trim() } });
                          setShowCancel(false);
                          setCancelReason("");
                        },
                        "Job cancelled", "Could not cancel the job")}
                    >
                      Confirm cancellation
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowCancel(false); setCancelReason(""); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmComplete} onOpenChange={setConfirmComplete}
        title="Mark this job printed?"
        body="Records that the physical card has been produced. Once printed, this job can no longer be cancelled."
        confirmLabel="Mark printed" isPending={complete.isPending}
        onConfirm={() => { setConfirmComplete(false); void run(() => complete.mutateAsync(jobId), "Job marked printed", "Could not update the job"); }}
      />
      <ConfirmDialog
        open={confirmPass} onOpenChange={setConfirmPass}
        title="Pass this quality check?"
        body="The card becomes eligible for dispatch."
        confirmLabel="Pass" isPending={qc.isPending}
        onConfirm={() => { setConfirmPass(false); void run(() => qc.mutateAsync({ id: jobId, body: { result: "PASS" } }), "Quality check passed", "Could not record the result"); }}
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
