"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import type { PageResponse } from "@/lib/paged";

export type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
  [key: string]: string | number | undefined;
};

export type TimelineEntry = {
  status: string;
  changedBy: string;
  changedAt: string;
  note: string;
};

/**
 * Builds the standard query and mutation hooks for one REST resource.
 *
 * Every module's data layer is this shape; only the path and the types
 * change. Adding a module should not mean rewriting cache invalidation.
 */
export function createResource<TSummary, TDetail, TInput>(
  basePath: string,
  key: string
) {
  const keys = {
    all: [key] as const,
    list: (params: ListParams) => [key, "list", params] as const,
    detail: (id: number) => [key, "detail", id] as const,
    timeline: (id: number) => [key, "timeline", id] as const,
  };

  function query(params: ListParams) {
    const search = new URLSearchParams();
    search.set("page", String(params.page ?? 0));
    search.set("size", String(params.size ?? 20));
    if (params.sort) search.set("sort", params.sort);
    for (const [k, v] of Object.entries(params)) {
      if (["page", "size", "sort"].includes(k)) continue;
      if (v !== undefined && v !== "") search.set(k, String(v));
    }
    return search.toString();
  }

  function useList(params: ListParams = {}) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: () => http.get<PageResponse<TSummary>>(`${basePath}?${query(params)}`),
    });
  }

  function useDetail(id: number | null) {
    return useQuery({
      queryKey: keys.detail(id ?? 0),
      queryFn: () => http.get<TDetail>(`${basePath}/${id}`),
      enabled: id !== null && Number.isFinite(id),
    });
  }

  function useTimeline(id: number | null) {
    return useQuery({
      queryKey: keys.timeline(id ?? 0),
      queryFn: () => http.get<TimelineEntry[]>(`${basePath}/${id}/timeline`),
      enabled: id !== null && Number.isFinite(id),
    });
  }

  function useInvalidate() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: keys.all });
  }

  function useCreate() {
    const invalidate = useInvalidate();
    return useMutation({
      mutationFn: (body: TInput) => http.post<TDetail>(basePath, body),
      onSuccess: invalidate,
    });
  }

  function useUpdate() {
    const invalidate = useInvalidate();
    return useMutation({
      mutationFn: (vars: { id: number; body: TInput }) =>
        http.put<TDetail>(`${basePath}/${vars.id}`, vars.body),
      onSuccess: invalidate,
    });
  }

  function useRemove() {
    const invalidate = useInvalidate();
    return useMutation({
      mutationFn: (id: number) => http.del<void>(`${basePath}/${id}`),
      onSuccess: invalidate,
    });
  }

  /**
   * POST /{basePath}/{id}/{action} -- submit, withdraw, approve, reject,
   * cancel, check-in, handover. Almost every verb in this system is one of
   * these, so one hook covers them all.
   */
  function useAction(action: string) {
    const invalidate = useInvalidate();
    return useMutation({
      mutationFn: (vars: { id: number; body?: unknown } | number) => {
        const id = typeof vars === "number" ? vars : vars.id;
        const body = typeof vars === "number" ? undefined : vars.body;
        return http.post<TDetail>(`${basePath}/${id}/${action}`, body);
      },
      onSuccess: invalidate,
    });
  }

  return { keys, useList, useDetail, useTimeline,
           useCreate, useUpdate, useRemove, useAction };
}
