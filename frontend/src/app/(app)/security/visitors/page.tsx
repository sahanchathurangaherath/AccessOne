"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field } from "@/components/form/field";
import { FormShell } from "@/components/form/form-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { visitors, type VisitorDto } from "../_hooks/useVisitors";

const VISITOR_TYPES = ["GUEST", "CONTRACTOR", "VENDOR", "INTERVIEWEE"];
const DOCUMENT_TYPES = ["NIC", "PASSPORT", "DRIVING_LICENCE"];

export default function VisitorsPage() {
  const [search, setSearch] = useState("");
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

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await register.mutateAsync({
        fullName, idDocumentType, idDocumentNo, visitorType,
        hostEmployeeId: Number(hostEmployeeId),
        company: company || undefined, phone: phone || undefined, email: email || undefined,
      });
      toast.success("Visitor registered");
      setShowRegister(false);
      setFullName(""); setIdDocumentNo(""); setHostEmployeeId("");
      setCompany(""); setPhone(""); setEmail("");
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
    { key: "visitorCode", header: "Code", render: (v) => <span className="identifier">{v.visitorCode}</span> },
    { key: "fullName", header: "Name", render: (v) => v.fullName },
    { key: "visitorType", header: "Type", render: (v) => v.visitorType.replaceAll("_", " ").toLowerCase() },
    { key: "company", header: "Company", render: (v) => v.company ?? "—" },
    { key: "host", header: "Host", render: (v) => `${v.hostEmployeeName} (${v.hostEmpId})` },
    { key: "actions", header: "", align: "right",
      render: (v) => (
        <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(v)}>
          Remove
        </Button>
      ) },
  ];

  return (
    <RequireRole allow={["SECURITY_OFFICER"]}>
      <PageHeader
        title="Visitors"
        description="Everyone registered to visit, hosted by an employee who is responsible for them."
        actions={<Button onClick={() => setShowRegister(true)}>Register visitor</Button>}
      />

      <div className="mb-4">
        <Input placeholder="Search by name, NIC or code" value={search}
               onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        empty={{ title: "No visitors registered", body: "Register one to get started." }}
      />

      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register visitor</DialogTitle></DialogHeader>
          <FormShell onSubmit={onRegister} formError={formError} isPending={register.isPending}
                     submitLabel="Register" onCancel={() => setShowRegister(false)}>
            <Field label="Full name" name="fullName" required>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} required />
            </Field>
            <Field label="ID document type" name="idDocumentType" required>
              <select className="w-full rounded-card border border-rule bg-surface px-3 py-2 text-sm"
                      value={idDocumentType} onChange={(e) => setIdDocumentType(e.target.value)}>
                {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="ID document number" name="idDocumentNo" required>
              <Input value={idDocumentNo} onChange={(e) => setIdDocumentNo(e.target.value)} maxLength={30} required />
            </Field>
            <Field label="Visitor type" name="visitorType" required>
              <select className="w-full rounded-card border border-rule bg-surface px-3 py-2 text-sm"
                      value={visitorType} onChange={(e) => setVisitorType(e.target.value)}>
                {VISITOR_TYPES.map((t) => <option key={t} value={t}>{t.toLowerCase()}</option>)}
              </select>
            </Field>
            <Field label="Host employee ID" name="hostEmployeeId" required
                   hint="The employee responsible for this visitor -- their database ID">
              <Input type="number" value={hostEmployeeId} onChange={(e) => setHostEmployeeId(e.target.value)} required />
            </Field>
            <Field label="Company" name="company">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Phone" name="phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
            </Field>
            <Field label="Email" name="email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
            </Field>
          </FormShell>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Remove this visitor?"
        body={confirmDelete
          ? `${confirmDelete.fullName} will be permanently removed if they have no pass history, or kept as a soft-deleted record if they do -- visit logs are a security record and must survive.`
          : ""}
        confirmLabel="Remove"
        destructive
        onConfirm={() => void onDelete()}
        isPending={remove.isPending}
      />
    </RequireRole>
  );
}
