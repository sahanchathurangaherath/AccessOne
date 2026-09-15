"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cards, useSuspend, useReinstate } from "../_hooks/useCards";
import { CardPreview } from "./CardPreview";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  X,
  CreditCard,
  Wifi,
  ExternalLink,
  Shield,
  Calendar,
  Building,
  User,
  Hash,
  Download,
  AlertOctagon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface QuickCardDrawerProps {
  cardId: number | null;
  onClose: () => void;
}

export function QuickCardDrawer({ cardId, onClose }: QuickCardDrawerProps) {
  const { data: card, isLoading, refetch } = cards.useDetail(cardId ?? 0);
  const suspend = useSuspend();
  const reinstate = useReinstate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (cardId) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [cardId, onClose]);

  if (!cardId) return null;

  const handleSuspend = async () => {
    if (!card) return;
    try {
      await suspend.mutateAsync(card.id);
      toast.success(`Card ${card.cardSerial} suspended`);
      void refetch();
    } catch {
      toast.error("Failed to suspend card");
    }
  };

  const handleReinstate = async () => {
    if (!card) return;
    try {
      await reinstate.mutateAsync(card.id);
      toast.success(`Card ${card.cardSerial} reinstated`);
      void refetch();
    } catch {
      toast.error("Failed to reinstate card");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-surface shadow-2xl border-l border-rule animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential border border-blue-200/60 shadow-2xs">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink">Smart Credential Inspection</h2>
                {card && <StatusBadge status={card.status} />}
              </div>
              <p className="identifier text-xs text-slate-500">
                {card?.cardSerial ?? "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-credential" />
              <p className="text-xs text-slate-500 font-medium">Fetching secure credential data...</p>
            </div>
          ) : !card ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center">
              <p className="text-xs font-semibold text-red-700">Credential could not be loaded.</p>
            </div>
          ) : (
            <>
              {/* Physical Card Visualizer */}
              <div className="rounded-2xl border border-rule bg-slate-50/50 p-5 shadow-2xs flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Physical Layout (CR80 Standard)</span>
                  <span className="flex items-center gap-1 text-credential">
                    <Wifi className="h-3 w-3 rotate-90" /> 13.56 MHz RFID
                  </span>
                </div>
                <CardPreview card={card} />
              </div>

              {/* Status Alert Banner if Suspended or Revoked */}
              {card.status === "SUSPENDED" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-start gap-3">
                  <AlertOctagon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Credential Temporarily Suspended:</span> This card will fail verification at physical turnstiles and security checkpoints.
                  </div>
                </div>
              )}

              {card.status === "REVOKED" && (
                <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-xs text-red-800 flex items-start gap-3">
                  <AlertOctagon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Credential Permanently Revoked:</span> {card.revocationReason || "Revoked by authorized administrator."}
                  </div>
                </div>
              )}

              {/* Cardholder & Credential Profile */}
              <div className="rounded-2xl border border-rule bg-surface p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" /> Cardholder Profile
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-paper p-3 border border-rule/60">
                    <span className="text-[11px] font-medium text-slate-400">Cardholder Name</span>
                    <p className="mt-0.5 font-bold text-ink">{card.printedName}</p>
                  </div>
                  <div className="rounded-xl bg-paper p-3 border border-rule/60">
                    <span className="text-[11px] font-medium text-slate-400">Employee ID</span>
                    <p className="mt-0.5 font-bold text-ink identifier">{card.empId}</p>
                  </div>
                  <div className="rounded-xl bg-paper p-3 border border-rule/60">
                    <span className="text-[11px] font-medium text-slate-400">Department</span>
                    <p className="mt-0.5 font-semibold text-slate-700">{card.printedDepartment}</p>
                  </div>
                  <div className="rounded-xl bg-paper p-3 border border-rule/60">
                    <span className="text-[11px] font-medium text-slate-400">Designation</span>
                    <p className="mt-0.5 font-semibold text-slate-700">{card.printedDesignation}</p>
                  </div>
                </div>
              </div>

              {/* Security & Access Profile */}
              <div className="rounded-2xl border border-rule bg-surface p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" /> Physical Security Parameters
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-rule/50 pb-2">
                    <span className="text-slate-500">Access Level Tier</span>
                    <span className="font-bold text-ink">
                      {card.accessLevelName ?? "Standard Staff Access"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-rule/50 pb-2">
                    <span className="text-slate-500">Credential Version</span>
                    <span className="font-bold text-ink">v{card.versionNo}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-rule/50 pb-2">
                    <span className="text-slate-500">Date of Issuance</span>
                    <span className="font-medium text-slate-700">
                      {card.issueDate ? formatDate(card.issueDate) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-rule/50 pb-2">
                    <span className="text-slate-500">Activated Timestamp</span>
                    <span className="font-medium text-slate-700">
                      {card.activatedAt ? formatDate(card.activatedAt) : "Pending Activation"}
                    </span>
                  </div>
                  {card.replacedByCardSerial && (
                    <div className="flex items-center justify-between border-b border-rule/50 pb-2">
                      <span className="text-slate-500">Superseded By</span>
                      <span className="identifier font-bold text-credential">{card.replacedByCardSerial}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Encrypted NFC Payload Preview */}
              {card.nfcPayload && (
                <div className="rounded-2xl border border-rule bg-surface p-5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-slate-400" /> NFC Encrypted Payload
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {card.nfcFormat} &bull; {card.encodingAlgorithm}
                    </span>
                  </div>
                  <div className="identifier break-all rounded-xl bg-slate-900 text-emerald-400 p-3 text-[11px] font-mono leading-relaxed border border-slate-800">
                    {card.nfcPayload}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {card && (
          <div className="border-t border-rule bg-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`/api/v1/cards/${card.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5 rounded-xl text-xs">
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Download PDF</span>
                </Button>
              </a>

              {card.status === "ACTIVE" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSuspend}
                  disabled={suspend.isPending}
                  className="rounded-xl text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  Suspend
                </Button>
              )}

              {card.status === "SUSPENDED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReinstate}
                  disabled={reinstate.isPending}
                  className="rounded-xl text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  Reinstate
                </Button>
              )}
            </div>

            <Link href={`/it/cards/${card.id}`} className="w-full sm:w-auto">
              <Button size="sm" className="w-full gap-1.5 rounded-xl text-xs bg-credential text-white hover:bg-credential/90">
                <span>Open Management Console</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
