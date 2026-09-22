"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useDispatchDetail, useDispatch, useHandover, useMarkReturned } from "../../_hooks/usePrint";
import {
  ArrowLeft,
  Truck,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  FileSignature,
  FileCheck,
  RotateCcw,
  KeyRound,
  IdCard,
} from "lucide-react";

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-rule/60 last:border-0 gap-1">
      <span className="text-xs font-medium text-slate">{label}</span>
      <span className={cn("text-xs font-semibold text-ink", mono && "identifier")}>{value}</span>
    </div>
  );
}

export default function DispatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatchId = Number(params.id);

  const { data: record, isLoading, isError, refetch } = useDispatchDetail(dispatchId);
  const dispatch = useDispatch();
  const handover = useHandover();
  const markReturned = useMarkReturned();

  const [confirmDispatch, setConfirmDispatch] = useState(false);
  const [confirmHandover, setConfirmHandover] = useState(false);
  const [signature, setSignature] = useState<File | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !record) {
    return (
      <div className="p-6">
        <ErrorState
          title="Dispatch manifest not found"
          body="This card dispatch record could not be retrieved from the server."
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
      toast.error(error instanceof ApiError ? error.problem.detail ?? fail : "Cannot reach the server");
    }
  }

  const methodLabel =
    record.dispatchMethod === "COLLECTION"
      ? "Front-Desk Desk Collection"
      : record.dispatchMethod === "INTERNAL_MAIL"
      ? "Internal Corporate Mail"
      : "Secured Registered Courier";

  return (
    <RequireRole allow={["PRINT_SUPERVISOR", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/print/dispatch"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rule bg-surface text-slate hover:bg-paper hover:text-ink shadow-2xs transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="identifier text-xs font-semibold text-slate">MANIFEST #{record.id}</span>
                <StatusBadge status={record.status} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-ink mt-0.5">
                {record.employeeName}
                <span className="text-sm font-normal text-slate ml-2">({record.empId})</span>
                <span className="text-sm identifier text-slate ml-2">· {record.cardSerial}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-rule bg-surface px-3 py-1.5 text-xs text-slate font-medium shadow-2xs">
              Job: <strong className="text-ink identifier">{record.jobNo}</strong>
            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT: 2-COLUMN LAYOUT ─── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2 Cols): Details & Delivery Audit Trail */}
          <div className="space-y-6 lg:col-span-2">
            {/* Manifest Details Card */}
            <Card>
              <CardHeader className="border-b border-rule pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-credential" />
                  <span>Dispatch Specification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-1">
                <DetailRow label="Recipient Employee" value={`${record.employeeName} (${record.empId})`} />
                <DetailRow label="Smart Card Serial" value={record.cardSerial} mono />
                <DetailRow label="Associated Print Job" value={record.jobNo} mono />
                <DetailRow label="Delivery Method" value={methodLabel} />
                <DetailRow
                  label="Gate Status"
                  value={
                    record.status === "DELIVERED" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Live & Active at Gates
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                        <Clock className="h-3.5 w-3.5" /> Awaiting Handover
                      </span>
                    )
                  }
                />
              </CardContent>
            </Card>

            {/* Delivery Timeline & Audit Details Card */}
            <Card>
              <CardHeader className="border-b border-rule pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-credential" />
                  <span>Dispatch Manifest & Delivery Audit Trail</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-1">
                <DetailRow
                  label="Manifest Created At"
                  value={new Date(record.createdAt).toLocaleString()}
                />
                <DetailRow
                  label="Dispatched Timestamp"
                  value={
                    record.dispatchedAt ? (
                      <span className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-slate" />
                        <span>{new Date(record.dispatchedAt).toLocaleString()}</span>
                      </span>
                    ) : (
                      <span className="text-slate italic">Not dispatched yet</span>
                    )
                  }
                />
                <DetailRow
                  label="Handover & Gate Activation"
                  value={
                    record.handedOverAt ? (
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{new Date(record.handedOverAt).toLocaleString()}</span>
                      </span>
                    ) : (
                      <span className="text-slate italic">Awaiting recipient acknowledgment</span>
                    )
                  }
                />
                <DetailRow
                  label="Received & Acknowledged By"
                  value={
                    record.receivedByName ? (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-credential" />
                        <span>{record.receivedByName}</span>
                      </span>
                    ) : (
                      <span className="text-slate italic">Pending confirmation</span>
                    )
                  }
                />
                {record.remarks && (
                  <div className="mt-3 rounded-xl bg-paper border border-rule p-3 text-xs space-y-1">
                    <span className="text-slate font-semibold block">Delivery Remarks / Return Note</span>
                    <p className="text-ink leading-relaxed">{record.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col): Handover & Activation Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="border-b border-rule pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-credential" />
                  <span>Handover & Door Activation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* 1. DISPATCH (PENDING) */}
                {record.status === "PENDING" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate">
                      Card is packaged and ready. Mark dispatched to send via {methodLabel}.
                    </p>
                    <Button
                      className="w-full rounded-xl bg-credential text-white hover:bg-credential/90 font-semibold text-xs h-10 gap-2 shadow-xs"
                      disabled={dispatch.isPending}
                      onClick={() => setConfirmDispatch(true)}
                    >
                      <Send className="h-4 w-4" />
                      <span>Confirm Package Dispatch</span>
                    </Button>
                  </div>
                )}

                {/* 2. RECORD HANDOVER (DISPATCHED) */}
                {record.status === "DISPATCHED" && !showReturn && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                        Door Access Activation:
                      </span>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Recording handover immediately activates this card at turnstiles for {record.employeeName}.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        <FileSignature className="h-3.5 w-3.5 text-slate" />
                        <span>Upload Signed Acknowledgment (Optional)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => setSignature(e.target.files?.[0] ?? null)}
                        className="text-xs text-slate file:mr-2.5 file:rounded-xl file:border file:border-rule file:bg-paper file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink hover:file:bg-slate-100 cursor-pointer w-full"
                      />
                    </div>

                    <Button
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 gap-2 shadow-xs"
                      disabled={handover.isPending}
                      onClick={() => setConfirmHandover(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Record Handover & Activate Card</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-rule text-slate hover:bg-paper hover:text-ink font-semibold text-xs h-9 gap-1.5"
                      onClick={() => setShowReturn(true)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-slate" />
                      <span>Mark Returned Undelivered</span>
                    </Button>
                  </div>
                )}

                {/* RETURN FORM */}
                {record.status === "DISPATCHED" && showReturn && (
                  <div className="space-y-2 rounded-xl bg-rose-50/60 border border-rose-200 p-3">
                    <label className="text-xs font-bold text-rose-900">Reason for Undelivered Return</label>
                    <Textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="e.g. Employee on leave, incorrect departmental mail slot, recipient absent..."
                      className="rounded-xl min-h-20 text-xs bg-white"
                    />
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl text-xs font-semibold flex-1"
                        disabled={!returnReason.trim() || markReturned.isPending}
                        onClick={() =>
                          void run(
                            async () => {
                              await markReturned.mutateAsync({ id: dispatchId, reason: returnReason.trim() });
                              setShowReturn(false);
                              setReturnReason("");
                            },
                            "Package recorded as returned undelivered",
                            "Could not record package return"
                          )
                        }
                      >
                        Confirm Return
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-xs"
                        onClick={() => {
                          setShowReturn(false);
                          setReturnReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* 3. RE-DISPATCH (RETURNED) */}
                {record.status === "RETURNED" && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-slate">
                      This package was returned undelivered. Click below to re-dispatch to the employee.
                    </p>
                    <Button
                      className="w-full rounded-xl bg-credential text-white hover:bg-credential/90 font-semibold text-xs h-10 gap-2 shadow-xs"
                      disabled={dispatch.isPending}
                      onClick={() => setConfirmDispatch(true)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Re-Dispatch Package</span>
                    </Button>
                  </div>
                )}

                {/* 4. DELIVERED SUMMARY */}
                {record.status === "DELIVERED" && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-950 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Card Successfully Activated</span>
                    </div>
                    <p className="text-emerald-700 leading-relaxed">
                      Delivered to <strong>{record.receivedByName}</strong> on {new Date(record.handedOverAt!).toLocaleString()}. The RFID card is active and authorized for physical turnstiles.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Compliance Note Card */}
            <Card className="border-dashed">
              <CardContent className="p-4 text-xs text-slate space-y-1.5">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-credential" />
                  Audit Trail Compliance
                </span>
                <p className="text-[11px] leading-relaxed">
                  Handover timestamps and recipient acknowledgment records are permanently archived for physical access compliance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── CONFIRM DIALOGS ─── */}
        <ConfirmDialog
          open={confirmDispatch}
          onOpenChange={setConfirmDispatch}
          title="Confirm Package Dispatch"
          body={`Marks smart card ${record.cardSerial} as dispatched via ${methodLabel} to ${record.employeeName}.`}
          confirmLabel="Dispatch Package"
          isPending={dispatch.isPending}
          onConfirm={() => {
            setConfirmDispatch(false);
            void run(() => dispatch.mutateAsync(dispatchId), "Package dispatched", "Could not dispatch package");
          }}
        />

        <ConfirmDialog
          open={confirmHandover}
          onOpenChange={setConfirmHandover}
          title="Record Handover & Activate Card"
          body={`${record.employeeName} (${record.empId}) will receive smart card ${record.cardSerial}. The card becomes live immediately and will unlock authorized doors.`}
          confirmLabel="Confirm Handover & Activate"
          isPending={handover.isPending}
          onConfirm={() => {
            setConfirmHandover(false);
            void run(
              () =>
                handover.mutateAsync({
                  id: dispatchId,
                  receiverId: record.employeeId,
                  signature: signature ?? undefined,
                }),
              "Card handed over and activated",
              "Could not record handover"
            );
          }}
        />
      </div>
    </RequireRole>
  );
}
