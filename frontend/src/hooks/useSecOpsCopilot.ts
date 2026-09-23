"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CopilotMessage, CopilotQueryResponse } from "@/types/ai";

export function useSecOpsCopilot() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "initial-assistant-msg",
      role: "assistant",
      content:
        "👋 **AccessOne SecOps Copilot Ready**.\n\nYou can ask about real-time access telemetry, on-site visitors, or trace incident cards:\n- *'Show me active visitors currently on-site'*\n- *'Generate incident audit for card serial #ACO-2026-000030'*\n- *'Show me open security alerts and impossible travel warnings'*",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const queryMutation = useMutation({
    mutationFn: (prompt: string) =>
      api<CopilotQueryResponse>("/copilot/query", {
        method: "POST",
        body: { prompt },
      }),
    onSuccess: (data, prompt) => {
      const assistantMsg: CopilotMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        toolInvoked: data.toolInvoked,
        parameters: data.parameters,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
    onError: (err) => {
      const errorMsg: CopilotMessage = {
        id: `assistant-err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Error executing SecOps query: ${err instanceof Error ? err.message : "Security decision server unreachable"}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  function sendMessage(prompt: string) {
    if (!prompt.trim() || queryMutation.isPending) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    queryMutation.mutate(prompt.trim());
  }

  function clearHistory() {
    setMessages([
      {
        id: "cleared-msg",
        role: "assistant",
        content: "Conversation history cleared. How can I assist physical security operations?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  return {
    messages,
    sendMessage,
    clearHistory,
    isThinking: queryMutation.isPending,
  };
}
