"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RequestAiEvaluation } from "@/types/ai";

export function useAiTriage(requestId: number | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<RequestAiEvaluation>({
    queryKey: ["ai-triage", requestId],
    queryFn: () => api<RequestAiEvaluation>(`/requests/${requestId}/ai-evaluation`),
    enabled: Boolean(requestId),
    staleTime: 60_000,
  });

  const reEvaluate = useMutation({
    mutationFn: () =>
      api<RequestAiEvaluation>(`/requests/${requestId}/ai-evaluation/re-evaluate`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["ai-triage", requestId], data);
    },
  });

  return {
    ...query,
    reEvaluate,
  };
}
