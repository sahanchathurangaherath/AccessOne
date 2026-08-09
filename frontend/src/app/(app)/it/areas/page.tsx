"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Field } from "@/components/form/field";
import { FormShell } from "@/components/form/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { useAreas, useCreateArea, useToggleArea, type AreaDto } from "../_hooks/useConfig";

type Row = AreaDto & { id: number };

export default function AreasPage() {
  const { data, isLoading, isError, refetch } = useAreas();
  const create = useCreateArea();
  const toggle = useToggleArea();

  const [showCreate, setShowCreate] = useState(false);
  const [areaCode, setAreaCode] = useState("");
  const [areaName, setAreaName] = useState("");
  const [building, setBuilding] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await create.mutateAsync({
        areaCode, areaName, building: building || undefined, floorNo: floorNo || undefined,
        restricted, description: description || undefined,
      });
      toast.success("Area created");
      setShowCreate(false);
      setAreaCode(""); setAreaName(""); setBuilding(""); setFloorNo(""); setRestricted(false); setDescription("");
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
    { key: "areaCode", header: "Code", render: (r) => <span className="identifier">{r.areaCode}</span> },
    { key: "areaName", header: "Area", render: (r) => (
        <div>
          {r.areaName}
          {r.restricted && <span className="ml-2 text-xs uppercase tracking-wide text-pending">restricted</span>}
        </div>
      ) },
    { key: "location", header: "Location",
      render: (r) => <span className="text-slate">{[r.building, r.floorNo && `Floor ${r.floorNo}`].filter(Boolean).join(", ") || "—"}</span> },
    { key: "levelCount", header: "Levels granting access", align: "right",
      render: (r) => <span className="identifier">{r.levelCount}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.active ? "ACTIVE" : "INACTIVE"} /> },
    { key: "actions", header: "", align: "right",
      render: (r) => (
        <Button variant="outline" size="sm" onClick={() => void onToggle(r)}>
          {r.active ? "Deactivate" : "Reactivate"}
        </Button>
      ) },
  ];

  const rows = data ? {
    content: data, page: 0, size: data.length, totalElements: data.length,
    totalPages: 1, first: true, last: true,
  } : undefined;

  return (
    <RequireRole allow={["IT_ADMIN"]}>
      <PageHeader
        title="Areas"
        description="Physical spaces access levels can grant entry to. Areas are never deleted, only deactivated -- access and visit logs refer to them permanently."
        actions={<Button onClick={() => setShowCreate(true)}>New area</Button>}
      />

      <DataTable
        columns={columns}
        page={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        empty={{ title: "No areas yet", body: "Add one to get started." }}
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New area</DialogTitle></DialogHeader>
          <FormShell onSubmit={onCreate} formError={formError} isPending={create.isPending}
                     submitLabel="Create" onCancel={() => setShowCreate(false)}>
            <Field label="Code" name="areaCode" required hint="e.g. B-SRV — up to 15 characters">
              <Input id="areaCode" value={areaCode} onChange={(e) => setAreaCode(e.target.value)} maxLength={15} required />
            </Field>
            <Field label="Name" name="areaName" required>
              <Input id="areaName" value={areaName} onChange={(e) => setAreaName(e.target.value)} maxLength={100} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Building" name="building">
                <Input id="building" value={building} onChange={(e) => setBuilding(e.target.value)} maxLength={60} />
              </Field>
              <Field label="Floor" name="floorNo">
                <Input id="floorNo" value={floorNo} onChange={(e) => setFloorNo(e.target.value)} maxLength={10} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />
              Restricted area
            </label>
            <Field label="Description" name="description">
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
            </Field>
          </FormShell>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}
