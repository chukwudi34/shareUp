import Link from "next/link";
import { Headphones, MessageCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { SupportConversation } from "@/lib/types";
import { AdminSupportThread } from "@/components/admin/support-thread";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support · Control centre" };

export default async function AdminSupportPage() {
  await requirePermission("support.manage");
  const { data, meta } = await apiFetch<{
    data: SupportConversation[];
    meta: { open: number; pending: number };
  }>("admin/support");

  const needsReply = data.filter((conversation) => conversation.status === "OPEN");
  const awaitingParticipant = data.filter((conversation) => conversation.status === "PENDING");
  const closed = data.filter((conversation) => conversation.status === "CLOSED");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[20px] font-bold">
            <Headphones className="h-5 w-5 text-brand" /> Support
          </h2>
          <p className="mt-1 text-[12px] text-muted">
            Requests and complaints raised from the support chat. Replies notify the participant and
            appear in their widget.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-warn">{meta.open} need a reply</span>
          <span className="badge badge-lime">{meta.pending} awaiting participant</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="card-pad card flex flex-col items-center py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-lime-soft text-brand">
            <MessageCircle className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[13px] font-semibold">No support conversations yet</p>
          <p className="mt-1 max-w-sm text-[11.5px] text-muted">
            Messages sent from the support chat will show up here, with the participant and their
            reference.
          </p>
          <Link href="/admin" className="btn-secondary btn-sm mt-4">
            Back to overview
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { title: "Needs a reply", items: needsReply },
            { title: "Awaiting participant", items: awaitingParticipant },
            { title: "Closed", items: closed },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section key={group.title} className="space-y-3">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
                  {group.title}{" "}
                  <span className="font-semibold text-muted/70">({group.items.length})</span>
                </h3>
                {group.items.map((conversation) => (
                  <AdminSupportThread key={conversation.id} conversation={conversation} />
                ))}
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
