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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { visitors, type VisitorDto } from "../_hooks/useVisitors";
import {
  Users,
  Plus,
  Search,
  X,
  ShieldCheck,
  CreditCard,
  History,
  Building,
  UserCheck,
  FileBadge,
  Phone,
  Mail,
  SlidersHorizontal,
} from "lucide-react";

const VISITOR_TYPES = [
  { label: "All Categories", value: "" },
  { label: "Guests", value: "GUEST" },
  { label: "Contractors", value: "CONTRACTOR" },
  { label: "Vendors", value: "VENDOR" },
  { label: "Interviewees", value: "INTERVIEWEE" },
];

const DOCUMENT_TYPES = ["NIC", "PASSPORT", "DRIVING_LICENCE"];

export default function VisitorsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { data, isLoading, isError, refetch } = visitors.useList({ search: search || undefined });
  const register = visitors.useCreate();
  const remove = visitors.useRemove();

  const [showRegister, setShowRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [idDocumentType, setIdDocumentType] = useState("NIC");
  const [idDocumentNo, setIdDocumentNo] = useState("");
  const [visitorType, setVisitorType] = useState("GUEST");
  const [hostEmployeeId, setHostEmployeeId] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<VisitorDto | null>(null);

  const rawRows: VisitorDto[] = data?.content ?? [];

  // KPI calculations
  const totalCount = rawRows.length;
  const guestCount = rawRows.filter((r) => r.visitorType === "GUEST").length;
  const contractorCount = rawRows.filter((r) => r.visitorType === "CONTRACTOR").length;
  const vendorCount = rawRows.filter((r) => r.visitorType === "VENDOR" || r.visitorType === "INTERVIEWEE").length;

  // Filter content
  const filteredContent = useMemo(() => {
    return rawRows.filter((r) => {
      const matchesType = !typeFilter || r.visitorType === typeFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.fullName.toLowerCase().includes(q) ||
        r.visitorCode.toLowerCase().includes(q) ||
        r.idDocumentNo.toLowerCase().includes(q) ||
        (r.company && r.company.toLowerCase().includes(q)) ||
        (r.hostEmployeeName && r.hostEmployeeName.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [rawRows, typeFilter, search]);

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

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await register.mutateAsync({
        fullName,
        idDocumentType,
        idDocumentNo,
        visitorType,
        hostEmployeeId: Number(hostEmployeeId),
        company: company || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
      toast.success("Visitor successfully registered");
      setShowRegister(false);
      setFullName("");
      setIdDocumentNo("");
      setHostEmployeeId("");
      setCompany("");
      setPhone("");
      setEmail("");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.problem.detail ?? "Could not register the visitor" : "Cannot reach the server");
    }
  }

  async function onDelete() {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast.success("Visitor removed");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not remove the visitor");
    } finally {
      setConfirmDelete(null);
    }
  }

  const columns: Column<VisitorDto>[] = [
    {
      key: "visitorCode",
      header: "Visitor Code & ID",
      render: (v) => (
        <div>
          <span className="identifier font-bold text-xs sm:text-sm text-ink block">{v.visitorCode}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {v.idDocumentType}: {v.idDocumentNo}
          </span>
        </div>
      ),
    },
    {
      key: "fullName",
      header: "Visitor Profile",
      render: (v) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-slate-100 border border-rule flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
            {v.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-ink text-xs sm:text-sm">{v.fullName}</div>
            <div className="text-[11px] text-slate-400">
              {v.phone || v.email || "No direct contact added"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "visitorType",
      header: "Category",
      render: (v) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            v.visitorType === "GUEST"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : v.visitorType === "CONTRACTOR"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          )}
        >
          {v.visitorType.replaceAll("_", " ")}
        </span>
      ),
    },
    {
      key: "company",
      header: "Organization / Company",
      render: (v) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Building className="h-3.5 w-3.5 text-slate-400" />
          <span>{v.company ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "host",
      header: "Host Employee",
      render: (v) => (
        <div className="flex items-center gap-1.5 text-xs">
          <UserCheck className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">{v.hostEmployeeName}</span>
          <span className="identifier text-slate-400">({v.hostEmpId})</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link href="/security/passes">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-xs gap-1 text-credential border-blue-200 hover:bg-blue-50 font-semibold"
            >
              <CreditCard className="h-3 w-3" />
              <span>Issue Pass</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(v)}
            className="h-8 rounded-lg text-xs text-slate-400 hover:text-red-700 hover:bg-red-50"
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RequireRole allow={["SECURITY_OFFICER", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Visitor Directory & Guest Registry
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-credential border border-blue-200/60">
                Identity Register
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Registered corporate guests, contractors, and external vendors with host accountability.
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
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <Users className="h-3.5 w-3.5" />
              <span>Visitor Register ({totalCount})</span>
            </span>
            <Link
              href="/security/passes"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 text-slate-500" />
              <span>Temporary Passes</span>
            </Link>
            <Link
              href="/security/access"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <History className="h-3.5 w-3.5 text-slate-500" />
              <span>Access Decision Log</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE VISITOR KPIS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => setTypeFilter("")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              typeFilter === "" ? "border-credential ring-2 ring-credential/15" : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Visitors
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalCount}</span>
              <span className="text-xs font-medium text-slate-400">profiles</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">All registered guest records</div>
          </div>

          <div
            onClick={() => setTypeFilter(typeFilter === "GUEST" ? "" : "GUEST")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              typeFilter === "GUEST"
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Corporate Guests
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
                <FileBadge className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700">{guestCount}</span>
              <span className="text-xs font-medium text-blue-600">registered</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-700">Standard visitors & clients</div>
          </div>

          <div
            onClick={() => setTypeFilter(typeFilter === "CONTRACTOR" ? "" : "CONTRACTOR")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              typeFilter === "CONTRACTOR"
                ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Contractors
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                <Building className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{contractorCount}</span>
              <span className="text-xs font-medium text-amber-600">contractors</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700">Maintenance & service partners</div>
          </div>

          <div
            onClick={() => setTypeFilter(typeFilter === "VENDOR" ? "" : "VENDOR")}
            className={cn(
              "rounded-2xl border p-5 transition-all cursor-pointer select-none bg-surface shadow-xs hover:shadow-md",
              typeFilter === "VENDOR"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
                : "border-rule"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Vendors / Interviews
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{vendorCount}</span>
              <span className="text-xs font-medium text-emerald-600">registered</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700">Suppliers & recruitment candidates</div>
          </div>
        </div>

        {/* ─── 2. OMNISEARCH & CATEGORY FILTERS ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visitors by name, NIC, code, company, or host..."
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
                {VISITOR_TYPES.map((f) => {
                  const active = typeFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setTypeFilter(f.value)}
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
                onClick={() => setShowRegister(true)}
                size="sm"
                className="gap-1.5 rounded-xl bg-credential text-white hover:bg-credential/90 shadow-xs text-xs font-semibold h-9 px-3.5 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Register Visitor</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ─── 3. VISITOR DATA TABLE ─── */}
        <div className="rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            page={pagedData}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            empty={{
              title: search || typeFilter ? "No matching visitors found" : "No visitors registered yet",
              body:
                search || typeFilter
                  ? "Try adjusting your search query or category filter."
                  : "Register a corporate guest or contractor to issue temporary smart passes.",
            }}
          />
        </div>

        {/* ─── 4. REGISTER VISITOR MODAL ─── */}
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogContent className="rounded-2xl border-rule bg-surface sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
                <Users className="h-5 w-5 text-credential" />
                <span>Register New Visitor Profile</span>
              </DialogTitle>
            </DialogHeader>
            <FormShell
              onSubmit={onRegister}
              formError={formError}
              isPending={register.isPending}
              submitLabel="Register Visitor"
              onCancel={() => setShowRegister(false)}
            >
              <Field label="Full Name" name="fullName" required>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="e.g. Kasun Perera"
                  className="rounded-xl"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="ID Document Type" name="idDocumentType" required>
                  <select
                    className="w-full h-10 rounded-xl border border-rule bg-paper px-3 text-xs text-ink focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20"
                    value={idDocumentType}
                    onChange={(e) => setIdDocumentType(e.target.value)}
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Document Number" name="idDocumentNo" required>
                  <Input
                    value={idDocumentNo}
                    onChange={(e) => setIdDocumentNo(e.target.value)}
                    maxLength={30}
                    required
                    placeholder="e.g. 199512345678"
                    className="rounded-xl font-mono"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Visitor Category" name="visitorType" required>
                  <select
                    className="w-full h-10 rounded-xl border border-rule bg-paper px-3 text-xs text-ink focus:border-credential focus:bg-white focus:outline-none focus:ring-2 focus:ring-credential/20"
                    value={visitorType}
                    onChange={(e) => setVisitorType(e.target.value)}
                  >
                    {VISITOR_TYPES.filter((t) => t.value).map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Host Employee ID"
                  name="hostEmployeeId"
                  required
                  hint="Database ID of responsible employee"
                >
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

              <Field label="Company / Organization" name="company">
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Acme Corp / Freelance"
                  className="rounded-xl"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone Number" name="phone">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                    placeholder="e.g. +94 77 123 4567"
                    className="rounded-xl"
                  />
                </Field>
                <Field label="Email Address" name="email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. visitor@example.com"
                    className="rounded-xl"
                  />
                </Field>
              </div>
            </FormShell>
          </DialogContent>
        </Dialog>

        {/* ─── 5. REMOVE CONFIRMATION DIALOG ─── */}
        <ConfirmDialog
          open={confirmDelete !== null}
          onOpenChange={(open) => !open && setConfirmDelete(null)}
          title="Remove Visitor Record?"
          body={
            confirmDelete
              ? `${confirmDelete.fullName} will be permanently removed if they have no past visit history, or archived safely as a security record.`
              : ""
          }
          confirmLabel="Remove Visitor"
          destructive
          onConfirm={() => void onDelete()}
          isPending={remove.isPending}
        />
      </div>
    </RequireRole>
  );
}
