"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api";
import { useAreas } from "../../it/_hooks/useConfig";
import { useEvaluate, useRecentAttempts, type AccessResult, type Direction } from "../_hooks/useEntry";

/**
 * The demo centrepiece: simulates a card reader. Large inputs, an
 * unmistakable GRANTED/DENIED result, and a visible log line -- this
 * replaces physical reader hardware for the purpose of showing the whole
 * system converge on one decision call.
 */
export default function EntryPointPage() {
  const { data: areas } = useAreas();
  const [credentialRef, setCredentialRef] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [direction, setDirection] = useState<Direction>("IN");
  const [result, setResult] = useState<AccessResult | null>(null);
  const evaluate = useEvaluate();
  const recent = useRecentAttempts();
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!credentialRef || !areaCode || evaluate.isPending) return;
    try {
      const outcome = await evaluate.mutateAsync({ credentialRef, areaCode, direction });
      setResult(outcome);
    } catch (error) {
      toast.error(error instanceof ApiError ? (error.problem.detail ?? "Could not evaluate this credential") : "Cannot reach the server");
    } finally {
      setCredentialRef("");
      inputRef.current?.focus();      // ready for the next scan
    }
  }

  return (
    <RequireRole allow={["SECURITY_OFFICER"]}>
      <PageHeader
        title="Entry point"
        description="Simulates a card reader. Present a credential and choose an area."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-card border border-rule bg-surface p-6">
          <Field label="Credential" name="credentialRef" required
                 hint="Card serial or pass number -- scan or type">
            <input
              ref={inputRef}
              value={credentialRef}
              onChange={(e) => setCredentialRef(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
              autoFocus
              className="identifier w-full rounded-card border border-rule bg-paper px-4 py-3 text-lg tracking-wide"
              placeholder="ACO-2026-000001"
            />
          </Field>

          <Field label="Direction" name="direction" required>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
              className="w-full rounded-card border border-rule bg-surface px-3 py-2 text-sm"
            >
              <option value="IN">In</option>
              <option value="OUT">Out</option>
            </select>
          </Field>

          <Field label="Area" name="areaCode" required>
            <select
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              className="w-full rounded-card border border-rule bg-surface px-3 py-2 text-sm"
            >
              <option value="">Select an area</option>
              {(areas ?? []).map((a) => (
                <option key={a.areaCode} value={a.areaCode}>
                  {a.areaName}{a.restricted ? " (restricted)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Button size="lg" className="w-full" onClick={() => void submit()}
                  disabled={!credentialRef || !areaCode || evaluate.isPending}>
            {evaluate.isPending ? "Checking…" : "Present credential"}
          </Button>
        </div>

        {/* The result. Large, unmistakable, readable from across a room. */}
        <div aria-live="polite" aria-atomic="true">
          {result ? (
            <div className={`rounded-card border-2 p-8 text-center ${
              result.granted
                ? "border-granted bg-granted/5"
                : "border-denied bg-denied/5"}`}>
              <p className={`text-4xl font-semibold tracking-tight ${
                result.granted ? "text-granted" : "text-denied"}`}>
                {result.granted ? "GRANTED" : "DENIED"}
              </p>

              {result.denialReason && (
                <p className="mt-3 text-base text-ink">{result.denialReason}</p>
              )}

              <dl className="mt-6 space-y-1 text-left text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Holder</dt>
                  <dd className="text-right font-medium">{result.holderName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Area</dt>
                  <dd className="text-right font-medium">{result.areaName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Logged as</dt>
                  <dd className="identifier text-right">#{result.logId}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-card border border-dashed border-rule text-center text-sm text-slate">
              Present a credential to see the decision here.
            </div>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-medium">Recent attempts</h2>
        <div className="overflow-hidden rounded-card border border-rule bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-rule bg-paper text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Credential</th>
                <th className="px-4 py-2 font-medium">Holder</th>
                <th className="px-4 py-2 font-medium">Area</th>
                <th className="px-4 py-2 font-medium">Decision</th>
                <th className="px-4 py-2 font-medium">Reason</th>
                <th className="px-4 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {(recent.data?.content ?? []).map((row) => (
                <tr key={row.id} className="border-b border-rule last:border-0">
                  <td className="identifier px-4 py-2">{row.credentialRef}</td>
                  <td className="px-4 py-2">{row.holderName}</td>
                  <td className="px-4 py-2">{row.areaName}</td>
                  <td className="px-4 py-2"><StatusBadge status={row.decision} /></td>
                  <td className="px-4 py-2 text-slate">{row.denialReason ?? "—"}</td>
                  <td className="px-4 py-2 text-slate">{new Date(row.accessTime).toLocaleTimeString()}</td>
                </tr>
              ))}
              {(recent.data?.content ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate">No attempts recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </RequireRole>
  );
}
