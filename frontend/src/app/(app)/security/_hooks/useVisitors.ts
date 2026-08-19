"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { createResource } from "@/lib/resource";

export type VisitorDto = {
  id: number; visitorCode: string; fullName: string;
  idDocumentNo: string; idDocumentType: string;
  company: string | null; phone: string | null; email: string | null; visitorType: string;
  hostEmployeeId: number; hostEmployeeName: string; hostEmpId: string;
  hasPhoto: boolean; deleted: boolean; createdAt: string;
};

export type RegisterVisitorInput = {
  fullName: string; idDocumentType: string; idDocumentNo: string; visitorType: string;
  hostEmployeeId: number; company?: string; phone?: string; email?: string;
};

export type PassRow = {
  id: number; passNo: string; visitorName: string; visitorCode: string;
  hostName: string; status: string; validFrom: string; validUntil: string;
};

export type PassDetail = {
  id: number; passNo: string;
  visitorId: number; visitorName: string; visitorCode: string;
  hostEmployeeId: number; hostName: string; hostEmpId: string;
  accessLevelId: number; accessLevelName: string;
  purpose: string; validFrom: string; validUntil: string;
  status: string; cancelledReason: string | null;
  issuedAt: string; issuedByUsername: string; createdAt: string;
};

export type IssuePassInput = {
  visitorId: number; hostEmployeeId: number; accessLevelId: number;
  purpose: string; validFrom: string; validUntil: string;
};

export type OnSiteDto = {
  visitLogId: number; passId: number; visitorCode: string; visitorName: string; company: string | null;
  visitorType: string; passNo: string; passStatus: string; validUntil: string;
  hostName: string; hostEmpId: string; entryArea: string | null;
  checkInAt: string; minutesOnSite: number; passOverdue: boolean;
};

export type DailyReportDto = {
  visitDate: string; totalVisits: number; stillOnSite: number;
  distinctVisitors: number; contractorVisits: number; avgMinutesOnSite: number;
};

/** id, list, detail, and the lifecycle actions -- same shape as every other module. */
export const visitors = createResource<VisitorDto, VisitorDto, RegisterVisitorInput>("/visitors", "visitors");
export const passes = createResource<PassRow, PassDetail, IssuePassInput>("/passes", "passes");

export const useSuspendPass = () => passes.useAction("suspend");
export const useReinstatePass = () => passes.useAction("reinstate");
export const useCancelPass = () => passes.useAction("cancel");
export const useReturnPass = () => passes.useAction("return");
export const useExtendPass = () => passes.useAction("extend");
export const useCheckIn = () => passes.useAction("check-in");
export const useCheckOut = () => passes.useAction("check-out");

export function useOnSite() {
  return useQuery({
    queryKey: ["visitors", "on-site"],
    queryFn: () => http.get<OnSiteDto[]>("/visitors/on-site"),
    // A live view of who is in the building -- worth refreshing on an interval.
    refetchInterval: 30_000,
  });
}

export function useDailyReport(fromDate?: string) {
  return useQuery({
    queryKey: ["visitors", "reports", "daily", fromDate ?? ""],
    queryFn: () => http.get<DailyReportDto[]>(`/visitors/reports/daily${fromDate ? `?fromDate=${fromDate}` : ""}`),
  });
}
