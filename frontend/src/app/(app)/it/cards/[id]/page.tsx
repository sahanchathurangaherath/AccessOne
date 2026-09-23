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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { CardPreview } from "../../_components/CardPreview";
import {
  cards, useReportLost, useReportDamaged, useSuspend, useReinstate,
  useRevoke, useVoidCard, useRegenerateCredentials,
} from "../../_hooks/useCards";
import { useAccessLevels, useAssignAccessLevel } from "../../_hooks/useConfig";
import { Shield, KeyRound, ArrowLeft, Calendar, Layers, Activity, FileDown, Wifi } from "lucide-react";
import Link from "next/link";

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
  const { data: accessLevels } = useAccessLevels();

  const reportLost = useReportLost();
  const reportDamaged = useReportDamaged();
  const suspend = useSuspend();
  const reinstate = useReinstate();
  const revoke = useRevoke();
  const voidCard = useVoidCard();
  const regenerate = useRegenerateCredentials();
  const assignAccessLevel = useAssignAccessLevel();

  const [confirmLost, setConfirmLost] = useState(false);
  const [confirmDamaged, setConfirmDamaged] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmReinstate, setConfirmReinstate] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [showRevoke, setShowRevoke] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [showVoid, setShowVoid] = useState(false);
  const [showChangeLevel, setShowChangeLevel] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [levelRemarks, setLevelRemarks] = useState("");

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
      <div className="mb-4">
        <Link
          href="/it/cards"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Issued Cards
        </Link>
      </div>

      <DetailHeader
        identifier={card.cardSerial}
        title={`${card.printedName} (${card.empId})`}
        status={card.status}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Card Visual & Biometric Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <CardPreview card={card} />
            </CardContent>
          </Card>

          {/* Structured 2x2 Card Details Grid */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Credential Metadata</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Layers className="h-3.5 w-3.5 text-credential" />
                    <span>Card Version & Generation</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">Version {card.versionNo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Issued: {new Date(card.issueDate).toLocaleDateString()}</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Shield className="h-3.5 w-3.5 text-credential" />
                    <span>Assigned Security Access Level</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{card.accessLevelName ?? "Standard Level"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Physical door access profile</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Activity className="h-3.5 w-3.5 text-credential" />
                    <span>Activation Timestamp</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{card.activatedAt ? fmt(card.activatedAt) : "Pending Activation"}</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-credential" />
                    <span>Lifecycle Record</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {card.revokedAt ? (
                      <span className="text-denied font-bold">Revoked · {card.revocationReason}</span>
                    ) : card.replacedByCardSerial ? (
                      <span>Replaced by: <strong className="identifier">{card.replacedByCardSerial}</strong></span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">Active in Service</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-rule flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-credential" />
                <CardTitle className="text-base font-bold text-ink">NFC Payload & Encoding</CardTitle>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {card.nfcFormat}
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-slate-500">
                Format: <strong className="text-ink">{card.nfcFormat}</strong> &middot; Algorithm: <strong className="text-ink">{card.encodingAlgorithm}</strong> &middot; Generated {fmt(card.credentialGeneratedAt)}
              </p>
              <p className="identifier mt-3 break-all rounded-card bg-paper p-3 text-xs border border-rule font-mono">
                {card.nfcPayload}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Writing this payload to a physical NFC chip requires card-encoding
                hardware and is outside the scope of this portal.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Files</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                render={<a href={`/api/v1/cards/${card.id}/pdf`} download={`card-${card.cardSerial || card.id}.pdf`} />}
              >
                Download PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {/* Access Level Reassignment */}
              {["ACTIVE", "SUSPENDED", "PRINTED", "QUEUED_FOR_PRINT", "GENERATED", "DISPATCHED"].includes(card.status) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentLevel = accessLevels?.find((l) => l.levelName === card.accessLevelName);
                    setSelectedLevelId(currentLevel?.id ?? null);
                    setLevelRemarks("");
                    setShowChangeLevel(true);
                  }}
                  className="gap-1.5"
                >
                  <KeyRound className="h-4 w-4 text-credential" />
                  <span>Change Access Level</span>
                </Button>
              )}

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

          {/* Lifecycle Timeline Card in Right Column */}
          <Card>
            <CardHeader className="pb-3 border-b border-rule">
              <CardTitle className="text-base font-bold text-ink">Lifecycle Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StatusTimeline entries={timeline ?? []} />
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
      <Dialog open={showChangeLevel} onOpenChange={setShowChangeLevel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Card Access Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <p className="text-sm text-slate">
              Reassign access level for <strong>{card.printedName}</strong> ({card.cardSerial}). This determines which physical security areas the card can enter.
            </p>
            <div className="space-y-2">
              <Label htmlFor="access-level">Security Access Level</Label>
              <Select
                value={selectedLevelId ? String(selectedLevelId) : ""}
                onValueChange={(val) => setSelectedLevelId(Number(val))}
              >
                <SelectTrigger id="access-level">
                  <SelectValue placeholder="Select Access Level..." />
                </SelectTrigger>
                <SelectContent>
                  {accessLevels?.filter((l) => l.active).map((lvl) => (
                    <SelectItem key={lvl.id} value={String(lvl.id)}>
                      {lvl.levelName} ({lvl.levelCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks / Reason</Label>
              <Input
                id="remarks"
                value={levelRemarks}
                onChange={(e) => setLevelRemarks(e.target.value)}
                placeholder="e.g., Promoted to Level 2 or Project requirement"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeLevel(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedLevelId || assignAccessLevel.isPending}
              onClick={() => {
                if (!selectedLevelId) return;
                void run(async () => {
                  await assignAccessLevel.mutateAsync({
                    cardId,
                    levelId: selectedLevelId,
                    remarks: levelRemarks || undefined,
                  });
                  setShowChangeLevel(false);
                  void refetch();
                }, "Access level updated successfully", "Failed to update access level");
              }}
            >
              {assignAccessLevel.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
