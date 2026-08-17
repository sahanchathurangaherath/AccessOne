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
import { ApiError } from "@/lib/api";
import { useDispatchDetail, useDispatch, useHandover, useMarkReturned } from "../../_hooks/usePrint";

export default function DispatchDetailPage() {
  const params = useParams<{ id: string }>();
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
    return <ErrorState body="This dispatch record could not be loaded." onRetry={() => void refetch()} />;
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
        identifier={record.jobNo}
        title={`${record.employeeName} (${record.empId}) — ${record.cardSerial}`}
        status={record.status}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Dispatch</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Method" value={record.dispatchMethod.replaceAll("_", " ").toLowerCase()} />
              <Row label="Dispatched" value={fmt(record.dispatchedAt)} />
              <Row label="Received by" value={record.receivedByName ?? "—"} />
              <Row label="Handed over" value={fmt(record.handedOverAt)} />
              {record.remarks && <Row label="Remarks" value={record.remarks} />}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {record.status === "PENDING" && (
                <Button disabled={dispatch.isPending} onClick={() => setConfirmDispatch(true)}>
                  Dispatch
                </Button>
              )}

              {record.status === "DISPATCHED" && !showReturn && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Handover signature (optional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => setSignature(e.target.files?.[0] ?? null)}
                      className="text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium"
                    />
                  </div>
                  <Button disabled={handover.isPending} onClick={() => setConfirmHandover(true)}>
                    Record handover
                  </Button>
                  <Button variant="outline" onClick={() => setShowReturn(true)}>
                    Mark returned
                  </Button>
                </>
              )}

              {record.status === "DISPATCHED" && showReturn && (
                <div className="space-y-2">
                  <Textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Say why the card was returned undelivered"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      disabled={!returnReason.trim() || markReturned.isPending}
                      onClick={() => void run(
                        async () => {
                          await markReturned.mutateAsync({ id: dispatchId, reason: returnReason.trim() });
                          setShowReturn(false);
                          setReturnReason("");
                        },
                        "Marked as returned", "Could not record the return")}
                    >
                      Confirm return
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowReturn(false); setReturnReason(""); }}>Cancel</Button>
                  </div>
                </div>
              )}

              {record.status === "RETURNED" && (
                <Button disabled={dispatch.isPending} onClick={() => setConfirmDispatch(true)}>
                  Re-dispatch
                </Button>
              )}

              {record.status === "DELIVERED" && (
                <p className="text-sm text-slate">
                  Delivered to {record.receivedByName} on {fmt(record.handedOverAt)}. The card is active.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDispatch} onOpenChange={setConfirmDispatch}
        title="Dispatch this card?"
        body={`Marks card ${record.cardSerial} as sent to ${record.employeeName}.`}
        confirmLabel="Dispatch" isPending={dispatch.isPending}
        onConfirm={() => { setConfirmDispatch(false); void run(() => dispatch.mutateAsync(dispatchId), "Dispatched", "Could not dispatch the card"); }}
      />

      {/* State the consequence, not just the action -- this is the moment the card becomes live. */}
      <ConfirmDialog
        open={confirmHandover} onOpenChange={setConfirmHandover}
        title="Record handover"
        body={`${record.employeeName} (${record.empId}) will receive card ${record.cardSerial}. The card becomes active immediately and will open doors from this moment.`}
        confirmLabel="Confirm handover" isPending={handover.isPending}
        onConfirm={() => {
          setConfirmHandover(false);
          void run(
            () => handover.mutateAsync({ id: dispatchId, receiverId: record.employeeId, signature: signature ?? undefined }),
            "Card handed over and activated", "Could not record the handover");
        }}
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
