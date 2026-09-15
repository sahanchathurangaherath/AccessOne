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
import { ApiError } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import {
  passes,
  useSuspendPass,
  useReinstatePass,
  useCancelPass,
  useReturnPass,
  useExtendPass,
  useCheckIn,
  useCheckOut,
} from "../../_hooks/useVisitors";
import {
  ArrowLeft,
  QrCode,
  User,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  LogOut,
  Ban,
  RotateCcw,
  Sparkles,
  Building,
  KeyRound,
  FileText,
  BadgeCheck,
} from "lucide-react";

const LIVE_STATUSES = new Set(["ISSUED", "ACTIVE", "SUSPENDED"]);

export default function PassDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const passId = Number(params.id);

  const { data: pass, isLoading, isError, refetch } = passes.useDetail(passId);

  const suspend = useSuspendPass();
  const reinstate = useReinstatePass();
  const cancel = useCancelPass();
  const markReturned = useReturnPass();
  const extend = useExtendPass();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmReinstate, setConfirmReinstate] = useState(false);
  const [confirmCheckIn, setConfirmCheckIn] = useState(false);
  const [confirmCheckOut, setConfirmCheckOut] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);
  
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  
  const [extendUntil, setExtendUntil] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [showExtend, setShowExtend] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !pass) {
    return (
      <div className="p-6">
        <ErrorState
          title="Pass not found"
          body="This visitor pass could not be retrieved from the security server."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  async function run(action: () => Promise<unknown>, successMessage: string, failMessage: string) {
    try {
      await action();
      toast.success(successMessage);
      void refetch();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail ?? failMessage : "Cannot reach the server");
    }
  }

  const isLive = LIVE_STATUSES.has(pass.status);
  const isValidNow =
    new Date(pass.validFrom).getTime() <= Date.now() &&
    Date.now() <= new Date(pass.validUntil).getTime();

  return (
    <RequireRole allow={["SECURITY_OFFICER", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/security/passes"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rule bg-surface text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">{pass.passNo}</span>
                <StatusBadge status={pass.status} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-ink mt-0.5">
                {pass.visitorName}
                <span className="text-sm font-normal text-slate-400 ml-2">({pass.visitorCode})</span>
              </h1>
            </div>
          </div>

          {/* Quick Context Tag */}
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-rule bg-surface px-3 py-1.5 text-xs text-slate-600 font-medium shadow-2xs">
              Access Tier: <strong className="text-ink">{pass.accessLevelName}</strong>
            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT: 2-COLUMN LAYOUT ─── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2 Cols): Pass Identity & Security Specification */}
          <div className="space-y-6 lg:col-span-2">
            {/* DIGITAL VISITOR BADGE CARD */}
            <div className="relative overflow-hidden rounded-2xl border border-rule bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-md">
              {/* Background ambient glow */}
              <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-credential/20 blur-3xl" />
              <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wider text-blue-300 uppercase border border-blue-400/30">
                      <KeyRound className="h-3 w-3" /> Digital Physical Credential
                    </span>
                    {isValidNow ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Window Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-400/30">
                        Window Closed
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">{pass.visitorName}</h2>
                    <p className="text-xs font-mono text-slate-300 tracking-wider mt-0.5">
                      PASS: {pass.passNo} &bull; ID: {pass.visitorCode}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                        Host Employee
                      </span>
                      <span className="font-semibold text-slate-100">{pass.hostName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">EMP-{pass.hostEmpId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                        Security Tier
                      </span>
                      <span className="font-semibold text-blue-300">{pass.accessLevelName}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Presentation */}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/95 text-slate-950 shadow-lg border border-white/20 self-center sm:self-auto flex-shrink-0">
                  <img
                    src={`/api/v1/passes/${pass.id}/qr?size=160`}
                    alt={`QR Code for pass ${pass.passNo}`}
                    className="h-32 w-32 rounded-lg object-contain"
                  />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-700 mt-1">
                    SCAN AT GATE
                  </span>
                </div>
              </div>
            </div>

            {/* PASS METADATA & PERMITTED SPECIFICATIONS */}
            <Card className="rounded-2xl border-rule bg-surface shadow-xs">
              <CardHeader className="border-b border-rule/60 pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <FileText className="h-4 w-4 text-credential" />
                  <span>Pass Specification & Validity Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Valid From (Gate Unlocked)
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{new Date(pass.validFrom).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Valid Until (Pass Expiry)
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{new Date(pass.validUntil).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-rule bg-paper p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Authorized Visit Purpose
                  </span>
                  <p className="text-ink font-medium leading-relaxed">
                    {pass.purpose || "General corporate visitor access"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Issued by Security Officer</span>
                    <p className="font-semibold text-ink flex items-center gap-1.5">
                      <BadgeCheck className="h-4 w-4 text-credential" />
                      <span>{pass.issuedByUsername}</span>
                    </p>
                    <span className="text-[11px] text-slate-400 block">
                      at {new Date(pass.issuedAt).toLocaleString()}
                    </span>
                  </div>

                  {pass.cancelledReason && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 space-y-1">
                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                        Cancellation Rationale
                      </span>
                      <p className="text-xs text-rose-950">{pass.cancelledReason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col): Lifecycle Action Console */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-rule bg-surface shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-rule/60 pb-3">
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <Shield className="h-4 w-4 text-credential" />
                  <span>Pass Management Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* 1. Check in / Check out */}
                {isLive && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Gate Presence
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => setConfirmCheckIn(true)}
                        disabled={checkIn.isPending}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 h-9"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>Check In</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmCheckOut(true)}
                        disabled={checkOut.isPending}
                        className="rounded-xl border-rule text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 h-9"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Check Out</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* 2. Suspend / Reinstate */}
                <div className="space-y-2 pt-2 border-t border-rule/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Door Access Control
                  </span>

                  {(pass.status === "ISSUED" || pass.status === "ACTIVE") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmSuspend(true)}
                      disabled={suspend.isPending}
                      className="w-full rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold text-xs gap-1.5 h-9"
                    >
                      <Ban className="h-3.5 w-3.5 text-amber-600" />
                      <span>Suspend Pass</span>
                    </Button>
                  )}

                  {pass.status === "SUSPENDED" && (
                    <Button
                      size="sm"
                      onClick={() => setConfirmReinstate(true)}
                      disabled={reinstate.isPending}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 h-9"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reinstate Pass</span>
                    </Button>
                  )}
                </div>

                {/* 3. Extend Time Validity */}
                {(pass.status === "ACTIVE" || pass.status === "EXPIRED") && (
                  <div className="pt-2 border-t border-rule/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowExtend(true)}
                      className="w-full rounded-xl border-rule text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 h-9"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>Extend Validity Window</span>
                    </Button>
                  </div>
                )}

                {/* 4. Cancel Pass */}
                {isLive && (
                  <div className="pt-2 border-t border-rule/60">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCancel(true)}
                      className="w-full rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs gap-1.5 h-9"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Cancel Pass Immediately</span>
                    </Button>
                  </div>
                )}

                {/* 5. Physical Badge Returned */}
                {pass.status === "EXPIRED" && (
                  <div className="pt-2 border-t border-rule/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmReturn(true)}
                      disabled={markReturned.isPending}
                      className="w-full rounded-xl border-rule text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 h-9"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Mark Physical Badge Returned</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Helper Note */}
            <div className="rounded-2xl border border-rule bg-slate-50/70 p-4 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-ink flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-credential" />
                Access Rule Engine Note:
              </span>
              <p className="text-slate-500 leading-relaxed">
                Evaluating this pass at turnstiles checks both real-time suspension state and time bounds at the exact moment of scan.
              </p>
            </div>
          </div>
        </div>

        {/* ─── MODALS & CONFIRM DIALOGS ─── */}

        {/* Extend Modal */}
        <Dialog open={showExtend} onOpenChange={setShowExtend}>
          <DialogContent className="rounded-2xl border-rule bg-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
                <Clock className="h-5 w-5 text-credential" />
                <span>Extend Pass Validity</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">New Expiration Date & Time</label>
                <Input
                  type="datetime-local"
                  value={extendUntil}
                  onChange={(e) => setExtendUntil(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Extension Reason</label>
                <Textarea
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="Explain why this pass validity is being extended..."
                  className="rounded-xl min-h-20 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowExtend(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!extendUntil || !extendReason.trim() || extend.isPending}
                className="rounded-xl bg-credential text-white hover:bg-credential/90 font-semibold"
                onClick={() =>
                  void run(
                    async () => {
                      await extend.mutateAsync({
                        id: passId,
                        body: {
                          newUntil: new Date(extendUntil).toISOString(),
                          reason: extendReason.trim(),
                        },
                      });
                      setShowExtend(false);
                      setExtendUntil("");
                      setExtendReason("");
                    },
                    "Pass validity window extended",
                    "Could not extend the pass"
                  )
                }
              >
                Confirm Extension
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Modal */}
        <Dialog open={showCancel} onOpenChange={setShowCancel}>
          <DialogContent className="rounded-2xl border-rule bg-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-700">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>Cancel Visitor Pass</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Cancelling this pass will permanently revoke turnstile access immediately. This action cannot be reversed.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Cancellation Reason</label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="State reason for revoking this visitor pass..."
                  className="rounded-xl min-h-20 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCancel(false);
                  setCancelReason("");
                }}
                className="rounded-xl"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!cancelReason.trim() || cancel.isPending}
                className="rounded-xl font-semibold"
                onClick={() =>
                  void run(
                    async () => {
                      await cancel.mutateAsync({
                        id: passId,
                        body: { reason: cancelReason.trim() },
                      });
                      setShowCancel(false);
                      setCancelReason("");
                    },
                    "Pass successfully cancelled",
                    "Could not cancel the pass"
                  )
                }
              >
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Dialogs */}
        <ConfirmDialog
          open={confirmCheckIn}
          onOpenChange={setConfirmCheckIn}
          title="Check In Visitor"
          body="Records a gate entry timestamp. If this is the first entry on the pass, it activates the pass status."
          confirmLabel="Confirm Check In"
          isPending={checkIn.isPending}
          onConfirm={() => {
            setConfirmCheckIn(false);
            void run(() => checkIn.mutateAsync(passId), "Visitor checked in", "Could not check in this visitor");
          }}
        />

        <ConfirmDialog
          open={confirmCheckOut}
          onOpenChange={setConfirmCheckOut}
          title="Check Out Visitor"
          body="Closes the open on-site log entry. The pass remains valid for subsequent entries until its expiry."
          confirmLabel="Confirm Check Out"
          isPending={checkOut.isPending}
          onConfirm={() => {
            setConfirmCheckOut(false);
            void run(() => checkOut.mutateAsync(passId), "Visitor checked out", "Could not check out this visitor");
          }}
        />

        <ConfirmDialog
          open={confirmSuspend}
          onOpenChange={setConfirmSuspend}
          title="Suspend Visitor Pass"
          body="This pass will be blocked at all door turnstiles immediately, even if within its validity window."
          confirmLabel="Suspend Pass"
          isPending={suspend.isPending}
          onConfirm={() => {
            setConfirmSuspend(false);
            void run(() => suspend.mutateAsync(passId), "Pass suspended", "Could not suspend the pass");
          }}
        />

        <ConfirmDialog
          open={confirmReinstate}
          onOpenChange={setConfirmReinstate}
          title="Reinstate Visitor Pass"
          body="The pass will be re-enabled and grant door access again, provided it has not expired."
          confirmLabel="Reinstate Pass"
          isPending={reinstate.isPending}
          onConfirm={() => {
            setConfirmReinstate(false);
            void run(() => reinstate.mutateAsync(passId), "Pass reinstated", "Could not reinstate the pass");
          }}
        />

        <ConfirmDialog
          open={confirmReturn}
          onOpenChange={setConfirmReturn}
          title="Confirm Badge Handover"
          body="Records that the physical RFID / QR badge has been returned to the security front desk."
          confirmLabel="Mark Returned"
          isPending={markReturned.isPending}
          onConfirm={() => {
            setConfirmReturn(false);
            void run(() => markReturned.mutateAsync(passId), "Badge marked returned", "Could not update pass status");
          }}
        />
      </div>
    </RequireRole>
  );
}

