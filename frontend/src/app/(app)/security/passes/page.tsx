"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Field } from "@/components/form/field";
import { FormShell } from "@/components/form/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { useAccessLevels } from "../../it/_hooks/useConfig";
import { passes, type PassRow } from "../_hooks/useVisitors";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PassesPage() {
  const { data, isLoading, isError, refetch } = passes.useList({ sort: "createdAt,desc" });
  const issue = passes.useCreate();
  const { data: levels } = useAccessLevels();

  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const [showIssue, setShowIssue] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  const [hostEmployeeId, setHostEmployeeId] = useState("");
  const [accessLevelId, setAccessLevelId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [validFrom, setValidFrom] = useState(toLocalInputValue(now));
  const [validUntil, setValidUntil] = useState(toLocalInputValue(inTwoHours));
  const [formError, setFormError] = useState<string | null>(null);

  const selectedLevel = levels?.find((l) => String(l.id) === accessLevelId);

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await issue.mutateAsync({
        visitorId: Number(visitorId), hostEmployeeId: Number(hostEmployeeId),
        accessLevelId: Number(accessLevelId), purpose,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
      });
      toast.success("Pass issued");
      setShowIssue(false);
      setVisitorId(""); setHostEmployeeId(""); setAccessLevelId(""); setPurpose("");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.problem.detail ?? "Could not issue the pass" : "Cannot reach the server");
    }
  }

  const columns: Column<PassRow>[] = [
    { key: "passNo", header: "Pass", render: (p) => <span className="identifier">{p.passNo}</span> },
    { key: "visitorName", header: "Visitor", render: (p) => `${p.visitorName} (${p.visitorCode})` },
    { key: "hostName", header: "Host", render: (p) => p.hostName },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "validUntil", header: "Valid until", render: (p) => new Date(p.validUntil).toLocaleString() },
  ];

  return (
    <RequireRole allow={["SECURITY_OFFICER"]}>
      <PageHeader
        title="Passes"
        description="Every temporary pass issued -- a visitor without an access level cannot be issued one at all."
        actions={<Button onClick={() => setShowIssue(true)}>Issue pass</Button>}
      />

      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        rowHref={(p) => `/security/passes/${p.id}`}
        empty={{ title: "No passes issued yet", body: "Issue one once a visitor is registered." }}
      />

      <Dialog open={showIssue} onOpenChange={setShowIssue}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue pass</DialogTitle></DialogHeader>
          <FormShell onSubmit={onIssue} formError={formError} isPending={issue.isPending}
                     submitLabel="Issue" onCancel={() => setShowIssue(false)}>
            <Field label="Visitor ID" name="visitorId" required hint="From the Visitors screen">
              <Input type="number" value={visitorId} onChange={(e) => setVisitorId(e.target.value)} required />
            </Field>
            <Field label="Host employee ID" name="hostEmployeeId" required>
              <Input type="number" value={hostEmployeeId} onChange={(e) => setHostEmployeeId(e.target.value)} required />
            </Field>
            <Field label="Access level" name="accessLevelId" required>
              <select className="w-full rounded-card border border-rule bg-surface px-3 py-2 text-sm"
                      value={accessLevelId} onChange={(e) => setAccessLevelId(e.target.value)} required>
                <option value="">Select a level</option>
                {levels?.map((l) => <option key={l.id} value={l.id}>{l.levelName}</option>)}
              </select>
            </Field>
            {selectedLevel && (
              <p className="text-sm text-slate">
                Permits: {selectedLevel.permittedAreas.map((a) => a.areaName).join(", ") || "nothing yet"}
              </p>
            )}
            <Field label="Purpose" name="purpose" required>
              <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={255} required />
            </Field>
            <Field label="Valid from" name="validFrom" required>
              <Input type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
            </Field>
            <Field label="Valid until" name="validUntil" required>
              <Input type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
            </Field>
          </FormShell>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}
