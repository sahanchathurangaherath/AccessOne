"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAccessTest, type AccessLevelDto, type AreaDto } from "../_hooks/useConfig";

export function RuleTestPanel({ levels, areas }: { levels: AccessLevelDto[]; areas: AreaDto[] }) {
  const [levelId, setLevelId] = useState<string>("");
  const [areaId, setAreaId] = useState<string>("");
  const test = useAccessTest();

  function run() {
    if (!levelId || !areaId) return;
    test.mutate({ levelId: Number(levelId), areaId: Number(areaId) });
  }

  const result = test.data;

  return (
    <div className="rounded-card border border-rule bg-surface p-4">
      <h2 className="font-medium">Test a rule</h2>
      <p className="mt-1 text-sm text-slate">
        Check what would happen at a door, without needing a card.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-48 space-y-1.5">
          <label className="text-sm font-medium">Access level</label>
          <Select value={levelId} onValueChange={(v) => setLevelId(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a level" /></SelectTrigger>
            <SelectContent>
              {levels.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>{l.levelCode} — {l.levelName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-48 space-y-1.5">
          <label className="text-sm font-medium">Area</label>
          <Select value={areaId} onValueChange={(v) => setAreaId(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose an area" /></SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.areaCode} — {a.areaName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={run} disabled={!levelId || !areaId || test.isPending}>
          Test
        </Button>
      </div>

      {result && (
        <div className={`mt-4 rounded-card border px-3 py-2 ${
          result.granted
            ? "border-granted/30 bg-granted/5"
            : "border-denied/30 bg-denied/5"}`}>
          <p className={`font-medium ${result.granted ? "text-granted" : "text-denied"}`}>
            {result.granted ? "GRANTED" : "DENIED"}
          </p>
          {result.denialReason && (
            <p className="mt-1 text-sm text-ink">{result.denialReason}</p>
          )}
        </div>
      )}
    </div>
  );
}
