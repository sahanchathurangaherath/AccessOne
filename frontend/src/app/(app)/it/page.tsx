"use client";

import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { dashboard } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import {
  IdCard,
  ShieldAlert,
  Clock,
  Shield,
  Building2,
  Key,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Users,
  Lock,
} from "lucide-react";

const SECTIONS = [
  {
    href: "/it/departments",
    title: "Departments & Hierarchy",
    description: "Manage organizational units, division codes, and staff assignments.",
    icon: <Building2 className="h-5 w-5 text-blue-600" />,
    badge: "Structure",
    color: "blue",
  },
  {
    href: "/it/areas",
    title: "Security Areas & Zones",
    description: "Physical buildings, restricted server vaults, and access control points.",
    icon: <Key className="h-5 w-5 text-amber-600" />,
    badge: "Physical Security",
    color: "amber",
  },
  {
    href: "/it/access-levels",
    title: "Access Levels & Matrices",
    description: "Configure permission matrices, time windows, and test door rules in real-time.",
    icon: <Shield className="h-5 w-5 text-indigo-600" />,
    badge: "Permission Matrix",
    color: "indigo",
  },
  {
    href: "/it/cards",
    title: "Enterprise Card Directory",
    description: "Active, printed, lost, and decommissioned RFID contactless credentials.",
    icon: <IdCard className="h-5 w-5 text-emerald-600" />,
    badge: "Credentials",
    color: "emerald",
  },
];

export default function ItDashboard() {
  const { data: stats } = dashboard.useIt();

  return (
    <RequireRole allow={["IT_ADMIN", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                IT Infrastructure & Access Management
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-credential border border-blue-200/60">
                System Ops
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Central command for physical security zones, organizational departments, and door access matrices.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Overview</span>
            </span>
            <Link
              href="/it/departments"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Departments</span>
            </Link>
            <Link
              href="/it/areas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Key className="h-3.5 w-3.5 text-slate-500" />
              <span>Security Areas</span>
            </Link>
            <Link
              href="/it/access-levels"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-slate-500" />
              <span>Access Levels</span>
            </Link>
            <Link
              href="/it/cards"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <IdCard className="h-3.5 w-3.5 text-slate-500" />
              <span>Card Directory</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE INFRASTRUCTURE KPI STATS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Active Issued Cards */}
          <Link href="/it/cards" className="group block focus-visible:outline-none">
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Issued Cards
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                  <IdCard className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">{stats?.activeCards ?? 0}</span>
                <span className="text-xs font-medium text-emerald-600">in active service</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Operational at turnstiles</span>
              </div>
            </div>
          </Link>

          {/* Revoked Credentials */}
          <Link href="/it/cards" className="group block focus-visible:outline-none">
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs transition-all hover:border-red-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Revoked / Voided
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-2xs">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-red-700">{stats?.revokedCards ?? 0}</span>
                <span className="text-xs font-medium text-red-500">decommissioned</span>
              </div>
              <div className="mt-2 text-[11px] text-red-600 flex items-center gap-1">
                <span>Access terminated</span>
              </div>
            </div>
          </Link>

          {/* Awaiting Generation */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Awaiting Generation
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{stats?.awaitingGeneration ?? 0}</span>
              <span className="text-xs font-medium text-amber-600">approved requests</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700 flex items-center gap-1">
              <span>Ready for cryptographic generation</span>
            </div>
          </div>

          {/* Active Access Levels */}
          <Link href="/it/access-levels" className="group block focus-visible:outline-none">
            <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Access Level Tiers
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
                  <Shield className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-700">{stats?.activeAccessLevels ?? 0}</span>
                <span className="text-xs font-medium text-indigo-600">matrix tiers active</span>
              </div>
              <div className="mt-2 text-[11px] text-indigo-700 flex items-center gap-1">
                <span>Enforcing authorization rules</span>
              </div>
            </div>
          </Link>
        </div>

        {/* ─── 2. QUICK LAUNCHER SECTIONS ─── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="group block focus-visible:outline-none">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-rule bg-surface p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 shadow-2xs group-hover:scale-105 transition-transform">
                      {s.icon}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {s.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-ink group-hover:text-credential transition-colors">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-credential group-hover:underline">
                  <span>Open console</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ─── 3. DEPARTMENT CREDENTIAL DISTRIBUTION BREAKDOWN ─── */}
        {stats?.byDepartment && stats.byDepartment.length > 0 && (
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div>
                <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-credential" />
                  Department Credential Distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Live breakdown of active vs. decommissioned RFID credentials across departments
                </p>
              </div>
              <Link href="/it/departments">
                <span className="text-xs font-semibold text-credential hover:underline">
                  Manage Departments &rarr;
                </span>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.byDepartment.map((dept) => (
                <div
                  key={dept.deptCode}
                  className="rounded-xl border border-rule/70 bg-paper p-3.5 space-y-2 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="identifier font-bold text-xs text-ink">{dept.deptCode}</span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {dept.totalCards} total cards
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {dept.deptName}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {dept.activeCards} Active
                    </span>
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      {dept.revokedCards} Revoked
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
