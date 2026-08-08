"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { createResource } from "@/lib/resource";

export type RequestStatus =
  | "DRAFT" | "SUBMITTED" | "UNDER_VERIFICATION"
  | "APPROVED" | "REJECTED" | "WITHDRAWN" | "CANCELLED";

export type RequestType = "NEW" | "REPLACEMENT" | "RENEWAL";

export type DocumentType =
  | "PHOTO" | "NIC_COPY" | "APPOINTMENT_LETTER" | "POLICE_REPORT" | "OTHER";

export type CardRequestSummary = {
  id: number; requestNo: string; requestType: string; status: RequestStatus;
  employeeName: string; empId: string; departmentName: string;
  submittedAt: string | null; createdAt: string;
};

export type DocumentSummary = {
  id: number; documentType: string; fileName: string;
  mimeType: string; fileSizeBytes: number; uploadedAt: string;
};

export type CardRequestDetail = CardRequestSummary & {
  reason: string | null; previousCardId: number | null;
  designation: string; accessLevelName: string | null; hasPhoto: boolean;
  closedAt: string | null;
  editable: boolean; withdrawable: boolean; deletable: boolean;
  documents: DocumentSummary[];
};

export type CreateCardRequestInput = {
  requestType: RequestType;
  reason?: string;
  requestedAccessLevelId?: number;
  previousCardId?: number;
  employeeId?: number;
};

/**
 * The entire query/mutation layer for one resource, built from the shared
 * factory -- see docs/RECIPES.md. Everything below this line is either a
 * thin status-action alias or genuinely bespoke (file upload), not another
 * hand-rolled CRUD hook.
 */
export const requests = createResource<CardRequestSummary, CardRequestDetail, CreateCardRequestInput>(
  "/requests", "requests");

export const useSubmitRequest = () => requests.useAction("submit");
export const useWithdrawRequest = () => requests.useAction("withdraw");

// Photo and document upload are not standard CRUD, so they stay bespoke.

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return http.post<CardRequestDetail>(`/requests/${id}/photo`, form);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requests.keys.all }),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file, documentType }: { id: number; file: File; documentType: DocumentType }) => {
      const form = new FormData();
      form.append("file", file);
      return http.post<DocumentSummary>(
        `/requests/${id}/documents?documentType=${documentType}`, form);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requests.keys.all }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, docId }: { id: number; docId: number }) =>
      http.del<void>(`/requests/${id}/documents/${docId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requests.keys.all }),
  });
}
