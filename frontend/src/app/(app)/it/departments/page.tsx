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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import {
  useDepartments, useCreateDepartment, useToggleDepartment, useDeleteDepartment,
  type DepartmentDto,
} from "../_hooks/useConfig";

type Row = DepartmentDto & { id: number };

export default function DepartmentsPage() {
  const { data, isLoading, isError, refetch } = useDepartments();
  const create = useCreateDepartment();
  const toggle = useToggleDepartment();
  const del = useDeleteDepartment();

  const [showCreate, setShowCreate] = useState(false);
  const [deptCode, setDeptCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await create.mutateAsync({ deptCode, deptName, description: description || undefined });
      toast.success("Department created");
      setShowCreate(false);
      setDeptCode(""); setDeptName(""); setDescription("");
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
    { key: "deptCode", header: "Code", render: (r) => <span className="identifier">{r.deptCode}</span> },
    { key: "deptName", header: "Department", render: (r) => r.deptName },
    { key: "employeeCount", header: "Employees", align: "right",
      render: (r) => <span className="identifier">{r.employeeCount}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.active ? "ACTIVE" : "INACTIVE"} /> },
    { key: "actions", header: "", align: "right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => void onToggle(r)}>
            {r.active ? "Deactivate" : "Reactivate"}
          </Button>
          <Button variant="destructive" size="sm" disabled={!r.deletable}
                  onClick={() => setConfirmDelete(r)}>
            Delete
          </Button>
        </div>
      ) },
  ];

  const rows = data ? {
    content: data, page: 0, size: data.length, totalElements: data.length,
    totalPages: 1, first: true, last: true,
  } : undefined;

  return (
    <RequireRole allow={["IT_ADMIN"]}>
      <PageHeader
        title="Departments"
        description="Organisational units employees belong to."
        actions={<Button onClick={() => setShowCreate(true)}>New department</Button>}
      />

      <DataTable
        columns={columns}
        page={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        empty={{ title: "No departments yet", body: "Add one to get started." }}
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New department</DialogTitle></DialogHeader>
          <FormShell onSubmit={onCreate} formError={formError} isPending={create.isPending}
                     submitLabel="Create" onCancel={() => setShowCreate(false)}>
            <Field label="Code" name="deptCode" required hint="e.g. FIN, HR — up to 10 characters">
              <Input id="deptCode" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} maxLength={10} required />
            </Field>
            <Field label="Name" name="deptName" required>
              <Input id="deptName" value={deptName} onChange={(e) => setDeptName(e.target.value)} maxLength={100} required />
            </Field>
            <Field label="Description" name="description">
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
            </Field>
          </FormShell>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this department?"
        body={confirmDelete
          ? `${confirmDelete.deptName} has no employees, so this is permanent and cannot be undone.`
          : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={() => void onDelete()}
        isPending={del.isPending}
      />
    </RequireRole>
  );
}
