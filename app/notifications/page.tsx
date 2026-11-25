import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/session";
import type { NotificationItem } from "@/lib/types";
import { NotificationList } from "@/components/notification-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireUser("/notifications");

  const response = await apiFetch<{ data: NotificationItem[]; meta: { unread: number } }>("notifications");

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex items-start justify-between border-b border-line pb-6">
        <div>
          <p className="eyebrow">Updates</p>
          <h1 className="mt-1.5 font-display text-[30px] font-extrabold tracking-[-0.04em] sm:text-[36px]">
            Notifications
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Funding milestones, payment confirmations, refunds and distributions.
          </p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-soft text-brand">
          <Bell className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-6">
        <NotificationList items={response.data} />
      </div>
    </div>
  );
}
