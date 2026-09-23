"use client";

import { useState, useRef, useEffect } from "react";
import { useSecOpsCopilot } from "@/hooks/useSecOpsCopilot";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Send,
  X,
  Trash2,
  Terminal,
  Bot,
  User,
  Loader2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SecOpsCopilotDrawerProps {
  initialPrompt?: string;
}

export function SecOpsCopilotDrawer({ initialPrompt }: SecOpsCopilotDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, clearHistory, isThinking } = useSecOpsCopilot();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setIsOpen(true);
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "Show me active visitors on-site",
    "Audit summary for card #ACO-2026-000030",
    "Show me open security alerts",
  ];

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || isThinking) return;
    sendMessage(input.trim());
    setInput("");
  }

  function handlePromptChip(chip: string) {
    sendMessage(chip);
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl hover:bg-slate-800 transition-all duration-200 border border-slate-700 hover:scale-105 active:scale-95 group"
          aria-label="Open SecOps Copilot"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </span>
          <Sparkles className="h-4 w-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span>SecOps Copilot</span>
        </button>
      )}

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl border-l border-slate-200 sm:w-[480px] animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-inner">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold tracking-tight text-white">
                    SecOps Conversational Copilot
                  </h2>
                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-400/30">
                    Spring AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Read-only natural language queries for physical access & security audit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-slate-400 shrink-0 font-medium">Quick asks:</span>
            {quickPrompts.map((chip) => (
              <button
                key={chip}
                onClick={() => handlePromptChip(chip)}
                disabled={isThinking}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors text-[11px] font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2.5",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-xl p-3 shadow-sm",
                    m.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none space-y-2"
                  )}
                >
                  {/* Tool invocation badge */}
                  {m.toolInvoked && (
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 text-[10px] text-slate-500 font-mono">
                      <Terminal className="h-3 w-3 text-indigo-500" />
                      <span>{m.toolInvoked}</span>
                    </div>
                  )}

                  {/* Render content */}
                  <div className="whitespace-pre-wrap leading-relaxed overflow-x-auto font-sans">
                    {m.content}
                  </div>

                  <div
                    className={cn(
                      "text-[9px] pt-1 flex items-center justify-end",
                      m.role === "user" ? "text-slate-400" : "text-slate-400"
                    )}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.role === "user" && (
                  <div className="h-7 w-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2.5 items-center text-xs text-indigo-600 bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 max-w-[80%]">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Translating query & executing database tools...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Query Input Box */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 bg-white p-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot (e.g. 'Show active visitors' or card serial #)..."
              disabled={isThinking}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isThinking}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 h-8 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
