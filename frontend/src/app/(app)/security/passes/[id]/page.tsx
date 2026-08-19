"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DetailHeader } from "@/components/detail-header";
import { ErrorState, FullPageSpinner } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ApiError } from "@/lib/api";
import {
  passes, useSuspendPass, useReinstatePass, useCancelPass, useReturnPass,
  useExtendPass, useCheckIn, useCheckOut,
} from "../../_hooks/useVisitors";

const LIVE_STATUSES = new Set(["ISSUED", "ACTIVE", "SUSPENDED"]);

export default function PassDetailPage() {
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
    return <ErrorState body="This pass could not be loaded." onRetry={() => void refetch()} />;
  }

  async function run(action: () => Promise<unknown>, successMessage: string, failMessage: string) {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail ?? failMessage : "Cannot reach the server");
    }
  }

  const isLive = LIVE_STATUSES.has(pass.status);

  return (
    <RequireRole allow={["SECURITY_OFFICER"]}>
      <DetailHeader
        identifier={pass.passNo}
        title={`${pass.visitorName} (${pass.visitorCode})`}
        status={pass.status}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Host" value={`${pass.hostName} (${pass.hostEmpId})`} />
              <Row label="Access level" value={pass.accessLevelName} />
              <Row label="Purpose" value={pass.purpose} />
              <Row label="Valid from" value={fmt(pass.validFrom)} />
              <Row label="Valid until" value={fmt(pass.validUntil)} />
              <Row label="Issued by" value={`${pass.issuedByUsername} · ${fmt(pass.issuedAt)}`} />
              {pass.cancelledReason && <Row label="Cancelled reason" value={pass.cancelledReason} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>QR credential</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <img src={`/api/v1/passes/${pass.id}/qr?size=200`} alt="" className="h-[120px] w-[120px] border border-rule" />
              <p className="text-sm text-slate">
                Scanned at the door. Resolves to nothing on its own -- the decision engine
                checks the pass status and validity window at the moment of the scan, not
                what the QR image itself encodes.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {isLive && !showCancel && (
                <>
                  <Button onClick={() => setConfirmCheckIn(true)} disabled={checkIn.isPending}>
                    Check in
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmCheckOut(true)} disabled={checkOut.isPending}>
                    Check out
                  </Button>
                </>
              )}

              {(pass.status === "ISSUED" || pass.status === "ACTIVE") && !showCancel && (
                <Button variant="outline" onClick={() => setConfirmSuspend(true)} disabled={suspend.isPending}>
                  Suspend
                </Button>
              )}

              {pass.status === "SUSPENDED" && (
                <Button onClick={() => setConfirmReinstate(true)} disabled={reinstate.isPending}>
                  Reinstate
                </Button>
              )}

              {(pass.status === "ACTIVE" || pass.status === "EXPIRED") && !showExtend && (
                <Button variant="outline" onClick={() => setShowExtend(true)}>
                  Extend
                </Button>
              )}

              {showExtend && (
                <div className="space-y-2">
                  <Input type="datetime-local" value={extendUntil} onChange={(e) => setExtendUntil(e.target.value)} />
                  <Textarea value={extendReason} onChange={(e) => setExtendReason(e.target.value)}
                            placeholder="Say why this pass is being extended" />
                  <div className="flex gap-2">
                    <Button
                      disabled={!extendUntil || !extendReason.trim() || extend.isPending}
                      onClick={() => void run(
                        async () => {
                          await extend.mutateAsync({
                            id: passId,
                            body: { newUntil: new Date(extendUntil).toISOString(), reason: extendReason.trim() },
                          });
                          setShowExtend(false); setExtendUntil(""); setExtendReason("");
                        },
                        "Pass extended", "Could not extend the pass")}
                    >
                      Confirm extension
                    </Button>
                    <Button variant="ghost" onClick={() => setShowExtend(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {isLive && !showExtend && (
                showCancel ? (
                  <div className="space-y-2">
                    <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Say why this pass is being cancelled" />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        disabled={!cancelReason.trim() || cancel.isPending}
                        onClick={() => void run(
                          async () => {
                            await cancel.mutateAsync({ id: passId, body: { reason: cancelReason.trim() } });
                            setShowCancel(false); setCancelReason("");
                          },
                          "Pass cancelled", "Could not cancel the pass")}
                      >
                        Confirm cancellation
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowCancel(false); setCancelReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="destructive" onClick={() => setShowCancel(true)}>Cancel pass</Button>
                )
              )}

              {pass.status === "EXPIRED" && (
                <Button variant="outline" onClick={() => setConfirmReturn(true)} disabled={markReturned.isPending}>
                  Mark badge returned
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCheckIn} onOpenChange={setConfirmCheckIn}
        title="Check in this visitor?"
        body="Records a visit log entry. If this is the first entry on the pass, it moves from ISSUED to ACTIVE."
        confirmLabel="Check in" isPending={checkIn.isPending}
        onConfirm={() => { setConfirmCheckIn(false); void run(() => checkIn.mutateAsync(passId), "Checked in", "Could not check in this visitor"); }}
      />
      <ConfirmDialog
        open={confirmCheckOut} onOpenChange={setConfirmCheckOut}
        title="Check out this visitor?"
        body="Closes the open visit log. The pass itself stays active until it expires, is cancelled, or is marked returned."
        confirmLabel="Check out" isPending={checkOut.isPending}
        onConfirm={() => { setConfirmCheckOut(false); void run(() => checkOut.mutateAsync(passId), "Checked out", "Could not check out this visitor"); }}
      />
      <ConfirmDialog
        open={confirmSuspend} onOpenChange={setConfirmSuspend}
        title="Suspend this pass?"
        body="The pass stops working at the door immediately, even if still within its validity window."
        confirmLabel="Suspend" isPending={suspend.isPending}
        onConfirm={() => { setConfirmSuspend(false); void run(() => suspend.mutateAsync(passId), "Pass suspended", "Could not suspend the pass"); }}
      />
      <ConfirmDialog
        open={confirmReinstate} onOpenChange={setConfirmReinstate}
        title="Reinstate this pass?"
        body="The pass becomes active again and will work at the door, provided it is still within its validity window."
        confirmLabel="Reinstate" isPending={reinstate.isPending}
        onConfirm={() => { setConfirmReinstate(false); void run(() => reinstate.mutateAsync(passId), "Pass reinstated", "Could not reinstate the pass"); }}
      />
      <ConfirmDialog
        open={confirmReturn} onOpenChange={setConfirmReturn}
        title="Mark this badge returned?"
        body="Records that the physical badge was handed back at the desk, even though the pass had already expired."
        confirmLabel="Mark returned" isPending={markReturned.isPending}
        onConfirm={() => { setConfirmReturn(false); void run(() => markReturned.mutateAsync(passId), "Badge marked returned", "Could not update the pass"); }}
      />
    </RequireRole>
  );
}

function fmt(value: string) {
  return new Date(value).toLocaleString();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
