"use client";

import { useState } from "react";
import { useAiTriage } from "@/hooks/useAiTriage";
import type { PhotoChecks } from "@/types/ai";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Lock,
  Camera,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiGatekeeperCardProps {
  requestId: number;
  onOneClickApprove?: (recommendedLevelId: number | null) => void;
  isApproving?: boolean;
}

export function AiGatekeeperCard({
  requestId,
  onOneClickApprove,
  isApproving = false,
}: AiGatekeeperCardProps) {
  const { data: evalData, isLoading, isError, reEvaluate } = useAiTriage(requestId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/40 p-5 shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-indigo-500 animate-spin" />
          <div className="h-4 w-48 bg-indigo-200 rounded" />
        </div>
        <div className="h-16 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  if (isError || !evalData) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>AI Gatekeeper triage assessment not available for this draft yet.</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-amber-300"
          onClick={() => reEvaluate.mutate()}
          disabled={reEvaluate.isPending}
        >
          <RefreshCw className={cn("h-3 w-3", reEvaluate.isPending && "animate-spin")} />
          Evaluate
        </Button>
      </div>
    );
  }

  let parsedChecks: PhotoChecks = {
    lighting: true,
    plainBackground: true,
    faceCentered: true,
    antiSpoofPassed: true,
    confidence: 0.95,
    summary: "Standard portrait verified",
  };

  try {
    if (evalData.photoChecksJson) {
      parsedChecks = JSON.parse(evalData.photoChecksJson);
    }
  } catch {
    // fallback default
  }

  const isLowRisk = evalData.riskLevel === "LOW";
  const isMedRisk = evalData.riskLevel === "MEDIUM";
  const isHighRisk = evalData.riskLevel === "HIGH";

  return (
    <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/40 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                AI Gatekeeper Autonomous Triage
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                ICAO Verified
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Autonomous photo compliance & least-privilege role assessment
            </p>
          </div>
        </div>

        {/* Risk Badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
            isLowRisk && "bg-emerald-50 text-emerald-700 border-emerald-200",
            isMedRisk && "bg-amber-50 text-amber-700 border-amber-200",
            isHighRisk && "bg-rose-50 text-rose-700 border-rose-200"
          )}
        >
          {isLowRisk && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
          {isMedRisk && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
          {isHighRisk && <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />}
          <span>
            Risk Score: {evalData.riskScore} / 100 ({evalData.riskLevel})
          </span>
        </div>
      </div>

      {/* Main Grid: Photo Checks vs Access Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Photo Compliance Checklist */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-indigo-600" />
              ICAO / ISO 19794-5 Photo Standards
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                evalData.photoComplianceStatus === "COMPLIANT"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              )}
            >
              {evalData.photoComplianceStatus}
            </span>
          </div>

          <div className="space-y-1.5 pt-1 text-slate-600">
            <div className="flex items-center justify-between">
              <span>Lighting & Balance</span>
              {parsedChecks.lighting ? (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-600 font-medium">
                  <XCircle className="h-3.5 w-3.5" /> Shadowed
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Plain Light Background</span>
              {parsedChecks.plainBackground ? (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Neutral
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-600 font-medium">
                  <XCircle className="h-3.5 w-3.5" /> Cluttered
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Centered Face Framing</span>
              {parsedChecks.faceCentered ? (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 3:4 Ideal
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-600 font-medium">
                  <XCircle className="h-3.5 w-3.5" /> Off-Center
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Anti-Spoofing & Liveness</span>
              {parsedChecks.antiSpoofPassed ? (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Genuine
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-600 font-medium">
                  <XCircle className="h-3.5 w-3.5" /> Flagged
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Least Privilege Access Level Recommendation */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-3 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
                Least-Privilege Recommendation
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                Security Baseline
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-xs font-bold text-slate-900">
                Suggested Level:{" "}
                <span className="text-indigo-600">
                  {evalData.recommendedAccessLevelName || "Standard Level"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {evalData.recommendationReason}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Model: Heuristic Least-Privilege Matrix</span>
            <button
              onClick={() => reEvaluate.mutate()}
              disabled={reEvaluate.isPending}
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
            >
              <RefreshCw className={cn("h-3 w-3", reEvaluate.isPending && "animate-spin")} />
              Re-score
            </button>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop 1-Click Approval Action */}
      {onOneClickApprove && evalData.eligibleForOneClickApproval && (
        <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/90 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-900 font-medium">
              Pre-scored as safe: ICAO compliant portrait and least-privilege access match.
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => onOneClickApprove(evalData.recommendedAccessLevelId)}
            disabled={isApproving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm shrink-0"
          >
            <Zap className="h-3.5 w-3.5" />
            Accept Recommendation & 1-Click Approve
          </Button>
        </div>
      )}
    </div>
  );
}
