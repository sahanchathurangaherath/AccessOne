"use client";

import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { ErrorState, TableSkeleton } from "@/components/states";
import { dashboard } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/utils";
import { Users, FileText, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = dashboard.useAdmin();

  return (
    <RequireRole allow={["SYSTEM_ADMIN"]}>
      <PageHeader
        title="System Administration"
        description="System-wide health indicators, user account directories, and immutable security audit logs."
      />

      <StatTileRow>
        <StatTile
          label="Registered Users"
          value={data?.users ?? 0}
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-blue-50 text-blue-700"
        />
        <StatTile
          label="Audit Entries Today"
          value={data?.auditEntriesToday ?? 0}
          icon={<FileText className="h-5 w-5" />}
          iconBg="bg-emerald-50 text-emerald-700"
          href="/admin/audit"
        />
        <StatTile
          label="Failed Login Incidents"
          value={data?.failedLogins ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-amber-50 text-amber-700"
          tone={data && data.failedLogins > 0 ? "denied" : "neutral"}
        />
      </StatTileRow>

      <div className="surface-panel overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-credential border border-blue-100">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="topic-title text-ink">Recent Audit Trail Events</h3>
              <p className="text-xs text-slate-500">Live stream of administrative actions and credential modifications</p>
            </div>
          </div>
          <Link
            href="/admin/audit"
            className="flex items-center gap-1 text-xs font-bold text-credential hover:underline self-end sm:self-center"
          >
            <span>Full audit log</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="p-6">
          {isLoading && <TableSkeleton rows={5} />}
          {isError && (
            <ErrorState
              body="Recent activity could not be loaded."
              onRetry={() => void refetch()}
            />
          )}
          {data && data.recentActivity.length === 0 && (
            <div className="py-8 text-center text-xs text-slate">
              No audit activity recorded yet today.
            </div>
          )}
          {data && data.recentActivity.length > 0 && (
            <div className="divide-y divide-slate-100">
              {data.recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="identifier font-semibold text-credential">
                      {a.entityName} #{a.entityId}
                    </span>
                    <StatusBadge status={a.action} />
                  </div>
                  <div className="flex items-center gap-4 text-slate">
                    <span className="font-medium text-ink">{a.performedBy}</span>
                    <span className="identifier text-[11px] text-slate">
                      {formatDateTime(a.performedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireRole>
  );
}
