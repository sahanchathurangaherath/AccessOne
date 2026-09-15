"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import type { PageResponse } from "@/lib/paged";

export type NotificationDto = {
  id: number;
  type: string;
  title: string;
  message: string;
  entityName: string | null;
  entityId: number | null;
  actionPath: string | null;
  read: boolean;
  createdAt: string;
};

export type UnreadSummary = { count: number };

const keys = {
  unread: ["notifications", "unread"] as const,
  list: ["notifications", "list"] as const,
};

export function useUnreadCount() {
  return useQuery({
    queryKey: keys.unread,
    queryFn: () => http.get<UnreadSummary>("/notifications/unread"),
    // A minute is frequent enough to feel live without hammering the API
    // on every page nav -- this is a badge count, not a live feed.
    refetchInterval: 60_000,
  });
}

export function useNotificationList(enabled: boolean) {
  return useQuery({
    queryKey: keys.list,
    queryFn: () => http.get<PageResponse<NotificationDto>>("/notifications?size=10"),
    enabled,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.post<NotificationDto>(`/notifications/${id}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http.post<void>("/notifications/read-all"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
