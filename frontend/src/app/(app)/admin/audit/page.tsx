"use client";

import { useState } from "react";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { useAuditLog, type AuditAction, type AuditLogRow } from "@/lib/audit";

const ACTIONS: AuditAction[] = [
  "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "LOGIN", "LOGOUT", "APPROVE", "REJECT", "REVOKE",
];

function formatValue(json: string | null) {
  if (!json) return "—";
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  } catch {
    return json;
  }
}

export default function AuditLogPage() {
  const [entityName, setEntityName] = useState("");
  const [username, setUsername] = useState("");
  const [action, setAction] = useState<AuditAction | undefined>();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useAuditLog({
    entityName: entityName || undefined,
    username: username || undefined,
    action,
    page,
  });

  const columns: Column<AuditLogRow>[] = [
    { key: "performedAt", header: "When",
      render: (r) => (
        <span className="identifier text-slate">{new Date(r.performedAt).toLocaleString()}</span>
      ) },
    { key: "entity", header: "Entity",
      render: (r) => (
        <span className="identifier">{r.entityName} #{r.entityId}</span>
      ) },
    { key: "action", header: "Action", render: (r) => <StatusBadge status={r.action} /> },
    { key: "user", header: "By", render: (r) => r.performedByUsername },
    { key: "change", header: "Change",
      render: (r) => (
        <span className="text-xs text-slate">
          {r.oldValue && <span className="line-through">{formatValue(r.oldValue)}</span>}
          {r.oldValue && r.newValue && " → "}
          {formatValue(r.newValue)}
        </span>
      ) },
  ];

  // The table keys rows on `id`; nothing here is clickable to a detail
  // screen, so no rowHref -- this is a read record, not a workflow.
  const rows = data ? { ...data, content: data.content } : data;

  return (
    <RequireRole allow={["SYSTEM_ADMIN"]}>
      <PageHeader
        title="Audit log"
        description="Every critical create, update, decision and login across all six modules, in one trail."
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="Entity (e.g. card_requests)"
          value={entityName}
          onChange={(e) => { setEntityName(e.target.value); setPage(0); }}
          aria-label="Filter by entity"
        />
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setPage(0); }}
          aria-label="Filter by username"
        />
        <select
          value={action ?? ""}
          onChange={(e) => { setAction((e.target.value || undefined) as AuditAction | undefined); setPage(0); }}
          aria-label="Filter by action"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replaceAll("_", " ").toLowerCase()}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        page={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onPageChange={setPage}
        empty={{ title: "No matching audit entries", body: "Try widening or clearing the filters above." }}
      />
    </RequireRole>
  );
}
