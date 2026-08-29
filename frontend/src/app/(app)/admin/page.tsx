"use client";

import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, TableSkeleton } from "@/components/states";
import { dashboard } from "@/lib/dashboard";

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = dashboard.useAdmin();

  return (
    <RequireRole allow={["SYSTEM_ADMIN"]}>
      <PageHeader
        title="Administration"
        description="System-wide configuration, users and the audit trail."
      />

      <StatTileRow>
        <StatTile label="Users" value={data?.users ?? 0} />
        <StatTile label="Audit entries today" value={data?.auditEntriesToday ?? 0} href="/admin/audit" />
        <StatTile
          label="Accounts with failed logins"
          value={data?.failedLogins ?? 0}
          tone={data && data.failedLogins > 0 ? "pending" : "neutral"}
        />
      </StatTileRow>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Link href="/admin/audit" className="text-sm text-credential underline-offset-4 hover:underline">
            Full audit log
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading && <TableSkeleton rows={5} />}
          {isError && <ErrorState body="Recent activity could not be loaded." onRetry={() => void refetch()} />}
          {data && data.recentActivity.length === 0 && (
            <p className="text-sm text-slate">No audit activity recorded yet.</p>
          )}
          {data && data.recentActivity.length > 0 && (
            <div className="divide-y divide-rule">
              {data.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="identifier">{a.entityName} #{a.entityId}</span>
                  <StatusBadge status={a.action} />
                  <span className="text-slate">{a.performedBy}</span>
                  <span className="identifier text-xs text-slate">
                    {new Date(a.performedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </RequireRole>
  );
}
