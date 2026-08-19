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
import { CardPreview } from "../../_components/CardPreview";
import {
  cards, useReportLost, useReportDamaged, useSuspend, useReinstate,
  useRevoke, useVoidCard, useRegenerateCredentials,
} from "../../_hooks/useCards";

/**
 * Purely a UI convenience -- which buttons make sense to show. The server
 * re-validates every transition through IdCard.moveTo() regardless, so
 * hiding a button here is not what keeps an illegal transition from
 * happening.
 */
const CAN_SUSPEND_OR_REPORT = new Set(["ACTIVE"]);
const CAN_REINSTATE = new Set(["SUSPENDED"]);
const CAN_REVOKE = new Set(["ACTIVE", "SUSPENDED"]);
const CAN_VOID = new Set(["GENERATED", "QUEUED_FOR_PRINT", "PRINTED"]);
const CAN_REGENERATE = new Set(["GENERATED", "QUEUED_FOR_PRINT", "PRINTED", "DISPATCHED", "ACTIVE", "SUSPENDED"]);

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const cardId = Number(params.id);

  const { data: card, isLoading, isError, refetch } = cards.useDetail(cardId);
  const { data: timeline } = cards.useTimeline(cardId);

  const reportLost = useReportLost();
  const reportDamaged = useReportDamaged();
  const suspend = useSuspend();
  const reinstate = useReinstate();
  const revoke = useRevoke();
  const voidCard = useVoidCard();
  const regenerate = useRegenerateCredentials();

  const [confirmLost, setConfirmLost] = useState(false);
  const [confirmDamaged, setConfirmDamaged] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmReinstate, setConfirmReinstate] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [showRevoke, setShowRevoke] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [showVoid, setShowVoid] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !card) {
    return <ErrorState body="This card could not be loaded." onRetry={() => void refetch()} />;
  }

  async function run(action: () => Promise<unknown>, successMessage: string, failMessage: string) {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail ?? failMessage : "Cannot reach the server");
    }
  }

  return (
    <RequireRole allow={["IT_ADMIN", "HR_MANAGER"]}>
      <DetailHeader
        identifier={card.cardSerial}
        title={`${card.printedName} (${card.empId})`}
        status={card.status}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Card</CardTitle></CardHeader>
            <CardContent>
              <CardPreview card={card} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Version" value={String(card.versionNo)} />
              <Row label="Access level" value={card.accessLevelName ?? "None assigned"} />
              <Row label="Issue date" value={new Date(card.issueDate).toLocaleDateString()} />
              <Row label="Activated" value={fmt(card.activatedAt)} />
              {card.revokedAt && <Row label="Revoked" value={`${fmt(card.revokedAt)} -- ${card.revocationReason}`} />}
              {card.replacedByCardSerial && (
                <Row label="Replaced by" value={card.replacedByCardSerial} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>NFC payload</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate">
                {card.nfcFormat} &middot; {card.encodingAlgorithm} &middot; generated {fmt(card.credentialGeneratedAt)}
              </p>
              <p className="identifier mt-3 break-all rounded-card bg-paper p-3 text-xs">
                {card.nfcPayload}
              </p>
              <p className="mt-2 text-xs text-slate">
                Writing this payload to a physical NFC chip requires card-encoding
                hardware and is outside the scope of this system.
              </p>
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
            <CardHeader><CardTitle>Files</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <a href={`/api/v1/cards/${card.id}/pdf`}>
                <Button variant="outline" className="w-full">Download PDF</Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {CAN_SUSPEND_OR_REPORT.has(card.status) && !showRevoke && !showVoid && (
                <>
                  <Button variant="outline" onClick={() => setConfirmLost(true)} disabled={reportLost.isPending}>
                    Report lost
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmDamaged(true)} disabled={reportDamaged.isPending}>
                    Report damaged
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmSuspend(true)} disabled={suspend.isPending}>
                    Suspend
                  </Button>
                </>
              )}

              {CAN_REINSTATE.has(card.status) && (
                <Button onClick={() => setConfirmReinstate(true)} disabled={reinstate.isPending}>
                  Reinstate
                </Button>
              )}

              {CAN_REVOKE.has(card.status) && !showVoid && (
                showRevoke ? (
                  <div className="space-y-2">
                    <Textarea
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="Say why this card is being revoked"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        disabled={!revokeReason.trim() || revoke.isPending}
                        onClick={() => void run(
                          async () => {
                            await revoke.mutateAsync({ id: cardId, body: { reason: revokeReason.trim() } });
                            setShowRevoke(false);
                            setRevokeReason("");
                          },
                          "Card revoked", "Could not revoke the card")}
                      >
                        Confirm revocation
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowRevoke(false); setRevokeReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="destructive" onClick={() => setShowRevoke(true)}>Revoke</Button>
                )
              )}

              {CAN_VOID.has(card.status) && !showRevoke && (
                showVoid ? (
                  <div className="space-y-2">
                    <Textarea
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      placeholder="Say why this card is being voided"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        disabled={!voidReason.trim() || voidCard.isPending}
                        onClick={() => void run(
                          async () => {
                            await voidCard.mutateAsync({ id: cardId, body: { reason: voidReason.trim() } });
                            setShowVoid(false);
                            setVoidReason("");
                          },
                          "Card voided", "Could not void the card")}
                      >
                        Confirm void
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowVoid(false); setVoidReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setShowVoid(true)}>Void</Button>
                )
              )}

              {CAN_REGENERATE.has(card.status) && (
                <Button variant="outline" onClick={() => setConfirmRegenerate(true)} disabled={regenerate.isPending}>
                  Regenerate credentials
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLost} onOpenChange={setConfirmLost}
        title="Report this card lost?"
        body="The card moves to LOST. The employee needs to raise a replacement request -- this does not create a new card."
        confirmLabel="Report lost" isPending={reportLost.isPending}
        onConfirm={() => { setConfirmLost(false); void run(() => reportLost.mutateAsync(cardId), "Card reported lost", "Could not update the card"); }}
      />
      <ConfirmDialog
        open={confirmDamaged} onOpenChange={setConfirmDamaged}
        title="Report this card damaged?"
        body="The card moves to DAMAGED. The employee needs to raise a replacement request -- this does not create a new card."
        confirmLabel="Report damaged" isPending={reportDamaged.isPending}
        onConfirm={() => { setConfirmDamaged(false); void run(() => reportDamaged.mutateAsync(cardId), "Card reported damaged", "Could not update the card"); }}
      />
      <ConfirmDialog
        open={confirmSuspend} onOpenChange={setConfirmSuspend}
        title="Suspend this card?"
        body="The card stops working at the door until it is reinstated."
        confirmLabel="Suspend" isPending={suspend.isPending}
        onConfirm={() => { setConfirmSuspend(false); void run(() => suspend.mutateAsync(cardId), "Card suspended", "Could not suspend the card"); }}
      />
      <ConfirmDialog
        open={confirmReinstate} onOpenChange={setConfirmReinstate}
        title="Reinstate this card?"
        body="The card becomes ACTIVE again and will work at the door."
        confirmLabel="Reinstate" isPending={reinstate.isPending}
        onConfirm={() => { setConfirmReinstate(false); void run(() => reinstate.mutateAsync(cardId), "Card reinstated", "Could not reinstate the card"); }}
      />
      <ConfirmDialog
        open={confirmRegenerate} onOpenChange={setConfirmRegenerate}
        title="Regenerate this card's credentials?"
        body="A new QR and NFC payload are produced for the same card, after a data correction. The card itself is unchanged."
        confirmLabel="Regenerate" isPending={regenerate.isPending}
        onConfirm={() => { setConfirmRegenerate(false); void run(() => regenerate.mutateAsync(cardId), "Credentials regenerated", "Could not regenerate credentials"); }}
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
