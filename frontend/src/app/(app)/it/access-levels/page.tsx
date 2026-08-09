"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { ErrorState, TableSkeleton } from "@/components/states";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field } from "@/components/form/field";
import { FormShell } from "@/components/form/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { PermissionMatrixGrid } from "../_components/PermissionMatrixGrid";
import { RuleTestPanel } from "../_components/RuleTestPanel";
import {
  useAccessLevels, useAreas, usePermissionMatrix,
  useCreateAccessLevel, useToggleAccessLevel, useReplaceAreas,
} from "../_hooks/useConfig";

type PendingToggle = { levelId: number; levelName: string; areaId: number; areaName: string; granted: boolean };

export default function AccessLevelsPage() {
  const { data: levels, isLoading: levelsLoading } = useAccessLevels();
  const { data: areas } = useAreas();
  const { data: matrix, isLoading: matrixLoading, isError: matrixError, refetch: refetchMatrix } = usePermissionMatrix();

  const createLevel = useCreateAccessLevel();
  const toggleLevel = useToggleAccessLevel();
  const replaceAreas = useReplaceAreas();

  const [showCreate, setShowCreate] = useState(false);
  const [levelCode, setLevelCode] = useState("");
  const [levelName, setLevelName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingToggle | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await createLevel.mutateAsync({ levelCode, levelName, description: description || undefined });
      toast.success("Access level created");
      setShowCreate(false);
      setLevelCode(""); setLevelName(""); setDescription("");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.problem.detail ?? "Could not create the access level" : "Cannot reach the server");
    }
  }

  async function onToggleLevel(id: number, active: boolean) {
    try {
      await toggleLevel.mutateAsync({ id, active });
      toast.success(active ? "Access level deactivated" : "Access level reactivated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not update the access level");
    }
  }

  function requestToggle(levelId: number, areaId: number, granted: boolean) {
    if (!matrix || !levels) return;
    const level = matrix.levels.find((l) => l.levelId === levelId);
    const area = matrix.areas.find((a) => a.areaId === areaId);
    if (!level || !area) return;

    // Warn before removing -- this affects every card holding the level,
    // immediately. Granting needs no confirmation.
    if (!granted) {
      setPending({ levelId, levelName: level.levelName, areaId, areaName: area.areaName, granted });
      return;
    }
    applyToggle(levelId, areaId, granted);
  }

  function applyToggle(levelId: number, areaId: number, granted: boolean) {
    if (!matrix) return;
    const level = matrix.levels.find((l) => l.levelId === levelId);
    if (!level) return;

    const currentAreaIds = matrix.areas
        .filter((_, i) => level.permitted[i])
        .map((a) => a.areaId);

    const nextAreaIds = granted
        ? [...new Set([...currentAreaIds, areaId])]
        : currentAreaIds.filter((id) => id !== areaId);

    replaceAreas.mutate({ levelId, areaIds: nextAreaIds }, {
      onError: (error) => toast.error(error instanceof ApiError ? error.problem.detail : "Could not update the mapping"),
    });
  }

  async function confirmRemoval() {
    if (!pending) return;
    applyToggle(pending.levelId, pending.areaId, pending.granted);
    setPending(null);
  }

  return (
    <RequireRole allow={["IT_ADMIN"]}>
      <PageHeader
        title="Access levels"
        description="What each level permits. permits() is the one question the entry-point decision engine asks -- this screen is that answer, made visible."
        actions={<Button onClick={() => setShowCreate(true)}>New access level</Button>}
      />

      <div className="space-y-3">
        {levelsLoading && <TableSkeleton rows={3} />}
        {levels && levels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {levels.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-card border border-rule bg-surface px-3 py-1.5 text-sm">
                <span className="identifier">{l.levelCode}</span>
                <span>{l.levelName}</span>
                <StatusBadge status={l.active ? "ACTIVE" : "INACTIVE"} />
                <button
                  className="text-xs text-credential underline-offset-4 hover:underline"
                  onClick={() => void onToggleLevel(l.id, l.active)}
                >
                  {l.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <h2 className="mb-2 text-sm font-medium text-slate">Permission matrix</h2>
          {matrixLoading && <TableSkeleton rows={5} />}
          {matrixError && <ErrorState body="The matrix could not be loaded." onRetry={() => void refetchMatrix()} />}
          {matrix && <PermissionMatrixGrid matrix={matrix} onToggle={requestToggle} />}
        </div>

        {levels && areas && levels.length > 0 && areas.length > 0 && (
          <RuleTestPanel levels={levels} areas={areas} />
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New access level</DialogTitle></DialogHeader>
          <FormShell onSubmit={onCreate} formError={formError} isPending={createLevel.isPending}
                     submitLabel="Create" onCancel={() => setShowCreate(false)}>
            <Field label="Code" name="levelCode" required hint="e.g. AL-EXEC — up to 15 characters">
              <Input id="levelCode" value={levelCode} onChange={(e) => setLevelCode(e.target.value)} maxLength={15} required />
            </Field>
            <Field label="Name" name="levelName" required>
              <Input id="levelName" value={levelName} onChange={(e) => setLevelName(e.target.value)} maxLength={80} required />
            </Field>
            <Field label="Description" name="description">
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
            </Field>
          </FormShell>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Remove access?"
        body={pending
          ? `${pending.levelName} will no longer reach ${pending.areaName}. This takes effect immediately for every card holding this level.`
          : ""}
        confirmLabel="Remove access"
        destructive
        onConfirm={() => void confirmRemoval()}
        isPending={replaceAreas.isPending}
      />
    </RequireRole>
  );
}
