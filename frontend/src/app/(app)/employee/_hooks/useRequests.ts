"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import type { PageResponse } from "@/lib/paged";

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

export type RequestTimelineEntry = {
  status: string; changedBy: string; changedAt: string; note: string;
};

export type CreateCardRequestInput = {
  requestType: RequestType;
  reason?: string;
  requestedAccessLevelId?: number;
  previousCardId?: number;
  employeeId?: number;
};

const keys = {
  all: ["requests"] as const,
  list: (status?: RequestStatus, page = 0) => [...keys.all, "list", status ?? "ALL", page] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
  timeline: (id: number) => [...keys.all, "timeline", id] as const,
};

export function useRequestList(status?: RequestStatus, page = 0) {
  return useQuery({
    queryKey: keys.list(status, page),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (status) params.set("status", status);
      return http.get<PageResponse<CardRequestSummary>>(`/requests?${params}`);
    },
  });
}

export function useRequest(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => http.get<CardRequestDetail>(`/requests/${id}`),
    enabled: Number.isFinite(id),
  });
}

export function useRequestTimeline(id: number) {
  return useQuery({
    queryKey: keys.timeline(id),
    queryFn: () => http.get<RequestTimelineEntry[]>(`/requests/${id}/timeline`),
    enabled: Number.isFinite(id),
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCardRequestInput) =>
      http.post<CardRequestDetail>("/requests", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateRequest(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCardRequestInput) =>
      http.put<CardRequestDetail>(`/requests/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return http.post<CardRequestDetail>(`/requests/${id}/photo`, form);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, docId }: { id: number; docId: number }) =>
      http.del<void>(`/requests/${id}/documents/${docId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useSubmitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.post<CardRequestDetail>(`/requests/${id}/submit`),
    // Invalidate everything for this feature. Precise invalidation is a
    // later optimisation, not a Phase 5 problem.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useWithdrawRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.post<CardRequestDetail>(`/requests/${id}/withdraw`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.del<void>(`/requests/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}
