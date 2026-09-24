"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useSecOpsCopilot } from "@/hooks/useSecOpsCopilot";
import { Button } from "@/components/ui/button";
import {
  Send,
  X,
  RotateCcw,
  Terminal,
  User,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  Users,
  CreditCard,
  ShieldAlert,
  Search,
  ArrowUp,
  Sparkles,
  HelpCircle,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SecOpsCopilotDrawerProps {
  initialPrompt?: string;
}

export function SecOpsCopilotDrawer({ initialPrompt }: SecOpsCopilotDrawerProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showDiscoveryCallout, setShowDiscoveryCallout] = useState(true);
  const { messages, sendMessage, clearHistory, isThinking } = useSecOpsCopilot(user?.role);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmployee = user?.role === "EMPLOYEE";

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && sessionStorage.getItem("accessone_copilot_callout_dismissed");
    if (dismissed) {
      setShowDiscoveryCallout(false);
    }
  }, []);

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

  // Role-tailored prompt discovery chips
  const quickPrompts = isEmployee
    ? [
        { label: "Check my card request status", icon: CreditCard },
        { label: "How long is my digital pass valid?", icon: HelpCircle },
        { label: "Report my card lost or damaged", icon: ShieldAlert },
        { label: "Smart badge & door access guide", icon: Compass },
      ]
    : user?.role === "HR_MANAGER"
    ? [
        { label: "Pending card requests summary", icon: Users },
        { label: "Photo compliance guidelines", icon: ImageIcon },
        { label: "Card replacement policy", icon: CreditCard },
        { label: "Employee onboarding guide", icon: HelpCircle },
      ]
    : user?.role === "PRINT_SUPERVISOR"
    ? [
        { label: "Print queue status", icon: Terminal },
        { label: "QC rejection analysis", icon: ShieldAlert },
        { label: "Cards ready for dispatch", icon: CreditCard },
        { label: "Throughput metrics", icon: Search },
      ]
    : [
        { label: "Active visitors on-site", icon: Users },
        { label: "Audit card #ACO-2026-000030", icon: CreditCard },
        { label: "Open security alerts", icon: ShieldAlert },
        { label: "Recent access denials", icon: Search },
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

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`Photo selected: ${file.name}. Analyzing photo compliance...`);
      sendMessage(`Inspect uploaded portrait photo (${file.name}) for ICAO/ISO 19794-5 compliance.`);
    }
  }

  function handleVoiceInput() {
    if (!isRecording) {
      setIsRecording(true);
      toast.info("Listening for query... Speak now.");
      // Simulated voice recognition timeout for realistic UX
      setTimeout(() => {
        setIsRecording(false);
        const query = isEmployee
          ? "What is the status of my ID card request?"
          : "Show me active visitors currently checked in on-site";
        setInput(query);
        toast.success(`Voice transcribed: '${query}'`);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  }

  return (
    <>
      {/* 0. High-Visibility Onboarding Discovery Callout Pill */}
      {showDiscoveryCallout && !isOpen && (
        <div className={cn(
          "fixed z-40 flex items-center gap-2.5 rounded-2xl border border-sky-400/40 bg-slate-900/95 shadow-2xl backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-2 duration-300",
          isEmployee
            ? "bottom-7 right-[88px] sm:right-[96px] px-4 py-3"
            : "bottom-6.5 right-[80px] sm:right-[88px] px-3.5 py-2.5"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/25 text-sky-400 shadow-inner">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="text-left group cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                {isEmployee ? "Ask Copilot AI" : "AccessOne Copilot AI"}
              </span>
              <span className="rounded-full bg-sky-500/30 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-sky-300 border border-sky-400/40">
                ACTIVE
              </span>
            </div>
            <p className="text-[10.5px] text-slate-300 font-medium">
              {isEmployee
                ? "Instant help with smart badge requests & passes"
                : "Ask telemetry, card audits & instant queries"}
            </p>
          </button>
          <button
            onClick={() => {
              setShowDiscoveryCallout(false);
              sessionStorage.setItem("accessone_copilot_callout_dismissed", "true");
            }}
            className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. Sized-Up Circular Floating Launcher with Dynamic Glow and Sizing */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed z-40 flex items-center justify-center rounded-full bg-slate-900 shadow-2xl border-[2.5px] hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer",
            isEmployee
              ? "bottom-6 right-6 h-[72px] w-[72px] border-sky-400/90 shadow-[0_0_28px_rgba(56,189,248,0.45)] ring-4 ring-sky-500/20"
              : "bottom-6 right-6 h-16 w-16 border-slate-700/90 hover:bg-slate-800"
          )}
          aria-label={isEmployee ? "Open AccessOne Assistant" : "Open AccessOne Copilot"}
          title={isEmployee ? "Open AccessOne Assistant" : "Open AccessOne Copilot"}
        >
          {/* Live Beacon Ring */}
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-sky-500 border-2 border-slate-900" />
          </span>

          {/* Modern Robot Graphic / Avatar */}
          <div className="relative flex items-center justify-center">
            <svg
              className={cn(
                "text-sky-400 group-hover:scale-110 group-hover:text-sky-300 transition-all duration-200",
                isEmployee ? "h-10 w-10" : "h-9 w-9"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Antenna */}
              <path d="M12 7V3" />
              <circle cx="12" cy="2" r="1" fill="currentColor" />
              {/* Head Shell */}
              <rect width="18" height="13" x="3" y="7" rx="4" />
              {/* Ears / Side Sensors */}
              <path d="M1 13h2" />
              <path d="M21 13h2" />
              {/* Visor / Eyes */}
              <circle cx="8.5" cy="13" r="1.5" fill="currentColor" />
              <circle cx="15.5" cy="13" r="1.5" fill="currentColor" />
              {/* Smile / Grid */}
              <path d="M9.5 16.5h5" />
            </svg>
          </div>
        </button>
      )}

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-surface shadow-2xl border-l border-rule sm:w-[500px] animate-in slide-in-from-right duration-300">
          {/* Header - Prominent Branding & Subtitle */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              {/* Modern Bot Graphic in Header */}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700/80 shadow-inner">
                <svg
                  className="h-7 w-7 text-sky-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 7V3" />
                  <circle cx="12" cy="2" r="1" fill="currentColor" />
                  <rect width="18" height="13" x="3" y="7" rx="4" />
                  <path d="M1 13h2" />
                  <path d="M21 13h2" />
                  <circle cx="8.5" cy="13" r="1.5" fill="currentColor" />
                  <circle cx="15.5" cy="13" r="1.5" fill="currentColor" />
                  <path d="M9.5 16.5h5" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 ring-2 ring-slate-900" />
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white leading-tight">
                  {isEmployee ? "AccessOne Employee Assistant" : "AccessOne Copilot"}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isEmployee
                    ? "24/7 Smart Badge, Pass & Request Assistant"
                    : "Physical Access Intelligence & Security Operations Assistant"}
                </p>
              </div>
            </div>

            {/* Header Action Controls (Delete / Reset moved to top action cluster) */}
            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                disabled={messages.length <= 1}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                title="Close Copilot"
                aria-label="Close Copilot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
                {/* Assistant Chat Avatar with Inside Bot Graphic */}
                {m.role === "assistant" && (
                  <div className="relative h-9 w-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <svg
                      className="h-5 w-5 text-sky-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 7V3" />
                      <circle cx="12" cy="2" r="1" fill="currentColor" />
                      <rect width="18" height="13" x="3" y="7" rx="3" />
                      <circle cx="8.5" cy="13" r="1.5" fill="currentColor" />
                      <circle cx="15.5" cy="13" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
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
              <div className="flex gap-2.5 items-center text-xs text-slate-700 bg-white p-3.5 rounded-2xl border border-rule shadow-xs max-w-[85%]">
                <Loader2 className="h-4 w-4 animate-spin text-credential" />
                <span>Auditing live physical security telemetry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Area: Quick Asks + Rich Modern Chat Input */}
          <div className="border-t border-rule bg-surface p-3.5 space-y-3">
            {/* 2. Modern Quick Ask Pill Section (Slightly larger, modern contemporary style) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-slate-400 shrink-0 font-medium text-[10px] uppercase tracking-wider pl-1">
                Quick Ask:
              </span>
              {quickPrompts.map((chip) => {
                const IconComponent = chip.icon;
                return (
                  <button
                    key={chip.label}
                    onClick={() => handlePromptChip(chip.label)}
                    disabled={isThinking}
                    className="group inline-flex items-center gap-1.5 shrink-0 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-ink active:scale-95 transition-all duration-150"
                  >
                    <IconComponent className="h-3.5 w-3.5 text-slate-500 group-hover:text-credential transition-colors" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. Modern Integrated Chat Input Area with Image Attachment & Voice Icons */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center rounded-2xl border border-rule bg-paper/60 px-3 py-1.5 focus-within:border-credential focus-within:bg-white focus-within:ring-2 focus-within:ring-credential/20 shadow-2xs transition-all duration-200">
                {/* Left Action: Attach Image/File */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-credential hover:bg-slate-100 transition-colors shrink-0"
                  title="Attach ID portrait or badge photo"
                  aria-label="Attach photo"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isRecording
                      ? "Listening to voice input..."
                      : isEmployee
                      ? "Ask Copilot (e.g. card request status, lost badge, pass validity)..."
                      : "Ask Copilot (e.g. active visitors, card audit, alerts)..."
                  }
                  disabled={isThinking}
                  className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-ink placeholder:text-slate-400 focus:outline-none"
                />

                {/* Right Action 1: Voice Input Microphone */}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={cn(
                    "rounded-lg p-1.5 transition-colors shrink-0 mr-1",
                    isRecording
                      ? "text-rose-600 bg-rose-100 animate-pulse"
                      : "text-slate-400 hover:text-credential hover:bg-slate-100"
                  )}
                  title={isRecording ? "Listening..." : "Dictate voice query"}
                  aria-label="Voice input"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Right Action 2: Modern Circular Send Button */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isThinking}
                  className="h-8 w-8 rounded-xl bg-credential hover:bg-credential/90 text-white p-0 flex items-center justify-center shrink-0 shadow-xs disabled:opacity-40 transition-all"
                  aria-label="Send message"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
