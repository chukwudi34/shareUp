"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, Send } from "lucide-react";
import { useDialog } from "@/components/dialog-provider";
import type { SupportConversation } from "@/lib/types";
import { formatDateTime } from "@/lib/money";
import { cn } from "@/lib/utils";

async function post(path: string, body: unknown) {
  const response = await fetch(`/api/proxy/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const firstError =
      payload?.errors && typeof payload.errors === "object"
        ? (Object.values(payload.errors)[0] as string[] | undefined)?.[0]
        : null;
    throw new Error(firstError ?? payload?.message ?? "The action could not be completed.");
  }

  return payload;
}

export function AdminSupportThread({ conversation }: { conversation: SupportConversation }) {
  const router = useRouter();
  const dialog = useDialog();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<"reply" | "close" | null>(null);

  const closed = conversation.status === "CLOSED";

  async function send() {
    const message = reply.trim();
    if (!message) return;

    setBusy("reply");
    try {
      await post(`admin/support/${conversation.id}/messages`, { message });
      setReply("");
      dialog.notify("Reply sent", "The participant has been notified.", "success");
      router.refresh();
    } catch (cause) {
      dialog.alert(cause instanceof Error ? cause.message : "The reply was not sent.", {
        title: "Reply failed",
        tone: "danger",
      });
    } finally {
      setBusy(null);
    }
  }

  async function closeConversation() {
    const confirmed = await dialog.confirm(
      `Close ${conversation.reference}? The participant can start a new chat afterwards.`,
      { title: "Close conversation", confirmLabel: "Close conversation", tone: "danger" }
    );
    if (!confirmed) return;

    setBusy("close");
    try {
      await post(`admin/support/${conversation.id}/close`, {});
      dialog.notify("Conversation closed", conversation.reference, "success");
      router.refresh();
    } catch (cause) {
      dialog.alert(cause instanceof Error ? cause.message : "Could not close the conversation.", {
        title: "Action failed",
        tone: "danger",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-[13px] font-bold">
            {conversation.userName ?? "Participant"}
            <span className="ml-2 text-[10.5px] font-medium text-muted">
              {conversation.userEmail}
            </span>
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted">
            {conversation.reference} · {conversation.category.replaceAll("_", " ")} ·{" "}
            {conversation.lastMessageAt
              ? `Last message ${formatDateTime(conversation.lastMessageAt)}`
              : "No messages yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "badge",
              closed ? "badge-neutral" : conversation.status === "OPEN" ? "badge-warn" : "badge-lime"
            )}
          >
            {closed ? "Closed" : conversation.status === "OPEN" ? "Needs reply" : "Awaiting participant"}
          </span>
          {!closed && (
            <button
              type="button"
              onClick={closeConversation}
              disabled={busy !== null}
              className="btn-ghost btn-sm text-[11.5px]"
            >
              {busy === "close" && <Loader2 className="h-3 w-3 animate-spin" />}
              Close
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[320px] space-y-2 overflow-y-auto bg-cream/50 px-4 py-3">
        {conversation.messages?.map((message) =>
          message.senderType === "SYSTEM" ? (
            <p
              key={message.id}
              className="mx-auto max-w-[92%] rounded-xl bg-white/70 px-3 py-1.5 text-center text-[10px] text-muted ring-1 ring-line/70"
            >
              {message.body}
            </p>
          ) : (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.senderType === "SUPPORT" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed",
                  message.senderType === "SUPPORT"
                    ? "rounded-br-md bg-brand text-white"
                    : "rounded-bl-md bg-white text-ink ring-1 ring-line"
                )}
              >
                <p className="mb-0.5 text-[9.5px] font-bold uppercase tracking-wide opacity-80">
                  {message.senderType === "SUPPORT"
                    ? message.senderName ?? "Support"
                    : conversation.userName ?? "Participant"}
                </p>
                <p className="whitespace-pre-line">{message.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[9px]",
                    message.senderType === "SUPPORT" ? "text-white/65" : "text-muted"
                  )}
                >
                  {formatDateTime(message.createdAt)}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {!closed && (
        <div className="flex items-end gap-2 border-t border-line px-4 py-3">
          <textarea
            rows={2}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (busy === null) void send();
              }
            }}
            placeholder="Reply to the participant…"
            className="input min-h-[42px] resize-none px-3 py-2 text-[11.5px]"
            disabled={busy !== null}
          />
          <button
            type="button"
            onClick={send}
            disabled={busy !== null || reply.trim().length === 0}
            className="btn-primary btn-sm"
          >
            {busy === "reply" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Reply
          </button>
        </div>
      )}

      {closed && (
        <p className="flex items-center gap-1.5 border-t border-line px-4 py-2.5 text-[10.5px] text-muted">
          <CheckCheck className="h-3.5 w-3.5 text-brand" /> Conversation closed
          {conversation.closedAt ? ` ${formatDateTime(conversation.closedAt)}` : ""}
        </p>
      )}
    </div>
  );
}
