"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field } from "@/components/form/field";
import { FormShell } from "@/components/form/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  useDepartments, useCreateDepartment, useToggleDepartment, useDeleteDepartment,
  type DepartmentDto,
} from "../_hooks/useConfig";
import {
  Building2,
  Plus,
  Search,
  X,
  SlidersHorizontal,
  Key,
  Shield,
  IdCard,
  Users,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";

type Row = DepartmentDto & { id: number };

const STATUS_FILTERS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function DepartmentsPage() {
  const { data, isLoading, isError, refetch } = useDepartments();
  const create = useCreateDepartment();
  const toggle = useToggleDepartment();
  const del = useDeleteDepartment();

  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const rawRows: Row[] = data ? data.map((d) => ({ ...d, id: d.id })) : [];

  // KPI calculations
  const totalCount = rawRows.length;
  const activeCount = rawRows.filter((r) => r.active).length;
  const inactiveCount = rawRows.filter((r) => !r.active).length;
  const totalEmployees = rawRows.reduce((acc, curr) => acc + (curr.employeeCount || 0), 0);

  // Live Omnisearch & Filter
  const filteredContent = useMemo(() => {
    return rawRows.filter((r) => {
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "ACTIVE" && r.active) ||
        (statusFilter === "INACTIVE" && !r.active);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.deptCode.toLowerCase().includes(q) ||
        r.deptName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [rawRows, statusFilter, searchQuery]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await create.mutateAsync({ deptCode, deptName, description: description || undefined });
      toast.success("Department created successfully");
      setShowCreate(false);
      setDeptCode("");
      setDeptName("");
      setDescription("");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.problem.detail ?? "Could not create the department" : "Cannot reach the server");
    }
  }

  async function onToggle(row: Row) {
    try {
      await toggle.mutateAsync({ id: row.id, active: row.active });
      toast.success(row.active ? "Department deactivated" : "Department reactivated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not update the department");
    }
  }

  async function onDelete() {
    if (!confirmDelete) return;
    try {
      await del.mutateAsync(confirmDelete.id);
      toast.success("Department deleted");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not delete the department");
    } finally {
      setConfirmDelete(null);
    }
  }

  const columns: Column<Row>[] = [
    {
      key: "deptCode",
      header: "Code",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-credential border border-blue-200/60 shadow-2xs font-bold text-xs">
            <Building className="h-4 w-4" />
          </div>
          <span className="identifier font-bold text-xs sm:text-sm text-ink">{r.deptCode}</span>
        </div>
      ),
    },
    {
      key: "deptName",
      header: "Department Name & Description",
      render: (r) => (
        <div>
          <div className="font-semibold text-ink text-xs sm:text-sm">{r.deptName}</div>
          {r.description && <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{r.description}</div>}
        </div>
      ),
    },
    {
      key: "employeeCount",
      header: "Assigned Staff",
      align: "right",
      render: (r) => (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          <Users className="h-3 w-3 text-slate-500" />
          <span>{r.employeeCount}</span>
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
            variant="destructive"
            size="sm"
            disabled={!r.deletable}
            onClick={() => setConfirmDelete(r)}
            className="h-8 rounded-lg text-xs"
            title={!r.deletable ? "Cannot delete department with active employee records" : "Delete department"}
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Organizational Departments
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-credential border border-blue-200/60">
                Directory Hierarchy
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Departmental units and branch structures employees belong to for smart card provisioning.
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
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <Building2 className="h-3.5 w-3.5" />
              <span>Departments ({totalCount})</span>
            </span>
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

        {/* ─── 1. EXECUTIVE DEPARTMENT KPIS ─── */}
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
                Total Units
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <Building2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalCount}</span>
              <span className="text-xs font-medium text-slate-400">configured</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">All registered enterprise units</div>
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
                Active Units
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{activeCount}</span>
              <span className="text-xs font-medium text-emerald-600">operational</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for employee onboarding</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "INACTIVE" ? "" : "INACTIVE")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              statusFilter === "INACTIVE"
                ? "border-slate-500 ring-2 ring-slate-500/20 bg-slate-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Inactive Units
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-2xs">
                <AlertCircle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-700">{inactiveCount}</span>
              <span className="text-xs font-medium text-slate-400">archived</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Deactivated from issuing new cards</div>
          </div>

          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Staff
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-700">{totalEmployees}</span>
              <span className="text-xs font-medium text-indigo-600">assigned personnel</span>
            </div>
            <div className="mt-2 text-[11px] text-indigo-700">Across all departments</div>
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
                placeholder="Search departments by code (e.g. FIN), name, or description..."
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
              <div className="flex items-center gap-1.5">
                {STATUS_FILTERS.map((f) => {
                  const active = statusFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none",
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
                className="gap-1.5 rounded-xl bg-credential text-white hover:bg-credential/90 shadow-xs text-xs font-semibold h-9 px-3.5"
              >
                <Plus className="h-4 w-4" />
                <span>New Department</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ─── 3. DEPARTMENT DATA TABLE ─── */}
        <div className="rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            page={rows}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            empty={{
              title: searchQuery || statusFilter ? "No matching departments found" : "No departments yet",
              body:
                searchQuery || statusFilter
                  ? "Try adjusting your search query or status filter."
                  : "Add your first organizational department to get started.",
            }}
          />
        </div>

        {/* ─── 4. NEW DEPARTMENT MODAL ─── */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="rounded-2xl border-rule bg-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
                <Building2 className="h-5 w-5 text-credential" />
                <span>Register New Department</span>
              </DialogTitle>
            </DialogHeader>
            <FormShell
              onSubmit={onCreate}
              formError={formError}
              isPending={create.isPending}
              submitLabel="Create Department"
              onCancel={() => setShowCreate(false)}
            >
              <Field label="Department Code" name="deptCode" required hint="e.g. FIN, ENG, HR — up to 10 characters">
                <Input
                  id="deptCode"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                  placeholder="e.g. IT"
                  className="rounded-xl font-mono"
                />
              </Field>
              <Field label="Department Name" name="deptName" required>
                <Input
                  id="deptName"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  maxLength={100}
                  required
                  placeholder="e.g. Information Technology"
                  className="rounded-xl"
                />
              </Field>
              <Field label="Description & Notes" name="description">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={255}
                  placeholder="Purpose or branch scope of this department..."
                  className="rounded-xl min-h-20"
                />
              </Field>
            </FormShell>
          </DialogContent>
        </Dialog>

        {/* ─── 5. DELETE CONFIRMATION DIALOG ─── */}
        <ConfirmDialog
          open={confirmDelete !== null}
          onOpenChange={(open) => !open && setConfirmDelete(null)}
          title="Permanently Delete Department?"
          body={
            confirmDelete
              ? `Are you sure you want to delete ${confirmDelete.deptName} (${confirmDelete.deptCode})? This department currently has 0 assigned employees and can be safely deleted.`
              : ""
          }
          confirmLabel="Delete Department"
          destructive
          onConfirm={() => void onDelete()}
          isPending={del.isPending}
        />
      </div>
    </RequireRole>
  );
}
