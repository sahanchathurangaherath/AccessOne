"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
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
import {
  Shield,
  Plus,
  SlidersHorizontal,
  Building2,
  Key,
  IdCard,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  // KPI calculations
  const totalLevels = levels?.length ?? 0;
  const activeLevels = levels?.filter((l) => l.active).length ?? 0;
  const totalAreas = areas?.length ?? 0;
  const totalGrants = matrix?.levels.reduce((acc, curr) => acc + curr.permitted.filter(Boolean).length, 0) ?? 0;

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await createLevel.mutateAsync({ levelCode, levelName, description: description || undefined });
      toast.success("Access level created successfully");
      setShowCreate(false);
      setLevelCode("");
      setLevelName("");
      setDescription("");
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

    // Warn before removing -- this affects every card holding the level immediately
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

    replaceAreas.mutate(
      { levelId, areaIds: nextAreaIds },
      {
        onSuccess: () => toast.success("Permission matrix updated"),
        onError: (error) => toast.error(error instanceof ApiError ? error.problem.detail : "Could not update the mapping"),
      }
    );
  }

  async function confirmRemoval() {
    if (!pending) return;
    applyToggle(pending.levelId, pending.areaId, pending.granted);
    setPending(null);
  }

  return (
    <RequireRole allow={["IT_ADMIN", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Access Levels & Permission Matrix
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-credential border border-blue-200/60">
                Rule Engine
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Configure perimeter clearances, manage physical authorization matrices, and test door access in real-time.
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
            <Link
              href="/it/areas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Key className="h-3.5 w-3.5 text-slate-500" />
              <span>Security Areas</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <Shield className="h-3.5 w-3.5" />
              <span>Access Levels ({totalLevels})</span>
            </span>
            <Link
              href="/it/cards"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <IdCard className="h-3.5 w-3.5 text-slate-500" />
              <span>Card Directory</span>
            </Link>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE ACCESS MATRIX KPIS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Access Tiers
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
                <Shield className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalLevels}</span>
              <span className="text-xs font-medium text-slate-400">configured</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Security privilege profiles</div>
          </div>

          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Tiers
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{activeLevels}</span>
              <span className="text-xs font-medium text-emerald-600">operational</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Assigned to active cards</span>
            </div>
          </div>

          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Physical Zones
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <Key className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalAreas}</span>
              <span className="text-xs font-medium text-slate-400">monitored</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Target security perimeters</div>
          </div>

          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Permissions
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                <Layers className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{totalGrants}</span>
              <span className="text-xs font-medium text-amber-600">matrix links</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700">Level-to-Area clearance rules</div>
          </div>
        </div>

        {/* ─── 2. ACCESS LEVEL TIERS QUICK ROSTER ─── */}
        <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <Shield className="h-4 w-4 text-credential" />
                Configured Access Level Tiers
              </h2>
              <p className="text-xs text-slate-500">
                Privilege profiles assigned to employee credentials during request approvals
              </p>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              size="sm"
              className="gap-1.5 rounded-xl bg-credential text-white hover:bg-credential/90 shadow-xs text-xs font-semibold h-9 px-3.5"
            >
              <Plus className="h-4 w-4" />
              <span>New Access Level</span>
            </Button>
          </div>

          {levelsLoading ? (
            <TableSkeleton rows={2} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {levels?.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl border border-rule/80 bg-paper p-4 flex flex-col justify-between hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="identifier font-bold text-xs text-ink">{l.levelCode}</span>
                      <StatusBadge status={l.active ? "ACTIVE" : "INACTIVE"} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">{l.levelName}</p>
                    {l.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">{l.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-rule/50 flex items-center justify-between">
                    <button
                      onClick={() => void onToggleLevel(l.id, l.active)}
                      className="text-xs font-semibold text-credential hover:underline"
                    >
                      {l.active ? "Deactivate Tier" : "Reactivate Tier"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 3. INTERACTIVE PERMISSION MATRIX GRID ─── */}
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Layers className="h-4 w-4 text-credential" />
              Interactive Permission Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Click any cell to grant physical clearance. Revoking an existing clearance requires explicit confirmation.
            </p>
          </div>

          {matrixLoading && <TableSkeleton rows={5} />}
          {matrixError && (
            <ErrorState body="The permission matrix could not be loaded." onRetry={() => void refetchMatrix()} />
          )}
          {matrix && <PermissionMatrixGrid matrix={matrix} onToggle={requestToggle} />}
        </div>

        {/* ─── 4. LIVE RULE SIMULATION SANDBOX ─── */}
        {levels && areas && levels.length > 0 && areas.length > 0 && (
          <RuleTestPanel levels={levels} areas={areas} />
        )}

        {/* ─── 5. NEW ACCESS LEVEL MODAL ─── */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="rounded-2xl border-rule bg-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
                <Shield className="h-5 w-5 text-credential" />
                <span>Create New Access Level</span>
              </DialogTitle>
            </DialogHeader>
            <FormShell
              onSubmit={onCreate}
              formError={formError}
              isPending={createLevel.isPending}
              submitLabel="Create Access Level"
              onCancel={() => setShowCreate(false)}
            >
              <Field label="Level Code" name="levelCode" required hint="e.g. AL-EXEC, AL-DEV — up to 15 characters">
                <Input
                  id="levelCode"
                  value={levelCode}
                  onChange={(e) => setLevelCode(e.target.value.toUpperCase())}
                  maxLength={15}
                  required
                  placeholder="e.g. AL-EXEC"
                  className="rounded-xl font-mono"
                />
              </Field>
              <Field label="Level Name" name="levelName" required>
                <Input
                  id="levelName"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  maxLength={80}
                  required
                  placeholder="e.g. Executive & VIP Suite Access"
                  className="rounded-xl"
                />
              </Field>
              <Field label="Description & Policy Notes" name="description">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={255}
                  placeholder="Privilege scope or security clearance policy..."
                  className="rounded-xl min-h-20"
                />
              </Field>
            </FormShell>
          </DialogContent>
        </Dialog>

        {/* ─── 6. REMOVE CLEARANCE CONFIRMATION ─── */}
        <ConfirmDialog
          open={pending !== null}
          onOpenChange={(open) => !open && setPending(null)}
          title="Revoke Physical Access?"
          body={
            pending
              ? `Are you sure you want to revoke access? Credentials holding ${pending.levelName} will immediately be locked out of ${pending.areaName}.`
              : ""
          }
          confirmLabel="Revoke Access"
          destructive
          onConfirm={() => void confirmRemoval()}
          isPending={replaceAreas.isPending}
        />
      </div>
    </RequireRole>
  );
}
