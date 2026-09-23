"use client";

import { useState } from "react";
import { ShieldAlert, AlertTriangle, ExternalLink, X, MapPin, Gauge } from "lucide-react";
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
        "relative rounded-xl border bg-white shadow-xs p-4 transition-all duration-200",
        isImpossibleTravel
          ? "border-rose-200 border-l-4 border-l-rose-600 bg-rose-50/20"
          : "border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/20"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-xs",
              isImpossibleTravel
                ? "bg-rose-100 border-rose-200 text-rose-700"
                : "bg-amber-100 border-amber-200 text-amber-700"
            )}
          >
            {isImpossibleTravel ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                  isImpossibleTravel
                    ? "bg-rose-100/70 text-rose-800 border-rose-200"
                    : "bg-amber-100/70 text-amber-800 border-amber-200"
                )}
              >
                Security Anomaly Detected
              </span>
              <span className="text-xs font-bold text-ink">
                {isImpossibleTravel
                  ? "Impossible Travel / Concurrent Credential Usage"
                  : "Off-Hours Physical Zone Anomaly"}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {lastAnomaly.message}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px]">
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-800 bg-paper px-2 py-0.5 rounded border border-rule">
                <MapPin className="h-3 w-3 text-slate-500" />
                {lastAnomaly.credentialRef} ({lastAnomaly.holderName})
              </span>
              {lastAnomaly.speedKmh && (
                <span className="inline-flex items-center gap-1 font-mono bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded text-rose-800 font-bold">
                  <Gauge className="h-3 w-3 text-rose-600" />
                  Speed: {lastAnomaly.speedKmh.toFixed(1)} km/h
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
              className="h-8 text-xs gap-1.5 border-rule bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg"
              onClick={() => onOpenAudit(lastAnomaly.credentialRef)}
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>Investigate</span>
            </Button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
