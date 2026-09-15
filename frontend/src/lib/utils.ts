import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status?: string): string {
  if (!status) return "text-slate-600";
  const s = status.toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    ACTIVE: "text-emerald-700",
    APPROVED: "text-emerald-700",
    GRANTED: "text-emerald-700",
    PASS: "text-emerald-700",
    COMPLETED: "text-emerald-700",
    VERIFIED: "text-emerald-700",
    PRINTED: "text-blue-700",
    DISPATCHED: "text-blue-700",
    ISSUED: "text-emerald-700",
    SUBMITTED: "text-amber-700",
    PENDING: "text-amber-700",
    PENDING_HR: "text-amber-700",
    UNDER_VERIFICATION: "text-amber-700",
    QUEUED: "text-amber-700",
    DRAFT: "text-slate-600",
    DENIED: "text-red-700",
    REJECTED: "text-red-700",
    REVOKED: "text-red-700",
    CANCELLED: "text-slate-600",
    SUSPENDED: "text-red-700",
    EXPIRED: "text-amber-700",
    VOID: "text-red-700",
    FAIL: "text-red-700",
  };
  return map[s] || "text-slate-700";
}

export function getStatusBgColor(status?: string): string {
  if (!status) return "bg-slate-50 border-slate-200";
  const s = status.toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 border-emerald-200",
    APPROVED: "bg-emerald-50 border-emerald-200",
    GRANTED: "bg-emerald-50 border-emerald-200",
    PASS: "bg-emerald-50 border-emerald-200",
    COMPLETED: "bg-emerald-50 border-emerald-200",
    VERIFIED: "bg-emerald-50 border-emerald-200",
    PRINTED: "bg-blue-50 border-blue-200",
    DISPATCHED: "bg-blue-50 border-blue-200",
    ISSUED: "bg-emerald-50 border-emerald-200",
    SUBMITTED: "bg-amber-50 border-amber-200",
    PENDING: "bg-amber-50 border-amber-200",
    PENDING_HR: "bg-amber-50 border-amber-200",
    UNDER_VERIFICATION: "bg-amber-50 border-amber-200",
    QUEUED: "bg-amber-50 border-amber-200",
    DRAFT: "bg-slate-50 border-slate-200",
    DENIED: "bg-red-50 border-red-200",
    REJECTED: "bg-red-50 border-red-200",
    REVOKED: "bg-red-50 border-red-200",
    CANCELLED: "bg-slate-50 border-slate-200",
    SUSPENDED: "bg-red-50 border-red-200",
    EXPIRED: "bg-amber-50 border-amber-200",
    VOID: "bg-red-50 border-red-200",
    FAIL: "bg-red-50 border-red-200",
  };
  return map[s] || "bg-slate-50 border-slate-200";
}

export function getInitials(name?: string): string {
  if (!name || name.trim().length === 0) return "AO";
  const parts = name.trim().split(/[\s._-]+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(date);
  }
}
