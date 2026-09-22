"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Field } from "@/components/form/field";
import { FormShell } from "@/components/form/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAccessLevels } from "../../it/_hooks/useConfig";
import { passes, visitors, type PassRow } from "../_hooks/useVisitors";
import {
  CreditCard,
  Plus,
  Search,
  X,
  ShieldCheck,
  Users,
  History,
  Clock,
  Calendar,
  User,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  QrCode,
} from "lucide-react";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const STATUS_FILTERS = [
  { label: "All Passes", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Issued", value: "ISSUED" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Returned", value: "RETURNED" },
];

export default function PassesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, isError, refetch } = passes.useList({ sort: "createdAt,desc" });
  const issue = passes.useCreate();
  const { data: levels } = useAccessLevels();
  const { data: visitorList } = visitors.useList();

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

  const rawRows: PassRow[] = data?.content ?? [];

  // KPI calculations
  const totalCount = rawRows.length;
  const activeCount = rawRows.filter((r) => r.status === "ACTIVE").length;
  const issuedCount = rawRows.filter((r) => r.status === "ISSUED").length;
  const expiredCount = rawRows.filter((r) => r.status === "EXPIRED" || r.status === "SUSPENDED" || r.status === "CANCELLED").length;

  const selectedLevel = levels?.find((l) => String(l.id) === accessLevelId);

  // Filter content
  const filteredContent = useMemo(() => {
    return rawRows.filter((r) => {
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.passNo.toLowerCase().includes(q) ||
        r.visitorName.toLowerCase().includes(q) ||
        r.visitorCode.toLowerCase().includes(q) ||
        r.hostName.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [rawRows, statusFilter, search]);

  const pagedData = useMemo(() => ({
    content: filteredContent,
    page: 0,
    size: filteredContent.length || 10,
    totalElements: filteredContent.length,
    totalPages: 1,
    first: true,
    last: true,
    empty: filteredContent.length === 0,
  }), [filteredContent]);

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await issue.mutateAsync({
        visitorId: Number(visitorId),
        hostEmployeeId: Number(hostEmployeeId),
        accessLevelId: Number(accessLevelId),
        purpose,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
      });
      toast.success("Temporary smart pass issued successfully");
      setShowIssue(false);
      setVisitorId("");
      setHostEmployeeId("");
      setAccessLevelId("");
      setPurpose("");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.problem.detail ?? "Could not issue the pass" : "Cannot reach the server");
    }
  }

  const columns: Column<PassRow>[] = [
    {
      key: "passNo",
      header: "Pass Serial",
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-credential border border-blue-200/60 flex items-center justify-center font-bold text-xs shadow-2xs">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <span className="identifier font-bold text-xs sm:text-sm text-ink block">{p.passNo}</span>
            <span className="text-[10px] text-slate-400 font-mono">Digital QR Pass</span>
          </div>
        </div>
      ),
    },
    {
      key: "visitorName",
      header: "Visitor Profile",
      render: (p) => (
        <div>
          <span className="font-semibold text-ink text-xs sm:text-sm">{p.visitorName}</span>
          <span className="identifier text-[11px] text-slate-400 block">{p.visitorCode}</span>
        </div>
      ),
    },
    {
      key: "hostName",
      header: "Host Employee",
      render: (p) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span>{p.hostName}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "validUntil",
      header: "Validity Window",
      render: (p) => (
        <div className="text-xs text-slate-600">
          <span className="font-medium">{new Date(p.validUntil).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <Link href={`/security/passes/${p.id}`}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-xs gap-1 text-slate-700 border-rule hover:bg-slate-50 font-semibold"
          >
            <span>Inspect</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <RequireRole allow={["SECURITY_OFFICER", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                Temporary Passes & Guest Badges
              </h1>
              <span className="badge-topic text-[10px]">
                Visitor Access
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Time-bound QR credentials issued to approved visitors, contractors, and corporate guests.
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
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Temporary Passes ({totalCount})</span>
            </span>
            <Link
              href="/security/access"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <History className="h-3.5 w-3.5 text-slate-500" />
              <span>Access Decision Log</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE PASS KPIS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => setStatusFilter("")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "" ? "border-credential ring-2 ring-credential/15" : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Passes
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalCount}</span>
              <span className="text-xs font-medium text-slate-400">records</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">All issued visitor badges</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "ACTIVE" ? "" : "ACTIVE")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "ACTIVE"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Passes
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{activeCount}</span>
              <span className="text-xs font-medium text-emerald-600">checked-in</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Valid at door turnstiles</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "ISSUED" ? "" : "ISSUED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "ISSUED"
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Issued / Pending Scan
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700">{issuedCount}</span>
              <span className="text-xs font-medium text-blue-600">awaiting check-in</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-700">Activates on first gate tap</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "EXPIRED" ? "" : "EXPIRED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "EXPIRED"
                ? "border-slate-500 ring-2 ring-slate-500/20 bg-slate-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expired / Cancelled
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-2xs">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-700">{expiredCount}</span>
              <span className="text-xs font-medium text-slate-400">concluded</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Access window ended</div>
          </div>
        </div>

        {/* ─── 2. OMNISEARCH & STATUS FILTERS ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search passes by pass #, visitor name, visitor code, or host..."
                className="h-10 w-full rounded-xl border border-rule bg-paper pl-10 pr-9 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {STATUS_FILTERS.map((f) => {
                  const active = statusFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none flex-shrink-0",
                        active
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-paper text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-rule/60"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => setShowIssue(true)}
                size="sm"
                className="gap-1.5 rounded-xl bg-credential text-white hover:bg-credential/90 shadow-xs text-xs font-semibold h-9 px-3.5 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Issue Pass</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ─── 3. PASSES DATA TABLE ─── */}
        <div className="rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            page={pagedData}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            rowHref={(p) => `/security/passes/${p.id}`}
            empty={{
              title: search || statusFilter ? "No matching passes found" : "No passes issued yet",
              body:
                search || statusFilter
                  ? "Try adjusting your search query or status filter."
                  : "Issue a temporary visitor pass once a guest is registered.",
            }}
          />
        </div>

        {/* ─── 4. ISSUE PASS MODAL ─── */}
        <Dialog open={showIssue} onOpenChange={setShowIssue}>
          <DialogContent className="rounded-2xl border-rule bg-surface sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
                <CreditCard className="h-5 w-5 text-credential" />
                <span>Issue Temporary Guest Pass</span>
              </DialogTitle>
            </DialogHeader>
            <FormShell
              onSubmit={onIssue}
              formError={formError}
              isPending={issue.isPending}
              submitLabel="Issue Pass"
              onCancel={() => setShowIssue(false)}
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="Visitor Profile" name="visitorId" required>
                  <select
                    className="w-full h-10 rounded-xl border border-rule bg-paper px-3 text-xs text-ink focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20"
                    value={visitorId}
                    onChange={(e) => setVisitorId(e.target.value)}
                    required
                  >
                    <option value="">Select a registered visitor</option>
                    {(visitorList?.content ?? []).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.fullName} ({v.visitorCode})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Host Employee ID" name="hostEmployeeId" required hint="Database ID of host">
                  <Input
                    type="number"
                    value={hostEmployeeId}
                    onChange={(e) => setHostEmployeeId(e.target.value)}
                    required
                    placeholder="e.g. 1"
                    className="rounded-xl font-mono"
                  />
                </Field>
              </div>

              <Field label="Target Access Level Tier" name="accessLevelId" required>
                <select
                  className="w-full h-10 rounded-xl border border-rule bg-paper px-3 text-xs text-ink focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20"
                  value={accessLevelId}
                  onChange={(e) => setAccessLevelId(e.target.value)}
                  required
                >
                  <option value="">Select an Access Level</option>
                  {levels?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.levelCode} &bull; {l.levelName}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedLevel && (
                <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-3 text-xs text-blue-900 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-credential" />
                    Permitted Physical Areas for {selectedLevel.levelName}:
                  </span>
                  <p className="text-[11px] text-blue-700">
                    {selectedLevel.permittedAreas.map((a) => a.areaName).join(", ") || "No areas permitted"}
                  </p>
                </div>
              )}

              <Field label="Visit Purpose & Scope" name="purpose" required>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  maxLength={255}
                  required
                  placeholder="e.g. Executive Quarterly Review Meeting"
                  className="rounded-xl min-h-16"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Valid From" name="validFrom" required>
                  <Input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    required
                    className="rounded-xl text-xs"
                  />
                </Field>
                <Field label="Valid Until" name="validUntil" required>
                  <Input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    required
                    className="rounded-xl text-xs"
                  />
                </Field>
              </div>
            </FormShell>
          </DialogContent>
        </Dialog>
      </div>
    </RequireRole>
  );
}
