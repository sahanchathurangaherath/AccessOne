"use client";

import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { dashboard } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/utils";
import {
  Users,
  User,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Shield,
  Activity,
  Server,
  Key,
  IdCard,
  UserPlus,
  Database,
  Lock,
  ArrowUpRight,
  Layers,
  SlidersHorizontal,
} from "lucide-react";

const ADMIN_LAUNCHERS = [
  {
    href: "/hr/employees",
    title: "User Accounts & Provisioning",
    description: "Create employee profiles, assign system roles, and trigger credential resets.",
    icon: <Users className="h-5 w-5 text-blue-600" />,
    badge: "Identity",
  },
  {
    href: "/admin/audit",
    title: "Immutable Audit Log",
    description: "Search tamper-evident event logs, actor identities, and entity state changes.",
    icon: <FileText className="h-5 w-5 text-emerald-600" />,
    badge: "Compliance",
  },
  {
    href: "/it/areas",
    title: "Security Zones & Turnstiles",
    description: "Inspect physical building zones, readers, and perimeter authorization points.",
    icon: <Key className="h-5 w-5 text-amber-600" />,
    badge: "Physical",
  },
  {
    href: "/it/cards",
    title: "Credential Directory",
    description: "Audit active, printed, suspended, and decommissioned RFID badges.",
    icon: <IdCard className="h-5 w-5 text-indigo-600" />,
    badge: "Credentials",
  },
];

