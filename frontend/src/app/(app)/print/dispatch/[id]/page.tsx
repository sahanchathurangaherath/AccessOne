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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ApiError } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useDispatchDetail, useDispatch, useHandover, useMarkReturned } from "../../_hooks/usePrint";
import {
  ArrowLeft,
  Truck,
  User,
  Cpu,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  ShieldCheck,
  Building2,
  Mail,
  FileSignature,
  FileCheck,
  RotateCcw,
  KeyRound,
} from "lucide-react";

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
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rule bg-surface text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">MANIFEST #{record.id}</span>
                <StatusBadge status={record.status} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-ink mt-0.5">
                {record.employeeName}
                <span className="text-sm font-normal text-slate-400 ml-2">({record.empId})</span>
                <span className="text-sm font-mono text-slate-500 ml-2">&bull; {record.cardSerial}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-rule bg-surface px-3 py-1.5 text-xs text-slate-600 font-medium shadow-2xs">
              Job: <strong className="text-ink font-mono">{record.jobNo}</strong>
            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT: 2-COLUMN LAYOUT ─── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2 Cols): Manifest Specification & Card Identity */}
          <div className="space-y-6 lg:col-span-2">
            {/* PHYSICAL DISPATCH MANIFEST CARD */}
            <div className="relative overflow-hidden rounded-2xl border border-rule bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-md">
              <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wider text-blue-300 uppercase border border-blue-400/30">
                      <Truck className="h-3 w-3" /> {methodLabel}
                    </span>
                    {record.status === "DELIVERED" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                        <CheckCircle2 className="h-3 w-3" /> Live & Active at Gates
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                        <Clock className="h-3 w-3" /> Awaiting Handover
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">{record.employeeName}</h2>
                    <p className="text-xs font-mono text-slate-300 tracking-wider mt-0.5">
                      CARD: {record.cardSerial} &bull; RECIPIENT ID: {record.empId}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                        Print Job Number
                      </span>
                      <span className="font-semibold text-slate-100 font-mono">{record.jobNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                        Routing Method
                      </span>
                      <span className="font-semibold text-blue-300">{methodLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Handover Seal Graphic */}
                <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/95 text-slate-950 shadow-lg border border-white/20 self-center sm:self-auto flex-shrink-0 w-28 h-28">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-credential flex items-center justify-center mb-1">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-slate-800 text-center uppercase">
                    {record.status === "DELIVERED" ? "ACTIVATED" : "IN TRANSIT"}
                  </span>
                </div>
              </div>
            </div>

            {/* DELIVERY TIMELINE & AUDIT DETAILS */}
            <Card className="rounded-2xl border-rule bg-surface shadow-xs">
              <CardHeader className="border-b border-rule/60 pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-credential" />
                  <span>Dispatch Manifest & Delivery Audit Trail</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Dispatched Timestamp
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <Send className="h-4 w-4 text-slate-400" />
                      <span>{record.dispatchedAt ? new Date(record.dispatchedAt).toLocaleString() : "Not dispatched yet"}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Card Handover & Activation
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <CheckCircle2 className="h-4 w-4 text-slate-400" />
                      <span>{record.handedOverAt ? new Date(record.handedOverAt).toLocaleString() : "Awaiting recipient acknowledgment"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Received & Acknowledged By
                    </span>
                    <p className="font-semibold text-ink">
                      {record.receivedByName ? (
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-credential" />
                          <span>{record.receivedByName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending recipient confirmation</span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Manifest Created At
                    </span>
                    <p className="font-semibold text-ink font-mono text-xs">
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {record.remarks && (
                  <div className="rounded-xl bg-slate-100 border border-slate-300 p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Delivery Remarks / Return Note
                    </span>
                    <p className="text-xs text-slate-900 leading-relaxed">{record.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col): Handover & Activation Actions */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-rule bg-surface shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-rule/60 pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-credential" />
                  <span>Handover & Door Activation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* 1. DISPATCH (PENDING) */}
                {record.status === "PENDING" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
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
                    <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3 text-xs text-emerald-900 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                        Door Access Activation Boundary:
                      </span>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Recording handover immediately activates this card at turnstiles for {record.employeeName}.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileSignature className="h-3.5 w-3.5 text-slate-400" />
                        <span>Upload Signed Acknowledgment Slip (Optional)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => setSignature(e.target.files?.[0] ?? null)}
                        className="text-xs text-slate-500 file:mr-2.5 file:rounded-xl file:border file:border-rule file:bg-paper file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-100 cursor-pointer w-full"
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
                      className="w-full rounded-xl border-rule text-slate-700 hover:bg-slate-50 font-semibold text-xs h-9 gap-1.5"
                      onClick={() => setShowReturn(true)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
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
                    <p className="text-xs text-slate-600">
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
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200/70 p-4 text-xs text-emerald-950 space-y-1.5">
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

            {/* Quick Helper Note */}
            <div className="rounded-2xl border border-rule bg-slate-50/70 p-4 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-ink flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-credential" />
                Security Rule Compliance:
              </span>
              <p className="text-slate-500 leading-relaxed">
                Handover signatures and delivery receipts are permanently archived in the employee credential lifecycle audit trail.
              </p>
            </div>
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

