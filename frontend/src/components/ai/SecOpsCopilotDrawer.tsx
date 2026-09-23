"use client";

import { useState, useRef, useEffect } from "react";
import { useSecOpsCopilot } from "@/hooks/useSecOpsCopilot";
import { Button } from "@/components/ui/button";
import {
  Send,
  X,
  Trash2,
  Terminal,
  User,
  Loader2,
  ShieldCheck,
  Sparkles,
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
    "Active visitors on-site",
    "Audit card #ACO-2026-000030",
    "Open security alerts",
    "Recent access denials",
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
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl hover:bg-slate-800 transition-all duration-200 border border-slate-700 hover:scale-105 active:scale-95 group"
          aria-label="Open AccessOne Copilot"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
          </span>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-bold tracking-tight">AccessOne Copilot</span>
        </button>
      )}

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-surface shadow-2xl border-l border-rule sm:w-[500px] animate-in slide-in-from-right duration-300">
          {/* Header - Prominent Branding & Subtitle */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/80 shadow-inner">
                <ShieldCheck className="h-6 w-6 text-sky-400" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 ring-2 ring-slate-900" />
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white leading-tight">
                  AccessOne Copilot
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Physical Access Intelligence &amp; Security Operations Assistant
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Close Copilot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {/* Assistant Chat Avatar with Inside Shield Emblem */}
                {m.role === "assistant" && (
                  <div className="relative h-8 w-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <ShieldCheck className="h-4 w-4 text-sky-400" />
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl p-3.5 shadow-xs",
                    m.role === "user"
                      ? "bg-credential text-white rounded-tr-none"
                      : "bg-white border border-rule text-ink rounded-tl-none space-y-2"
                  )}
                >
                  {/* Tool invocation badge */}
                  {m.toolInvoked && (
                    <div className="flex items-center gap-1.5 pb-1.5 border-b border-rule text-[10px] text-slate-500 font-mono">
                      <Terminal className="h-3 w-3 text-credential" />
                      <span>{m.toolInvoked}</span>
                    </div>
                  )}

                  {/* Render content */}
                  <div className="whitespace-pre-wrap leading-relaxed overflow-x-auto font-sans text-xs">
                    {m.content}
                  </div>

                  <div
                    className={cn(
                      "text-[9px] pt-1 flex items-center justify-end font-mono",
                      m.role === "user" ? "text-blue-100" : "text-slate-400"
                    )}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {/* User Chat Avatar with Inside Officer Emblem */}
                {m.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold text-[11px]">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2.5 items-center text-xs text-slate-700 bg-white p-3 rounded-xl border border-rule shadow-xs max-w-[85%]">
                <Loader2 className="h-4 w-4 animate-spin text-credential" />
                <span>Auditing live physical security telemetry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Area: Quick Asks + Delete History + Input Box */}
          <div className="border-t border-rule bg-surface p-3 space-y-2.5">
            {/* Quick Ask Chips Moved to Bottom */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
              <span className="text-slate-400 shrink-0 font-medium text-[10px] uppercase tracking-wider">
                Quick Ask:
              </span>
              {quickPrompts.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handlePromptChip(chip)}
                  disabled={isThinking}
                  className="shrink-0 rounded-full border border-rule bg-paper px-2.5 py-1 text-slate-700 hover:bg-slate-200 hover:text-ink transition-colors text-[11px] font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Row with Bottom Delete / Clear Button */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearHistory}
                disabled={messages.length <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-rule text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                title="Clear conversation history"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Copilot (e.g. active visitors, card audit, alerts)..."
                disabled={isThinking}
                className="flex-1 rounded-xl border border-rule bg-paper/60 px-3.5 py-2 text-xs text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-credential/20 focus:border-credential transition-all"
              />

              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isThinking}
                className="bg-credential hover:bg-credential/90 text-white font-semibold text-xs px-3.5 h-9 rounded-xl shrink-0 shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
