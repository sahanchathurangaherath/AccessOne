"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";
import type { PageResponse } from "@/lib/paged";

export type Direction = "IN" | "OUT";

export type EvaluateInput = {
  credentialRef: string;
  areaCode: string;
  direction: Direction;
};

export type AccessResult = {
  granted: boolean;
  denialReason: string | null;
  holderName: string;
  areaName: string;
  logId: number;
  at: string;
};

export type AccessLogRow = {
  id: number;
  credentialType: string;
  credentialRef: string;
  holderName: string;
  areaName: string;
  direction: string;
  decision: string;
  denialReason: string | null;
  accessTime: string;
};

/** The single decision entry point -- one call, either credential type. */
export function useEvaluate() {
  return useMutation({
    mutationFn: (body: EvaluateInput) => http.post<AccessResult>("/access/evaluate", body),
  });
}

/** Polled, so a denial from the simulator appears here within seconds. */
export function useRecentAttempts() {
  return useQuery({
    queryKey: ["access", "logs", "recent"],
    queryFn: () => http.get<PageResponse<AccessLogRow>>("/access/logs?page=0&size=10"),
    refetchInterval: 5_000,
  });
}
