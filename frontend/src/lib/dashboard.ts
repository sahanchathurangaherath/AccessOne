"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";

export type EmployeeDashboard = { cardStatus: string | null; requestsInProgress: number };
export type HrDashboard = {
  pending: number; overdue: number; decidedThisWeek: number; avgTurnaroundHours: number;
};
export type ItDashboard = {
  activeCards: number; revokedCards: number; awaitingGeneration: number; activeAccessLevels: number;
  byDepartment: { deptCode: string; deptName: string; totalCards: number; activeCards: number; revokedCards: number }[];
};
export type SecurityDashboard = {
  onSiteNow: number; openAlerts: number; deniedToday: number; expiringWithinHour: number;
};
export type PrintDashboard = { queued: number; inProgress: number; printedToday: number; reprintRatePct: number };
export type AdminDashboard = {
  users: number; auditEntriesToday: number; failedLogins: number;
  recentActivity: {
    entityName: string; entityId: number; action: string; performedBy: string; performedAt: string;
  }[];
};

export const dashboard = {
  useEmployee: () => useQuery({
    queryKey: ["dashboard", "employee"],
    queryFn: () => http.get<EmployeeDashboard>("/dashboard/employee"),
  }),
  useHr: () => useQuery({
    queryKey: ["dashboard", "hr"],
    queryFn: () => http.get<HrDashboard>("/dashboard/hr"),
  }),
  useIt: () => useQuery({
    queryKey: ["dashboard", "it"],
    queryFn: () => http.get<ItDashboard>("/dashboard/it"),
  }),
  useSecurity: () => useQuery({
    queryKey: ["dashboard", "security"],
    queryFn: () => http.get<SecurityDashboard>("/dashboard/security"),
  }),
  usePrint: () => useQuery({
    queryKey: ["dashboard", "print"],
    queryFn: () => http.get<PrintDashboard>("/dashboard/print"),
  }),
  useAdmin: () => useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => http.get<AdminDashboard>("/dashboard/admin"),
  }),
};
