"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Headphones, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useDialog } from "@/components/dialog-provider";
import type { SupportConversation } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "GENERAL", label: "General enquiry" },
  { value: "PAYMENT", label: "Payment or wallet" },
  { value: "OPPORTUNITY", label: "An opportunity" },
  { value: "ACCOUNT", label: "My account" },
  { value: "COMPLAINT", label: "Complaint" },
] as const;

const POLL_MS = 8000;

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const response = await fetch(`/api/proxy/${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const firstError =
      payload?.errors && typeof payload.errors === "object"
        ? (Object.values(payload.errors)[0] as string[] | undefined)?.[0]
        : null;
    throw new Error(firstError ?? payload?.message ?? "Support is unavailable right now.");
  }

  return payload as T;
}

function timeLabel(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export function SupportWidget() {
  const pathname = usePathname();
  const dialog = useDialog();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<string>("GENERAL");
  const messagesRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<number | null>(null);

  conversationIdRef.current = conversation?.id ?? null;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const payload = await request<{ data: SupportConversation | null }>("support/conversation");
      setConversation(payload.data);
    } catch {
      if (!silent) {
        dialog.alert("We could not reach the support team. Please try again.", {
          title: "Support unavailable",
          tone: "danger",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dialog]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => void load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const container = messagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [open, conversation?.messages?.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function submit() {
    const message = draft.trim();
    if (message.length < 2) {
      dialog.alert("Write a message before sending.", { title: "Support" });
      return;
    }

    setSending(true);
    try {
      if (conversationIdRef.current === null) {
        const payload = await request<{ data: SupportConversation }>("support/conversation", {
          method: "POST",
          body: { category, message, subject: message.slice(0, 120) },
        });
        setConversation(payload.data);
        dialog.notify("Message sent", "A real person from our team will reply here.", "success");
      } else {
        const payload = await request<{ data: SupportConversation }>(
          "support/conversation/messages",
          { method: "POST", body: { message } }
        );
        setConversation(payload.data);
      }
      setDraft("");
    } catch (cause) {
      dialog.alert(cause instanceof Error ? cause.message : "Your message was not sent.", {
        title: "Message not sent",
        tone: "danger",
      });
    } finally {
      setSending(false);
    }
  }

  function startOver() {
    setConversation(null);
    setDraft("");
    setCategory("GENERAL");
  }

  if (pathname.startsWith("/admin")) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[70] flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-[12.5px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(0,98,28,0.7)] transition hover:bg-brand-dark lg:bottom-6 lg:right-6"
        aria-label="Chat with ShareUp support"
      >
        <MessageCircle className="h-4 w-4" />
        Support
      </button>
    );
  }

  const closed = conversation?.status === "CLOSED";

  return (
    <aside
      role="dialog"
      aria-label="ShareUp support chat"
      className="fixed inset-x-3 bottom-3 z-[75] flex max-h-[min(620px,calc(100dvh-96px))] flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_30px_80px_-30px_rgba(20,41,27,0.5)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-line bg-brand px-4 py-3.5 text-white">
        <div className="flex items-start gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
            <Headphones className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-bold">ShareUp support</p>
            <p className="text-[10.5px] text-white/75">
              {conversation
                ? `${conversation.reference} · ${closed ? "Closed" : "Open"}`
                : "Real people, usually replying within one business day"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close support chat"
          className="rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div
        ref={messagesRef}
        className="min-h-[180px] flex-1 space-y-2.5 overflow-y-auto bg-cream/60 px-3.5 py-4"
        aria-live="polite"
      >
        {loading && !conversation ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[11.5px] text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your conversation…
          </div>
        ) : !conversation ? (
          <div className="rounded-2xl bg-white px-4 py-4 text-[12px] leading-relaxed text-muted ring-1 ring-line">
            <p className="font-semibold text-ink">How can we help?</p>
            <p className="mt-1">
              Ask a question, report a payment problem or make a complaint. You can follow the
              thread here and our team replies in the same place.
            </p>
          </div>
        ) : (
          conversation.messages?.map((message) => {
            if (message.senderType === "SYSTEM") {
              return (
                <p
                  key={message.id}
                  className="mx-auto max-w-[92%] rounded-xl bg-white/70 px-3 py-2 text-center text-[10.5px] leading-relaxed text-muted ring-1 ring-line/70"
                >
                  {message.body}
                </p>
              );
            }

            const mine = message.senderType === "USER";

            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed shadow-sm",
                    mine
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-white text-ink ring-1 ring-line"
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                      {message.senderName ?? "Support"}
                    </p>
                  )}
                  <p className="whitespace-pre-line">{message.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[9.5px]",
                      mine ? "text-white/65" : "text-muted"
                    )}
                  >
                    {timeLabel(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {closed ? (
        <div className="border-t border-line px-3.5 py-3">
          <p className="text-[11px] text-muted">
            This conversation was closed. Start a new one whenever you need us.
          </p>
          <button type="button" onClick={startOver} className="btn-primary btn-sm mt-2 w-full">
            Start a new conversation
          </button>
        </div>
      ) : (
        <div className="border-t border-line px-3.5 py-3">
          {!conversation && (
            <label className="mb-2 block">
              <span className="text-[10.5px] font-semibold text-muted">What is this about?</span>
              <select
                className="select mt-1 py-2 text-[12px]"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                disabled={sending}
              >
                {CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!sending) void submit();
                }
              }}
              maxLength={2000}
              placeholder="Write your message…"
              className="input min-h-[44px] resize-none px-3 py-2 text-[12px]"
              disabled={sending}
            />
            <button
              type="button"
              onClick={submit}
              disabled={sending || draft.trim().length < 2}
              aria-label="Send message"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[9.5px] leading-snug text-muted">
            Never share your password, PIN or full card details here.
          </p>
        </div>
      )}
    </aside>
  );
}
