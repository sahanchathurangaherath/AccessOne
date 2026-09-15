"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { StatusBadge } from "@/components/status-badge";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAreas } from "../../it/_hooks/useConfig";
import { useEvaluate, useRecentAttempts, type AccessResult, type Direction } from "../_hooks/useEntry";
import {
  ShieldCheck,
  Users,
  CreditCard,
  History,
  ScanLine,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Sparkles,
  RefreshCw,
  Building,
  KeyRound,
  Radio,
  Clock,
  ShieldAlert,
} from "lucide-react";

/**
 * Modern Turnstile & Door Reader Access Simulator:
 * High-visibility interactive card / QR scanner console with real-time decision engine HUD
 * and live event stream log.
 */
export default function EntryPointPage() {
  const { data: areas, isLoading: areasLoading } = useAreas();
  const [credentialRef, setCredentialRef] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [direction, setDirection] = useState<Direction>("IN");
  const [result, setResult] = useState<AccessResult | null>(null);
  
  const evaluate = useEvaluate();
  const recent = useRecentAttempts();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto select first area if not selected
  const availableAreas = areas ?? [];
  const selectedAreaObj = availableAreas.find((a) => a.areaCode === areaCode);

  async function submit(customRef?: string) {
    const refToUse = customRef ?? credentialRef;
    if (!refToUse || !areaCode || evaluate.isPending) {
      if (!areaCode) {
        toast.error("Please select a physical target area first.");
      }
      return;
    }

    try {
      const outcome = await evaluate.mutateAsync({
        credentialRef: refToUse,
        areaCode,
        direction,
      });
      setResult(outcome);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.problem.detail ?? "Could not evaluate this credential"
          : "Cannot reach the security decision server"
      );
    } finally {
      setCredentialRef("");
      inputRef.current?.focus(); // automatically ready for the next scan
    }
  }

  return (
    <RequireRole allow={["SECURITY_OFFICER", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Access Decision Engine & Gate Simulator
              </h1>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sensor Online
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Interactive physical turnstile scanner simulator for evaluating employee RFID badges and temporary visitor QR passes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/security"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>On-Site Activity</span>
            </Link>
            <Link
              href="/security/visitors"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>Visitor Register</span>
            </Link>
            <Link
              href="/security/passes"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 text-slate-500" />
              <span>Temporary Passes</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <History className="h-3.5 w-3.5" />
              <span>Access Decision Log</span>
            </span>
          </div>
        </div>

        {/* ─── 1. SCANNER CONSOLE & LIVE DECISION DISPLAY ─── */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Hardware Reader Scanner Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4 rounded-2xl border border-rule bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-rule/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-credential shadow-2xs">
                  <ScanLine className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink">Turnstile Reader Simulator</h2>
                  <p className="text-[11px] text-slate-400">Emulates physical gate RFID / Barcode optical hardware</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-paper px-2.5 py-1 rounded-lg border border-rule">
                <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                <span>Reader 01: Main Gate</span>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Target Physical Area Selector */}
              <Field label="Physical Security Zone / Area" name="areaCode" required hint="Where the turnstile barrier is physically situated">
                <select
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  className="w-full h-11 rounded-xl border border-rule bg-paper px-3 text-xs sm:text-sm font-medium text-ink focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20"
                >
                  <option value="">-- Choose Access Area --</option>
                  {availableAreas.map((a) => (
                    <option key={a.areaCode} value={a.areaCode}>
                      {a.areaName} ({a.areaCode}) {a.restricted ? "🔒 [RESTRICTED]" : "🔓 [PUBLIC/GENERAL]"}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Passage Direction Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Turnstile Movement Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDirection("IN")}
                    className={cn(
                      "flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-xs transition-all select-none border",
                      direction === "IN"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-paper text-slate-600 border-rule hover:bg-slate-100"
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>IN (Entry)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("OUT")}
                    className={cn(
                      "flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-xs transition-all select-none border",
                      direction === "OUT"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-paper text-slate-600 border-rule hover:bg-slate-100"
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>OUT (Exit)</span>
                  </button>
                </div>
              </div>

              {/* Credential Reference Input */}
              <Field
                label="Credential Reference (RFID Serial or Pass No)"
                name="credentialRef"
                required
                hint="Scan RFID badge or type pass serial and press Enter"
              >
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={inputRef}
                    value={credentialRef}
                    onChange={(e) => setCredentialRef(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submit();
                    }}
                    autoFocus
                    className="h-12 w-full rounded-xl border border-rule bg-paper pl-10 pr-4 font-mono text-sm tracking-wider text-ink placeholder:text-slate-400 focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20 transition-all"
                    placeholder="e.g. ACO-2026-000001 or PASS-2026-0001"
                  />
                </div>
              </Field>

              {/* Trigger Button */}
              <Button
                size="lg"
                className="w-full h-12 rounded-xl bg-credential text-white hover:bg-credential/90 font-bold text-sm shadow-xs gap-2"
                onClick={() => void submit()}
                disabled={!credentialRef.trim() || !areaCode || evaluate.isPending}
              >
                {evaluate.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Evaluating Access Matrix...</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4" />
                    <span>Present Credential & Evaluate Gate</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Decision Engine Result HUD (5 cols) */}
          <div className="lg:col-span-5 flex flex-col" aria-live="polite" aria-atomic="true">
            {result ? (
              <div
                className={cn(
                  "flex-1 flex flex-col justify-between rounded-2xl border-2 p-6 shadow-md transition-all relative overflow-hidden",
                  result.granted
                    ? "border-emerald-500 bg-gradient-to-b from-emerald-50/70 to-emerald-100/30 text-emerald-950"
                    : "border-rose-500 bg-gradient-to-b from-rose-50/70 to-rose-100/30 text-rose-950"
                )}
              >
                {/* Result Status Banner */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/80 shadow-2xs">
                      Live Decision Result
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      Audit #{result.logId}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center shadow-md mb-2",
                        result.granted ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                      )}
                    >
                      {result.granted ? (
                        <CheckCircle2 className="h-9 w-9" />
                      ) : (
                        <XCircle className="h-9 w-9" />
                      )}
                    </div>

                    <h3
                      className={cn(
                        "text-3xl font-black tracking-tight",
                        result.granted ? "text-emerald-700" : "text-rose-700"
                      )}
                    >
                      {result.granted ? "ACCESS GRANTED" : "ACCESS DENIED"}
                    </h3>

                    {result.denialReason && (
                      <div className="mt-2 rounded-xl bg-rose-100/80 border border-rose-300/80 px-3 py-1.5 text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0" />
                        <span>{result.denialReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity & Scope Summary */}
                <div className="mt-6 space-y-2 rounded-xl bg-white/90 p-4 border border-rule/60 text-xs shadow-2xs">
                  <div className="flex justify-between items-center py-1 border-b border-rule/40">
                    <span className="text-slate-500 font-medium">Credential Holder:</span>
                    <span className="font-bold text-ink">{result.holderName || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-rule/40">
                    <span className="text-slate-500 font-medium">Target Physical Zone:</span>
                    <span className="font-bold text-ink">{result.areaName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Evaluated At:</span>
                    <span className="font-mono text-slate-700">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rule bg-surface p-8 text-center shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                  <ScanLine className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-bold text-ink">Awaiting Gate Scan</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Select a physical area and present a card serial or pass number to see real-time decision authorization.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── 2. RECENT ACCESS ATTEMPTS LOG ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-credential" />
              <h2 className="text-base font-bold text-ink">Live Access Decision Audit Trail</h2>
              <span className="text-xs text-slate-400">
                (Polling live events every 5s)
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void recent.refetch()}
              className="h-8 rounded-xl text-xs gap-1.5 text-slate-600 border-rule hover:bg-slate-50 font-semibold"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", recent.isFetching && "animate-spin")} />
              <span>Refresh Log</span>
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-rule bg-surface shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-rule bg-paper font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Credential Serial</th>
                  <th className="px-4 py-3">Holder Profile</th>
                  <th className="px-4 py-3">Physical Area</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Denial / Audit Reason</th>
                  <th className="px-4 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {(recent.data?.content ?? []).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-xs text-ink">
                      {row.credentialRef}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {row.holderName}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.areaName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold",
                          row.direction === "IN"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        )}
                      >
                        {row.direction === "IN" ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
                        <span>{row.direction}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.decision} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.denialReason || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">
                      {new Date(row.accessTime).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {(recent.data?.content ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                      No gate access attempts recorded in the current session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}

