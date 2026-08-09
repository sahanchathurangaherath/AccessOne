"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";

export type DepartmentDto = {
  id: number; deptCode: string; deptName: string; description: string | null;
  active: boolean; employeeCount: number; deletable: boolean;
};

export type DepartmentInput = { deptCode: string; deptName: string; description?: string };

export type AreaDto = {
  id: number; areaCode: string; areaName: string; building: string | null;
  floorNo: string | null; restricted: boolean; active: boolean;
  description: string | null; levelCount: number;
};

export type AreaInput = {
  areaCode: string; areaName: string; building?: string; floorNo?: string;
  restricted: boolean; description?: string;
};

export type AreaRef = { id: number; areaCode: string; areaName: string };

export type AccessLevelDto = {
  id: number; levelCode: string; levelName: string; description: string | null;
  active: boolean; permittedAreas: AreaRef[];
};

export type AccessLevelInput = { levelCode: string; levelName: string; description?: string };

export type MatrixColumn = { areaId: number; areaCode: string; areaName: string; restricted: boolean };
export type MatrixRow = {
  levelId: number; levelCode: string; levelName: string; active: boolean; permitted: boolean[];
};
export type PermissionMatrix = { areas: MatrixColumn[]; levels: MatrixRow[] };

export type AccessTestResult = {
  granted: boolean; levelName: string; areaName: string;
  restrictedArea: boolean; denialReason: string | null;
};

export type AssignmentDto = {
  id: number; cardId: number; levelCode: string; levelName: string;
  assignedBy: string; validFrom: string; revokedAt: string | null;
  current: boolean; remarks: string | null;
};

const keys = {
  departments: ["config", "departments"] as const,
  areas: ["config", "areas"] as const,
  levels: ["config", "access-levels"] as const,
  matrix: ["config", "permission-matrix"] as const,
  history: (cardId: number) => ["config", "cards", cardId, "history"] as const,
};

// ---------- departments ----------

export function useDepartments() {
  return useQuery({ queryKey: keys.departments, queryFn: () => http.get<DepartmentDto[]>("/config/departments") });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DepartmentInput) => http.post<DepartmentDto>("/config/departments", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.departments }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; body: DepartmentInput }) =>
      http.put<DepartmentDto>(`/config/departments/${vars.id}`, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.departments }),
  });
}

export function useToggleDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; active: boolean }) =>
      http.post<DepartmentDto>(`/config/departments/${vars.id}/${vars.active ? "reactivate" : "deactivate"}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.departments }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.del<void>(`/config/departments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.departments }),
  });
}

// ---------- areas ----------

export function useAreas() {
  return useQuery({ queryKey: keys.areas, queryFn: () => http.get<AreaDto[]>("/config/areas") });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AreaInput) => http.post<AreaDto>("/config/areas", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.areas }); qc.invalidateQueries({ queryKey: keys.matrix }); },
  });
}

export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; body: AreaInput }) => http.put<AreaDto>(`/config/areas/${vars.id}`, vars.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.areas }); qc.invalidateQueries({ queryKey: keys.matrix }); },
  });
}

export function useToggleArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; active: boolean }) =>
      http.post<AreaDto>(`/config/areas/${vars.id}/${vars.active ? "reactivate" : "deactivate"}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.areas }); qc.invalidateQueries({ queryKey: keys.matrix }); },
  });
}

// ---------- access levels ----------

export function useAccessLevels() {
  return useQuery({ queryKey: keys.levels, queryFn: () => http.get<AccessLevelDto[]>("/config/access-levels") });
}

export function useCreateAccessLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AccessLevelInput) => http.post<AccessLevelDto>("/config/access-levels", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.levels }); qc.invalidateQueries({ queryKey: keys.matrix }); },
  });
}

export function useToggleAccessLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; active: boolean }) =>
      http.post<AccessLevelDto>(`/config/access-levels/${vars.id}/${vars.active ? "reactivate" : "deactivate"}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.levels }); qc.invalidateQueries({ queryKey: keys.matrix }); },
  });
}

export function useReplaceAreas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { levelId: number; areaIds: number[] }) =>
      http.put<AccessLevelDto>(`/config/access-levels/${vars.levelId}/areas`, { areaIds: vars.areaIds }),
    // Never cache the matrix -- a revoked permission must take effect
    // immediately, so every change refetches it fresh.
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.levels }); qc.invalidateQueries({ queryKey: keys.matrix }); },
  });
}

// ---------- matrix and rule test ----------

export function usePermissionMatrix() {
  return useQuery({ queryKey: keys.matrix, queryFn: () => http.get<PermissionMatrix>("/config/permission-matrix") });
}

export function useAccessTest() {
  return useMutation({
    mutationFn: (vars: { levelId: number; areaId: number }) =>
      http.post<AccessTestResult>("/config/access-test", vars),
  });
}

// ---------- card assignment ----------

export function useAssignAccessLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { cardId: number; levelId: number; remarks?: string }) =>
      http.put<AssignmentDto>(`/config/cards/${vars.cardId}/access-level`,
        { levelId: vars.levelId, remarks: vars.remarks }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: keys.history(vars.cardId) }),
  });
}

export function useAccessHistory(cardId: number | null) {
  return useQuery({
    queryKey: keys.history(cardId ?? 0),
    queryFn: () => http.get<AssignmentDto[]>(`/config/cards/${cardId}/access-history`),
    enabled: cardId !== null && Number.isFinite(cardId),
  });
}
