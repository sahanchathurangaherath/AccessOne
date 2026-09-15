"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";
import type { PageResponse } from "@/lib/paged";

export type AuditAction =
  | "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE"
  | "LOGIN" | "LOGOUT" | "APPROVE" | "REJECT" | "REVOKE";

export type AuditLogRow = {
  id: number;
  entityName: string;
  entityId: number;
  action: AuditAction;
  oldValue: string | null;
  newValue: string | null;
  performedByUsername: string;
  ipAddress: string | null;
  performedAt: string;
};

export type AuditFilters = {
  entityName?: string;
  entityId?: number;
  action?: AuditAction;
  username?: string;
  from?: string;
  to?: string;
  page?: number;
};

/** SYSTEM_ADMIN only -- SecurityConfig gates the endpoint, this is just the client for it. */
export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: ["audit", filters],
    queryFn: () => {
      const search = new URLSearchParams({ page: String(filters.page ?? 0), size: "25" });
      if (filters.entityName) search.set("entityName", filters.entityName);
      if (filters.entityId) search.set("entityId", String(filters.entityId));
      if (filters.action) search.set("action", filters.action);
      if (filters.username) search.set("username", filters.username);
      if (filters.from) search.set("from", filters.from);
      if (filters.to) search.set("to", filters.to);
      return http.get<PageResponse<AuditLogRow>>(`/audit?${search}`);
    },
  });
}
