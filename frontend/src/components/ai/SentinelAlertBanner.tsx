"use client";

import { useState } from "react";
import { ShieldAlert, AlertTriangle, Radio, ExternalLink, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SentinelAlertBannerProps {
  lastAnomaly?: {
    type: "IMPOSSIBLE_TRAVEL" | "OFF_HOURS_ANOMALY" | "PRIVILEGE_CREEP";
    credentialRef: string;
    holderName: string;
    message: string;
    speedKmh?: number;
    areaName?: string;
  } | null;
  onOpenAudit?: (credentialRef: string) => void;
}

export function SentinelAlertBanner({ lastAnomaly, onOpenAudit }: SentinelAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!lastAnomaly || dismissed) return null;

  const isImpossibleTravel = lastAnomaly.type === "IMPOSSIBLE_TRAVEL";

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 shadow-md transition-all duration-300",
        isImpossibleTravel
          ? "border-rose-300 bg-gradient-to-r from-rose-50 via-rose-100/60 to-orange-50 text-rose-950"
          : "border-amber-300 bg-amber-50 text-amber-950"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              isImpossibleTravel ? "bg-rose-600 text-white animate-pulse" : "bg-amber-500 text-white"
            )}
          >
            {isImpossibleTravel ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 border border-rose-300/80">
                🚨 Real-Time Physical Sentinel
              </span>
              <span className="text-xs font-semibold text-rose-800">
                {isImpossibleTravel ? "Impossible Travel / Badge Sharing Detected" : "Off-Hours Security Anomaly"}
              </span>
            </div>

            <p className="text-xs text-rose-900 leading-relaxed font-medium">
              {lastAnomaly.message}
            </p>

            <div className="flex items-center gap-3 pt-1 text-[11px] text-rose-800/80">
              <span className="flex items-center gap-1 font-mono font-semibold">
                <MapPin className="h-3 w-3" />
                Ref: {lastAnomaly.credentialRef} ({lastAnomaly.holderName})
              </span>
              {lastAnomaly.speedKmh && (
                <span className="font-mono bg-rose-200/60 px-1.5 py-0.5 rounded text-rose-900 font-bold">
                  Velocity: {lastAnomaly.speedKmh.toFixed(1)} km/h
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenAudit && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 border-rose-300 bg-white hover:bg-rose-50 text-rose-900"
              onClick={() => onOpenAudit(lastAnomaly.credentialRef)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Copilot Audit
            </Button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-md"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
