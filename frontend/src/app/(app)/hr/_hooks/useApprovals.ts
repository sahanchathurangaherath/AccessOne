"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { createResource } from "@/lib/resource";
import type { PageResponse } from "@/lib/paged";
import type { DocumentSummary } from "@/app/(app)/employee/_hooks/useRequests";

export type Decision = "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED";

export type PendingRequestRow = {
  requestId: number; requestNo: string; requestType: string; status: string;
  empId: string; employeeName: string; designation: string; deptName: string;
  submittedAt: string; hoursPending: number; ageingFlag: "NORMAL" | "AGEING" | "OVERDUE";
};

export type CommentDto = {
  id: number; text: string; commentedBy: string; commentedAt: string;
};

export type ApprovalDetail = {
  approvalId: number; requestId: number; requestNo: string;
  decision: Decision; rejectionReason: string | null;
  employeeName: string; empId: string; designation: string; deptName: string;
  employeeStillActive: boolean;
  verifiedBy: string | null; verifiedAt: string | null;
  decidedBy: string | null; decidedAt: string | null;
  canVerify: boolean; canDecide: boolean;
  comments: CommentDto[]; documents: DocumentSummary[];
};

export type ApprovalHistoryRow = {
  requestId: number; requestNo: string; employeeName: string; empId: string;
  decision: Decision; decidedBy: string | null; decidedAt: string | null;
};

export type BulkOutcome = { requestId: number; success: boolean; message: string | null };
export type BulkResult = { successCount: number; failureCount: number; outcomes: BulkOutcome[] };

/**
 * requestId plays the role of "id" here -- every approval endpoint is
 * keyed by the card request it decides on, not the approval row's own id.
 */
export const approvals = createResource<never, ApprovalDetail, never>("/approvals", "approvals");

export const useVerify = () => approvals.useAction("verify");
export const useApprove = () => approvals.useAction("approve");
export const useComment = () => approvals.useAction("comments");

export function useReject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; reason: string }) =>
      http.post<ApprovalDetail>(`/approvals/${vars.id}/reject`, { reason: vars.reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: approvals.keys.all }),
  });
}

// The queue and history screens read different endpoints from the
// resource root, so they stay bespoke rather than forcing createResource
// to model paths it was not built for.

export function useQueue(params: { ageing?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ["approvals", "queue", params],
    queryFn: () => {
      const search = new URLSearchParams({
        page: String(params.page ?? 0),
        size: String(params.size ?? 20),
      });
      if (params.ageing) search.set("ageing", params.ageing);
      return http.get<PageResponse<PendingRequestRow>>(`/approvals/queue?${search}`);
    },
  });
}

export function useApprovalHistory(params: { deciderId?: number; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ["approvals", "history", params],
    queryFn: () => {
      const search = new URLSearchParams({
        page: String(params.page ?? 0),
        size: String(params.size ?? 20),
      });
      if (params.deciderId) search.set("deciderId", String(params.deciderId));
      return http.get<PageResponse<ApprovalHistoryRow>>(`/approvals/history?${search}`);
    },
  });
}

export function useBulkApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestIds: number[]) =>
      http.post<BulkResult>("/approvals/bulk-approve", { requestIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approvals"] }),
  });
}
