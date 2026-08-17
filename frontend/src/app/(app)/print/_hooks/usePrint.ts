"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { createResource } from "@/lib/resource";

export type PrintJobRow = {
  id: number; jobNo: string; cardSerial: string;
  employeeName: string; empId: string; departmentName: string;
  jobType: "INITIAL" | "REPRINT"; status: string; printerName: string | null;
  queuedAt: string; printedAt: string | null;
};

export type PrintJobDetail = {
  id: number; jobNo: string; cardId: number; cardSerial: string;
  employeeName: string; empId: string; departmentName: string;
  jobType: "INITIAL" | "REPRINT"; status: string; printerName: string | null;
  queuedAt: string; printedAt: string | null;
  qcResult: "PENDING" | "PASS" | "FAIL"; qcNotes: string | null; cancelledReason: string | null;
  dispatchable: boolean; createdAt: string;
};

export type DispatchRow = {
  id: number; printJobId: number; jobNo: string; cardSerial: string;
  employeeName: string; dispatchMethod: string; status: string;
  dispatchedAt: string | null; handedOverAt: string | null;
};

export type DispatchDetail = {
  id: number; printJobId: number; jobNo: string; cardId: number; cardSerial: string;
  employeeId: number; employeeName: string; empId: string;
  dispatchMethod: string; status: string; dispatchedAt: string | null;
  receivedByName: string | null; handedOverAt: string | null;
  handoverSignaturePath: string | null; remarks: string | null; createdAt: string;
};

export type ReprintRateRow = {
  deptName: string; totalJobs: number; initialJobs: number; reprintJobs: number;
  reprintRatePct: number; qcFailures: number;
};

export type ThroughputRow = {
  printDate: string; cardsPrinted: number; passed: number; failed: number;
  avgHoursInQueue: number;
};

/** id, list, detail, timeline (unused here), and the lifecycle actions -- same shape as every other module. */
export const printJobs = createResource<PrintJobRow, PrintJobDetail, never>("/print/jobs", "print-jobs");

export const useStart = () => printJobs.useAction("start");
export const useComplete = () => printJobs.useAction("complete");
export const useQc = () => printJobs.useAction("qc");
export const useReprint = () => printJobs.useAction("reprint");
export const useCancel = () => printJobs.useAction("cancel");

const dispatchKeys = {
  all: ["dispatch"] as const,
  list: (params: Record<string, unknown>) => ["dispatch", "list", params] as const,
  detail: (id: number) => ["dispatch", "detail", id] as const,
};

export function useDispatchList(page = 0, size = 20) {
  return useQuery({
    queryKey: dispatchKeys.list({ page, size }),
    queryFn: () => http.get(`/dispatch?page=${page}&size=${size}`) as Promise<{
      content: DispatchRow[]; page: number; size: number; totalElements: number;
      totalPages: number; first: boolean; last: boolean;
    }>,
  });
}

export function useDispatchDetail(id: number | null) {
  return useQuery({
    queryKey: dispatchKeys.detail(id ?? 0),
    queryFn: () => http.get<DispatchDetail>(`/dispatch/${id}`),
    enabled: id !== null && Number.isFinite(id),
  });
}

export function useOpenDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { printJobId: number; dispatchMethod: string; remarks?: string }) =>
      http.post<DispatchDetail>("/dispatch", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: dispatchKeys.all }),
  });
}

export function useDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.post<DispatchDetail>(`/dispatch/${id}/dispatch`),
    onSuccess: () => qc.invalidateQueries({ queryKey: dispatchKeys.all }),
  });
}

/** The moment the card becomes active -- receiverId must be the card's own employee, enforced server-side. */
export function useHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; receiverId: number; signature?: File }) => {
      const form = new FormData();
      if (vars.signature) form.append("signature", vars.signature);
      return http.post<DispatchDetail>(`/dispatch/${vars.id}/handover?receiverId=${vars.receiverId}`, form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dispatchKeys.all }),
  });
}

export function useMarkReturned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; reason: string }) =>
      http.post<DispatchDetail>(`/dispatch/${vars.id}/return`, { reason: vars.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: dispatchKeys.all }),
  });
}

export function useReprintRate() {
  return useQuery({
    queryKey: ["print", "reports", "reprint-rate"],
    queryFn: () => http.get<ReprintRateRow[]>("/print/reports/reprint-rate"),
  });
}

export function useThroughput() {
  return useQuery({
    queryKey: ["print", "reports", "throughput"],
    queryFn: () => http.get<ThroughputRow[]>("/print/reports/throughput"),
  });
}
