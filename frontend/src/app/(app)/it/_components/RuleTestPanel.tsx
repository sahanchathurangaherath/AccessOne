"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAccessTest, type AccessLevelDto, type AreaDto } from "../_hooks/useConfig";
import {
  ShieldCheck,
  ShieldAlert,
  Wifi,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RuleTestPanel({ levels, areas }: { levels: AccessLevelDto[]; areas: AreaDto[] }) {
  const [levelId, setLevelId] = useState<string>("");
  const [areaId, setAreaId] = useState<string>("");
  const test = useAccessTest();

  function run() {
    if (!levelId || !areaId) return;
    test.mutate({ levelId: Number(levelId), areaId: Number(areaId) });
  }

  const result = test.data;
  const selectedLevel = levels.find((l) => String(l.id) === levelId);
  const selectedArea = areas.find((a) => String(a.id) === areaId);

  return (
    <div className="rounded-2xl border border-rule bg-surface p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-rule pb-4">
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-credential" />
            Live Access Rule Simulator & Diagnostics Engine
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Simulate a physical badge scan at a door turnstile without requiring a physical RFID card.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 self-start sm:self-auto">
          Decision Engine Sandbox
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Input Parameters */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Target Access Level
              </label>
              <Select value={levelId} onValueChange={(v) => setLevelId(v ?? "")}>
                <SelectTrigger className="w-full rounded-xl bg-paper">
                  <SelectValue placeholder="Select an Access Level tier" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {levels.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      <span className="font-mono font-bold text-ink">{l.levelCode}</span> &bull; {l.levelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Physical Security Zone / Door
              </label>
              <Select value={areaId} onValueChange={(v) => setAreaId(v ?? "")}>
                <SelectTrigger className="w-full rounded-xl bg-paper">
                  <SelectValue placeholder="Select a Security Area" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      <span className="font-mono font-bold text-ink">{a.areaCode}</span> &bull; {a.areaName}
                      {a.restricted ? " (Restricted)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={run}
              disabled={!levelId || !areaId || test.isPending}
              className="gap-2 rounded-xl bg-credential text-white hover:bg-credential/90 shadow-xs text-xs font-semibold px-4 h-9"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Simulate Badge Tap</span>
            </Button>
            {result && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => test.reset()}
                className="gap-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Diagnostic</span>
              </Button>
            )}
          </div>
        </div>

        {/* Turnstile Visualizer */}
        <div className="rounded-2xl border border-rule bg-paper p-4 flex flex-col items-center justify-center text-center space-y-3">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 shadow-xs",
              !result
                ? "border-slate-200 bg-white text-slate-400"
                : result.granted
                ? "border-emerald-400 bg-emerald-50 text-emerald-600 shadow-md ring-4 ring-emerald-500/20"
                : "border-red-400 bg-red-50 text-red-600 shadow-md ring-4 ring-red-500/20"
            )}
          >
            {!result ? (
              <Wifi className="h-7 w-7 rotate-90" />
            ) : result.granted ? (
              <Unlock className="h-7 w-7 animate-bounce" />
            ) : (
              <Lock className="h-7 w-7" />
            )}
          </div>

          <div>
            <span className="text-xs font-bold text-ink block">
              {!result ? "Standby / Reader Idle" : result.granted ? "TURNSTILE UNLOCKED" : "ACCESS DENIED"}
            </span>
            <span className="text-[11px] text-slate-400">
              {!result
                ? "Select a level and area to test"
                : result.granted
                ? "Relay triggered for 5.0 seconds"
                : "Alarm sensor log recorded"}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Diagnostic Banner */}
      {result && (
        <div
          className={cn(
            "rounded-2xl border p-4 text-xs transition-all flex items-start gap-3",
            result.granted
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-red-200 bg-red-50/80 text-red-900"
          )}
        >
          {result.granted ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {result.granted ? "DECISION: GRANTED" : "DECISION: DENIED"}
              </span>
              <span className="font-mono text-[11px] opacity-75">
                [{selectedLevel?.levelCode} &rarr; {selectedArea?.areaCode}]
              </span>
            </div>
            <p className="text-xs opacity-90 leading-relaxed">
              {result.granted
                ? `The entry-point decision engine validated that access level ${selectedLevel?.levelName} (${selectedLevel?.levelCode}) holds explicit entry authorization to ${selectedArea?.areaName} (${selectedArea?.areaCode}).`
                : result.denialReason || `Access level ${selectedLevel?.levelName} does not have entry clearance for ${selectedArea?.areaName}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