const SYSTEM_SERVICES = [
  { name: "Core API & Routing Engine", detail: "REST Services v1 Active", status: "Operational" },
  { name: "Database & Connection Pool", detail: "HikariCP / SQL Server Connected", status: "Operational" },
  { name: "Security & Role Guard", detail: "JWT & BCrypt Authentication Active", status: "Enforced" },
  { name: "Audit Trail Immutability", detail: "WORM Event Ledger Active", status: "Tamper-Evident" },
  { name: "Card Cryptography Gateway", detail: "13.56 MHz RFID / QR Generator", status: "Online" },
];

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = dashboard.useAdmin();

  return (
    <RequireRole allow={["SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* ─── Top Header & Status ─── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                System Administration
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Operational
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              System-wide telemetry, user account directories, privilege governance, and immutable security audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/hr/employees"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>User Accounts</span>
            </Link>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Audit Trail</span>
            </Link>
            <Link
              href="/it"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <span>Infrastructure</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. Executive Metric KPI Tiles ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Registered Users */}
          <Link href="/hr/employees" className="group block focus-visible:outline-none">
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Registered Users
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-ink">{data?.users ?? 0}</span>
                <span className="text-xs font-medium text-slate-500">accounts</span>
              </div>
              <div className="mt-2 text-[11px] text-blue-600 flex items-center gap-1 font-medium">
                <span>Manage directory &rarr;</span>
              </div>
            </div>
          </Link>

          {/* Audit Entries Today */}
          <Link href="/admin/audit" className="group block focus-visible:outline-none">
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Audit Entries Today
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                  <FileText className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">{data?.auditEntriesToday ?? 0}</span>
                <span className="text-xs font-medium text-emerald-600">events logged</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Immutable WORM ledger</span>
              </div>
            </div>
          </Link>

          {/* Failed Login Incidents */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Failed Logins
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs ${
                  data && data.failedLogins > 0
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-2xl font-black ${
                  data && data.failedLogins > 0 ? "text-amber-700" : "text-ink"
                }`}
              >
                {data?.failedLogins ?? 0}
              </span>
              <span className="text-xs font-medium text-slate-500">incidents</span>
            </div>
            <div
              className={`mt-2 text-[11px] flex items-center gap-1 font-medium ${
                data && data.failedLogins > 0 ? "text-amber-700" : "text-slate-500"
              }`}
            >
              <span>{data && data.failedLogins > 0 ? "Potential threat alert" : "Zero unauthorized lockouts"}</span>
            </div>
          </div>

          {/* Access Policy Governance */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Security Policy
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-700">RBAC</span>
              <span className="text-xs font-medium text-indigo-600">Active</span>
            </div>
            <div className="mt-2 text-[11px] text-indigo-700 flex items-center gap-1 font-medium">
              <span>6 permission matrices enforced</span>
            </div>
          </div>
        </div>

        {/* ─── 2. Quick Administration Consoles ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_LAUNCHERS.map((s) => (
            <Link key={s.href} href={s.href} className="group block focus-visible:outline-none">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-rule bg-surface p-4.5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 shadow-2xs group-hover:scale-105 transition-transform">
                      {s.icon}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {s.badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-ink group-hover:text-credential transition-colors">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-3.5 flex items-center gap-1 text-[11px] font-semibold text-credential group-hover:underline">
                  <span>Open Console</span>
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ─── 3. Main Balanced 2-Column Section (Eliminating Empty Space) ─── */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Panel: Recent Audit Trail Events (8 columns) */}
          <div className="lg:col-span-8 rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule px-5 py-4 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-credential border border-blue-100 shadow-2xs">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="topic-title text-ink">Live Audit Activity Stream</h3>
                  <p className="text-xs text-slate-500">
                    Chronological stream of cryptographic modifications and identity events
                  </p>
                </div>
              </div>
              <Link
                href="/admin/audit"
                className="flex items-center gap-1 text-xs font-bold text-credential hover:underline self-end sm:self-center"
              >
                <span>Full audit explorer</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex-1 overflow-x-auto">
              {isLoading && (
                <div className="p-5">
                  <TableSkeleton rows={6} />
                </div>
              )}
              {isError && (
                <div className="p-5">
                  <ErrorState
                    body="Recent audit activity could not be loaded."
                    onRetry={() => void refetch()}
                  />
                </div>
              )}
              {data && data.recentActivity.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  No administrative actions logged today yet.
                </div>
              )}
              {data && data.recentActivity.length > 0 && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-rule bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-4 w-[28%]">Target Entity</th>
                      <th className="py-2.5 px-4 w-[24%]">Action Event</th>
                      <th className="py-2.5 px-4 w-[24%]">Performed By</th>
                      <th className="py-2.5 px-4 w-[24%] text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {data.recentActivity.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="identifier font-bold text-xs text-credential bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100/80">
                            {a.entityName} #{a.entityId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={a.action} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                            <User className="h-3 w-3 text-slate-400" />
                            <span>{a.performedBy}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="identifier text-[11px] text-slate-500 font-medium">
                            {formatDateTime(a.performedAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Column: Platform Services & Governance Actions (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* System Services Telemetry */}
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-credential" />
                  <h3 className="topic-title text-ink">Platform Telemetry</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  HEALTHY
                </span>
              </div>

              <div className="space-y-3">
                {SYSTEM_SERVICES.map((srv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-rule/50"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-ink truncate">{srv.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{srv.detail}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex-shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {srv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Administrative Shortcuts */}
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-rule pb-3">
                <Shield className="h-4 w-4 text-credential" />
                <h3 className="topic-title text-ink">Governance Tasks</h3>
              </div>

              <div className="space-y-2">
                <Link
                  href="/hr/employees"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-rule/60 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-xs font-semibold text-slate-700 group"
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    <span>Onboard New Operator / Staff</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/admin/audit"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-rule/60 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-xs font-semibold text-slate-700 group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span>Filter Security Event Logs</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/it/access-levels"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-rule/60 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs font-semibold text-slate-700 group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <span>Review Access Clearances</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/it/cards"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-rule/60 hover:border-amber-300 hover:bg-amber-50/40 transition-all text-xs font-semibold text-slate-700 group"
                >
                  <div className="flex items-center gap-2.5">
                    <IdCard className="h-4 w-4 text-amber-600" />
                    <span>Inspect Issued Badges</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
