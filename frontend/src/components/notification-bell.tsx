"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  KeyRound,
  Ban,
  ShieldAlert,
  Clock,
  CheckCheck,
  Inbox,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useUnreadCount,
  useNotificationList,
  useMarkRead,
  useMarkAllRead,
  type NotificationDto,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "REQUEST_SUBMITTED":
      return {
        icon: <FileText className="h-4 w-4" />,
        color: "bg-blue-50 text-blue-600 border-blue-200/60",
      };
    case "REQUEST_APPROVED":
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
      };
    case "REQUEST_REJECTED":
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "bg-rose-50 text-rose-600 border-rose-200/60",
      };
    case "CARD_ACTIVATED":
      return {
        icon: <KeyRound className="h-4 w-4" />,
        color: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
      };
    case "CARD_REVOKED":
      return {
        icon: <Ban className="h-4 w-4" />,
        color: "bg-rose-50 text-rose-600 border-rose-200/60",
      };
    case "SECURITY_ALERT":
      return {
        icon: <ShieldAlert className="h-4 w-4" />,
        color: "bg-rose-50 text-rose-600 border-rose-200/60",
      };
    case "PASS_EXPIRING":
      return {
        icon: <Clock className="h-4 w-4" />,
        color: "bg-amber-50 text-amber-600 border-amber-200/60",
      };
    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        color: "bg-slate-50 text-slate-600 border-slate-200/60",
      };
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const { data: unread } = useUnreadCount();
  const { data: list, isLoading } = useNotificationList(open);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const count = unread?.count ?? 0;
  const rawList: NotificationDto[] = list?.content ?? [];

  const displayList = useMemo(() => {
    if (filterUnreadOnly) {
      return rawList.filter((n) => !n.read);
    }
    return rawList;
  }, [rawList, filterUnreadOnly]);

  function onSelect(notification: NotificationDto) {
    if (!notification.read) markRead.mutate(notification.id);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-rule bg-surface text-slate-600 hover:bg-slate-50 hover:text-ink shadow-2xs transition-colors"
            aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
          >
            <Bell className="h-4.5 w-4.5" aria-hidden="true" />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-pulse ring-2 ring-white"
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-88 sm:w-96 rounded-2xl border-rule bg-surface p-0 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule/70 px-4 py-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink">System Alerts</span>
            {count > 0 && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-credential border border-blue-200/60">
                {count} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {count > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-credential hover:text-credential/80 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-rule/50 bg-paper/60 text-xs">
          <button
            onClick={() => setFilterUnreadOnly(false)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all select-none",
              !filterUnreadOnly
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilterUnreadOnly(true)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all select-none flex items-center gap-1",
              filterUnreadOnly
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <span>Unread Only</span>
            {count > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            )}
          </button>
        </div>

        {/* Notification Stream */}
        <div className="max-h-96 overflow-y-auto divide-y divide-rule/50">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading alerts...
            </div>
          )}

          {!isLoading && displayList.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-2">
                <Inbox className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-600">All caught up!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {filterUnreadOnly ? "No unread alerts found." : "No new notifications at this time."}
              </p>
            </div>
          )}

          {displayList.map((n) => {
            const { icon, color } = getNotificationIcon(n.type);

            const item = (
              <DropdownMenuItem
                key={n.id}
                onClick={() => onSelect(n)}
                className={cn(
                  "flex items-start gap-3 p-3.5 transition-colors cursor-pointer outline-none select-none",
                  n.read
                    ? "bg-surface hover:bg-slate-50/70"
                    : "bg-blue-50/30 hover:bg-blue-50/60"
                )}
              >
                <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border shadow-2xs mt-0.5", color)}>
                  {icon}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-xs leading-tight truncate", n.read ? "font-semibold text-slate-700" : "font-bold text-ink")}>
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                    {n.message}
                  </p>

                  {n.actionPath && (
                    <div className="pt-1 flex items-center gap-1 text-[10px] font-semibold text-credential">
                      <span>View details</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>

                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-credential flex-shrink-0 mt-1.5" />
                )}
              </DropdownMenuItem>
            );

            return n.actionPath ? (
              <Link key={n.id} href={n.actionPath} className="block">
                {item}
              </Link>
            ) : (
              item
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
