"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useUnreadCount, useNotificationList, useMarkRead, useMarkAllRead,
  type NotificationDto,
} from "@/lib/notifications";

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread } = useUnreadCount();
  const { data: list, isLoading } = useNotificationList(open);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const count = unread?.count ?? 0;

  function onSelect(notification: NotificationDto) {
    if (!notification.read) markRead.mutate(notification.id);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            className="relative rounded-card p-2 hover:bg-paper"
            aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center
                           justify-center rounded-full bg-denied px-1 text-[10px]
                           font-medium text-white"
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {count > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-credential underline-offset-4 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <p className="px-3 py-6 text-center text-sm text-slate">Loading…</p>
          )}
          {!isLoading && (list?.content.length ?? 0) === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate">
              Nothing yet -- you are caught up.
            </p>
          )}
          {list?.content.map((n) => {
            const item = (
              <DropdownMenuItem
                key={n.id}
                onClick={() => onSelect(n)}
                className="flex flex-col items-start gap-0.5 whitespace-normal px-3 py-2"
              >
                <span className={`text-sm ${n.read ? "text-slate" : "font-medium text-ink"}`}>
                  {n.title}
                </span>
                <span className="text-xs text-slate">{n.message}</span>
                <span className="identifier text-[10px] text-slate">{timeAgo(n.createdAt)}</span>
              </DropdownMenuItem>
            );
            return n.actionPath ? (
              <Link key={n.id} href={n.actionPath}>{item}</Link>
            ) : item;
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
