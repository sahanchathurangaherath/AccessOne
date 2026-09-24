"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CopilotMessage, CopilotQueryResponse } from "@/types/ai";

export function useSecOpsCopilot(userRole?: string) {
  const getInitialMessage = (): string => {
    switch (userRole) {
      case "EMPLOYEE":
        return "👋 **Welcome to AccessOne Copilot!**\n\nI'm your AI assistant for ID badge requests, digital passes, facility access, and card help:\n- *'What is the status of my card request?'*\n- *'How long is my digital PDF pass valid?'*\n- *'How do I report a lost or damaged card?'*\n- *'What facility zones does my badge access?'*";
      case "HR_MANAGER":
        return "👋 **AccessOne HR & Identity Copilot Ready**.\n\nAsk me about onboarding pipelines, card verification, or identity policies:\n- *'Show me pending employee card requests'*\n- *'What are the requirements for employee ID photo approval?'*\n- *'Summarize card replacement guidelines'*";
      case "PRINT_SUPERVISOR":
        return "👋 **AccessOne Production Copilot Ready**.\n\nAsk me about print queues, batch throughput, or QC analysis:\n- *'Show me current print queue status'*\n- *'What are the main causes for QC rejections?'*\n- *'List cards ready for dispatch packaging'*";
      default:
        return "👋 **AccessOne SecOps Copilot Ready**.\n\nYou can ask about real-time access telemetry, on-site visitors, or trace incident cards:\n- *'Show me active visitors currently on-site'*\n- *'Generate incident audit for card serial #ACO-2026-000030'*\n- *'Show me open security alerts and impossible travel warnings'*";
    }
  };

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "initial-assistant-msg",
      role: "assistant",
      content: getInitialMessage(),
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
        content: userRole === "EMPLOYEE"
          ? "Conversation reset. How can I help with your ID badge, card request, or facility access?"
          : "Conversation history cleared. How can I assist physical access and security operations?",
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
