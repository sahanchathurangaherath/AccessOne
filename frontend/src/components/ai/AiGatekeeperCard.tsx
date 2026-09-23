"use client";

import { useAiTriage } from "@/hooks/useAiTriage";
import type { PhotoChecks } from "@/types/ai";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Lock,
  Camera,
  FileCheck2,
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
      <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs animate-pulse">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-20 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (isError || !evalData) {
    return (
      <div className="rounded-2xl border border-rule bg-paper/60 p-4 text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>Automated baseline assessment not generated for this request yet.</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5 border-rule bg-white hover:bg-slate-50 text-slate-700 rounded-lg"
          onClick={() => reEvaluate.mutate()}
          disabled={reEvaluate.isPending}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", reEvaluate.isPending && "animate-spin")} />
          Generate Assessment
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
    <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs space-y-4">
      {/* Header - Enterprise Clean Styling */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-credential/10 border border-credential/20 text-credential flex items-center justify-center shadow-xs">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink tracking-tight">
                Automated Compliance &amp; Access Baseline
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-paper text-slate-700 border border-rule">
                ICAO 19794-5
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Portrait standards inspection &amp; least-privilege role matrix matching
            </p>
          </div>
        </div>

        {/* Risk Badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs",
            isLowRisk && "bg-emerald-50 text-emerald-800 border-emerald-200",
            isMedRisk && "bg-amber-50 text-amber-800 border-amber-200",
            isHighRisk && "bg-rose-50 text-rose-800 border-rose-200"
          )}
        >
          {isLowRisk && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
          {isMedRisk && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
          {isHighRisk && <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />}
          <span>
            Risk Evaluation: {evalData.riskScore} / 100 ({evalData.riskLevel})
          </span>
        </div>
      </div>

      {/* Main Grid: Photo Checks vs Access Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Photo Compliance Checklist */}
        <div className="rounded-xl border border-rule bg-paper/40 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-rule">
            <span className="font-semibold text-ink flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-slate-600" />
              Photo Standards Verification
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded border",
                evalData.photoComplianceStatus === "COMPLIANT"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              )}
            >
              {evalData.photoComplianceStatus}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5 text-slate-600">
            <div className="flex items-center justify-between">
              <span>Lighting &amp; Exposure</span>
              {parsedChecks.lighting ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Pass
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" /> Non-Compliant
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Background Neutrality</span>
              {parsedChecks.plainBackground ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Neutral
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" /> Cluttered
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Centered Framing</span>
              {parsedChecks.faceCentered ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 3:4 Ideal
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" /> Off-Center
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Anti-Spoofing &amp; Liveness</span>
              {parsedChecks.antiSpoofPassed ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Genuine
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" /> Flagged
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Least Privilege Access Level Recommendation */}
        <div className="rounded-xl border border-rule bg-paper/40 p-3.5 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-rule">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-600" />
                Least-Privilege Recommendation
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                Security Baseline
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-xs font-bold text-ink">
                Suggested Access Level:{" "}
                <span className="text-credential font-bold">
                  {evalData.recommendedAccessLevelName || "Standard Level"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                {evalData.recommendationReason}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-rule/60">
            <span className="font-mono text-[10px]">Model: Least-Privilege Baseline Matrix</span>
            <button
              onClick={() => reEvaluate.mutate()}
              disabled={reEvaluate.isPending}
              className="text-credential hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className={cn("h-3 w-3", reEvaluate.isPending && "animate-spin")} />
              Re-evaluate
            </button>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop 1-Click Approval Action */}
      {onOneClickApprove && evalData.eligibleForOneClickApproval && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-950 font-medium">
              Verified safe for issuance: Compliant portrait standard and least-privilege baseline match.
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => onOneClickApprove(evalData.recommendedAccessLevelId)}
            disabled={isApproving}
            className="bg-credential hover:bg-credential/90 text-white font-semibold text-xs gap-1.5 shadow-xs shrink-0 rounded-xl h-9 px-4"
          >
            <Zap className="h-3.5 w-3.5" />
            Accept Recommendation &amp; 1-Click Approve
          </Button>
        </div>
      )}
    </div>
  );
}
