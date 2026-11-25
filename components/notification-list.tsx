"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Info, MailCheck } from "lucide-react";
import type { NotificationItem } from "@/lib/types";
import { apiPost } from "@/lib/client";
import { cn } from "@/lib/utils";

function timeAgo(value: string | null): string {
  if (!value) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const icons = {
  SUCCESS: CheckCircle2,
  WARNING: AlertCircle,
  INFO: Info,
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(items);
  const unread = notifications.filter((item) => !item.readAt).length;

  async function markAll() {
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    await apiPost("notifications/read-all").catch(() => null);
    router.refresh();
  }

  async function markOne(id: number) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item))
    );
    await apiPost(`notifications/${id}/read`).catch(() => null);
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-soft text-brand">
          <Bell className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-bold">You&apos;re all caught up</h2>
        <p className="mt-1 text-sm text-muted">Funding milestones, confirmations and payouts will show up here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-muted">
          {unread > 0 ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "Everything is read"}
        </p>
        {unread > 0 && (
          <button type="button" onClick={markAll} className="btn-secondary btn-sm">
            <MailCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="card divide-y divide-line overflow-hidden">
        {notifications.map((item) => {
          const Icon = icons[item.kind as keyof typeof icons] ?? Info;
          const content = (
            <>
              <span
                className={cn(
                  "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  item.kind === "SUCCESS" && "bg-lime-soft text-brand",
                  item.kind === "WARNING" && "bg-warn-bg text-warn",
                  !["SUCCESS", "WARNING"].includes(item.kind) && "bg-cream text-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("text-[13px] text-ink", item.readAt ? "font-medium" : "font-bold")}>{item.title}</p>
                  {!item.readAt && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{item.body}</p>
              </div>
              <span className="shrink-0 text-[10.5px] text-muted">{timeAgo(item.createdAt)}</span>
            </>
          );

          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => markOne(item.id)}
              className={cn("flex items-start gap-3 px-4 py-3.5 transition hover:bg-cream/60 sm:px-5", !item.readAt && "bg-lime-soft/20")}
            >
              {content}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => markOne(item.id)}
              className={cn("flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-cream/60 sm:px-5", !item.readAt && "bg-lime-soft/20")}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
