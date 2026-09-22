"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DataTable, type Column } from "@/components/data-table";
import { Field } from "@/components/form/field";
import { FormShell } from "@/components/form/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAreas, useCreateArea, useToggleArea, type AreaDto } from "../_hooks/useConfig";
import {
  Key,
  Plus,
  Search,
  X,
  SlidersHorizontal,
  Building2,
  Shield,
  IdCard,
  Lock,
  ShieldAlert,
  Building,
  CheckCircle2,
  Layers,
} from "lucide-react";

type Row = AreaDto & { id: number };

const RESTRICTION_FILTERS = [
  { label: "All Areas", value: "" },
  { label: "Restricted Only", value: "RESTRICTED" },
  { label: "Standard Access", value: "STANDARD" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function AreasPage() {
  const { data, isLoading, isError, refetch } = useAreas();
  const create = useCreateArea();
  const toggle = useToggleArea();

  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [areaName, setAreaName] = useState("");
  const [building, setBuilding] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const rawRows: Row[] = data ? data.map((a) => ({ ...a, id: a.id })) : [];

  // KPI calculations
  const totalCount = rawRows.length;
  const restrictedCount = rawRows.filter((r) => r.restricted).length;
  const activeCount = rawRows.filter((r) => r.active).length;
  const totalLevelMappings = rawRows.reduce((acc, curr) => acc + (curr.levelCount || 0), 0);

  // Live Omnisearch & Filter
  const filteredContent = useMemo(() => {
    return rawRows.filter((r) => {
      let matchesFilter = true;
      if (filterType === "RESTRICTED") matchesFilter = r.restricted;
      else if (filterType === "STANDARD") matchesFilter = !r.restricted;
      else if (filterType === "ACTIVE") matchesFilter = r.active;
      else if (filterType === "INACTIVE") matchesFilter = !r.active;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.areaCode.toLowerCase().includes(q) ||
        r.areaName.toLowerCase().includes(q) ||
        (r.building && r.building.toLowerCase().includes(q)) ||
        (r.floorNo && r.floorNo.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [rawRows, filterType, searchQuery]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await create.mutateAsync({
        areaCode,
        areaName,
        building: building || undefined,
        floorNo: floorNo || undefined,
        restricted,
        description: description || undefined,
      });
      toast.success("Security area created successfully");
      setShowCreate(false);
      setAreaCode("");
      setAreaName("");
      setBuilding("");
      setFloorNo("");
      setRestricted(false);
      setDescription("");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.problem.detail ?? "Could not create the area" : "Cannot reach the server");
    }
  }

  async function onToggle(row: Row) {
    try {
      await toggle.mutateAsync({ id: row.id, active: row.active });
      toast.success(row.active ? "Area deactivated" : "Area reactivated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not update the area");
    }
  }

  const columns: Column<Row>[] = [
    {
      key: "areaCode",
      header: "Zone Code",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs font-bold text-xs">
            <Key className="h-4 w-4" />
          </div>
          <span className="identifier font-bold text-xs sm:text-sm text-ink">{r.areaCode}</span>
        </div>
      ),
    },
    {
      key: "areaName",
      header: "Security Area & Classification",
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink text-xs sm:text-sm">{r.areaName}</span>
            {r.restricted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                <Lock className="h-3 w-3" />
                Restricted
              </span>
            )}
          </div>
          {r.description && (
            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{r.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Physical Location",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Building className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium">
            {[r.building, r.floorNo && `Floor ${r.floorNo}`].filter(Boolean).join(", ") || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "levelCount",
      header: "Authorized Levels",
      align: "right",
      render: (r) => (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-1 text-xs font-bold text-credential">
          <Shield className="h-3 w-3" />
          <span>{r.levelCount} tiers</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.active ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onToggle(r)}
            className="h-8 rounded-lg text-xs"
          >
            {r.active ? "Deactivate" : "Reactivate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="h-8 rounded-lg text-xs text-slate-400 cursor-not-allowed opacity-50"
            title="Physical security areas cannot be deleted because entry and visitor logs refer to them permanently for security audits. Deactivate the area to prevent future access."
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const rows = data
    ? {
        content: filteredContent,
        page: 0,
        size: filteredContent.length,
        totalElements: filteredContent.length,
        totalPages: 1,
        first: true,
        last: true,
      }
    : undefined;

  return (
    <RequireRole allow={["IT_ADMIN", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                Physical Security Areas & Zones
              </h1>
              <span className="badge-topic text-[10px]">
                Turnstiles & Perimeters
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Physical rooms, floors, and entry points controlled by the AccessOne contactless decision engine.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/it"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <span>Overview</span>
            </Link>
            <Link
              href="/it/departments"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Departments</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <Key className="h-3.5 w-3.5" />
              <span>Security Areas ({totalCount})</span>
            </span>
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

        {/* ─── 1. EXECUTIVE SECURITY AREA KPIS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => setFilterType("")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              filterType === "" ? "border-credential ring-2 ring-credential/15" : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Security Areas
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <Key className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalCount}</span>
              <span className="text-xs font-medium text-slate-400">monitored zones</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Across all enterprise facilities</div>
          </div>

          <div
            onClick={() => setFilterType(filterType === "RESTRICTED" ? "" : "RESTRICTED")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              filterType === "RESTRICTED"
                ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Restricted Zones
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-2xs">
                <Lock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-700">{restrictedCount}</span>
              <span className="text-xs font-medium text-red-500">high-security</span>
            </div>
            <div className="mt-2 text-[11px] text-red-600 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Requires executive authorization</span>
            </div>
          </div>

          <div
            onClick={() => setFilterType(filterType === "ACTIVE" ? "" : "ACTIVE")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              filterType === "ACTIVE"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Turnstiles
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{activeCount}</span>
              <span className="text-xs font-medium text-emerald-600">online</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700">Enforcing live badge scans</div>
          </div>

          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Level Mappings
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
                <Shield className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-700">{totalLevelMappings}</span>
              <span className="text-xs font-medium text-indigo-600">permission grants</span>
            </div>
            <div className="mt-2 text-[11px] text-indigo-700">Across matrix hierarchy</div>
          </div>
        </div>

        {/* ─── 2. OMNISEARCH & FILTER BAR ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search areas by code (e.g. B-SRV), name, building, or floor..."
                className="h-10 w-full rounded-xl border border-rule bg-paper pl-10 pr-9 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {RESTRICTION_FILTERS.map((f) => {
                  const active = filterType === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setFilterType(f.value)}
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
                onClick={() => setShowCreate(true)}
                size="sm"
                className="gap-1.5 rounded-xl bg-credential text-white hover:bg-credential/90 shadow-xs text-xs font-semibold h-9 px-3.5 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>New Area</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ─── 3. SECURITY AREAS DATA TABLE ─── */}
        <div className="rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            page={rows}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            empty={{
              title: searchQuery || filterType ? "No matching security areas found" : "No areas registered yet",
              body:
                searchQuery || filterType
                  ? "Try adjusting your search query or restriction filter."
                  : "Add your first security area or door access point to get started.",
            }}
          />
        </div>

        {/* ─── 4. NEW AREA MODAL ─── */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="rounded-2xl border-rule bg-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
                <Key className="h-5 w-5 text-credential" />
                <span>Register New Security Area</span>
              </DialogTitle>
            </DialogHeader>
            <FormShell
              onSubmit={onCreate}
              formError={formError}
              isPending={create.isPending}
              submitLabel="Create Security Area"
              onCancel={() => setShowCreate(false)}
            >
              <Field label="Area Code" name="areaCode" required hint="e.g. B-SRV, HQ-FL3 — up to 15 characters">
                <Input
                  id="areaCode"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value.toUpperCase())}
                  maxLength={15}
                  required
                  placeholder="e.g. B-SRV"
                  className="rounded-xl font-mono"
                />
              </Field>
              <Field label="Area Name" name="areaName" required>
                <Input
                  id="areaName"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  maxLength={100}
                  required
                  placeholder="e.g. Main Server Vault"
                  className="rounded-xl"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Building / Wing" name="building">
                  <Input
                    id="building"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    maxLength={60}
                    placeholder="e.g. Building B"
                    className="rounded-xl"
                  />
                </Field>
                <Field label="Floor No." name="floorNo">
                  <Input
                    id="floorNo"
                    value={floorNo}
                    onChange={(e) => setFloorNo(e.target.value)}
                    maxLength={10}
                    placeholder="e.g. 2"
                    className="rounded-xl"
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-rule bg-paper p-3">
                <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={restricted}
                    onChange={(e) => setRestricted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-credential focus:ring-credential"
                  />
                  <div>
                    <span className="font-bold text-ink">Restricted High-Security Zone</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Flags this area as high-risk, requiring elevated permission tiers.
                    </p>
                  </div>
                </label>
              </div>

              <Field label="Description & Purpose" name="description">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={255}
                  placeholder="Zone function or physical door sensor details..."
                  className="rounded-xl min-h-20"
                />
              </Field>
            </FormShell>
          </DialogContent>
        </Dialog>
      </div>
    </RequireRole>
  );
}
