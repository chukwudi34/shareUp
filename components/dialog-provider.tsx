"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type DialogTone = "info" | "success" | "danger";

export type AlertOptions = {
  title?: string;
  tone?: DialogTone;
  confirmLabel?: string;
};

export type ConfirmOptions = AlertOptions & {
  cancelLabel?: string;
};

type DialogRequest = {
  id: number;
  kind: "alert" | "confirm";
  message: string;
  title: string;
  tone: DialogTone;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (confirmed: boolean) => void;
};

type Toast = {
  id: number;
  title: string;
  body?: string;
  tone: DialogTone;
};

type DialogApi = {
  /** Show a blocking dialog with a single acknowledgement button. */
  alert: (message: string, options?: AlertOptions) => Promise<void>;
  /** Ask the user to confirm an action. Resolves to their choice. */
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  /** Show a non-blocking notification that dismisses itself. */
  notify: (title: string, body?: string, tone?: DialogTone) => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const api = useContext(DialogContext);
  if (!api) throw new Error("useDialog must be used inside <DialogProvider>.");
  return api;
}

const toneIconClass: Record<DialogTone, string> = {
  info: "bg-lime-soft text-brand",
  success: "bg-lime-soft text-brand",
  danger: "bg-[#fdf1f1] text-danger",
};

const toneIcon = {
  info: Info,
  success: CheckCircle2,
  danger: AlertTriangle,
} as const;

const toastIconClass: Record<DialogTone, string> = {
  info: "text-brand",
  success: "text-brand",
  danger: "text-danger",
};

const toastIcon = {
  info: Info,
  success: CheckCircle2,
  danger: XCircle,
} as const;

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dialogRef = useRef<DialogRequest | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);
  const titleId = useId();
  const descriptionId = useId();

  const open = useCallback((request: DialogRequest) => {
    dialogRef.current?.resolve(false);
    dialogRef.current = request;
    setDialog(request);
  }, []);

  const close = useCallback((confirmed: boolean) => {
    const current = dialogRef.current;
    if (!current) return;
    dialogRef.current = null;
    setDialog(null);
    current.resolve(confirmed);
  }, []);

  const alert = useCallback(
    (message: string, options?: AlertOptions) =>
      new Promise<void>((resolve) => {
        open({
          id: ++counter.current,
          kind: "alert",
          message,
          title: options?.title ?? "Notice",
          tone: options?.tone ?? "info",
          confirmLabel: options?.confirmLabel ?? "OK",
          cancelLabel: "Cancel",
          resolve: () => resolve(),
        });
      }),
    [open]
  );

  const confirm = useCallback(
    (message: string, options?: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        open({
          id: ++counter.current,
          kind: "confirm",
          message,
          title: options?.title ?? "Are you sure?",
          tone: options?.tone ?? "info",
          confirmLabel: options?.confirmLabel ?? "Confirm",
          cancelLabel: options?.cancelLabel ?? "Cancel",
          resolve,
        });
      }),
    [open]
  );

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (title: string, body?: string, tone: DialogTone = "info") => {
      const id = ++counter.current;
      setToasts((current) => [...current.slice(-2), { id, title, body, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), 5000)
      );
    },
    [dismissToast]
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
    };
  }, []);

  useEffect(() => {
    if (!dialog) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [dialog, close]);

  useEffect(() => {
    if (dialog) confirmRef.current?.focus();
  }, [dialog]);

  const Icon = dialog ? toneIcon[dialog.tone] : Info;

  return (
    <DialogContext.Provider value={{ alert, confirm, notify }}>
      {children}

      {dialog && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center"
          onMouseDown={() => close(false)}
        >
          <div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onMouseDown={(event) => event.stopPropagation()}
            className="dialog-panel w-full max-w-[420px] rounded-[22px] border border-line bg-white p-5 shadow-[0_30px_80px_-30px_rgba(20,41,27,0.45)]"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                  toneIconClass[dialog.tone]
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id={titleId}
                  className="font-display text-[17px] font-extrabold tracking-[-0.02em]"
                >
                  {dialog.title}
                </h2>
                <p
                  id={descriptionId}
                  className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-muted"
                >
                  {dialog.message}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {dialog.kind === "confirm" && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="btn-secondary btn-sm"
                >
                  {dialog.cancelLabel}
                </button>
              )}
              <button
                ref={confirmRef}
                type="button"
                onClick={() => close(true)}
                className={cn("btn-sm", dialog.tone === "danger" ? "btn-danger" : "btn-primary")}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const ToastIcon = toastIcon[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className="toast-item pointer-events-auto flex w-full items-start gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-3 shadow-[0_16px_40px_-18px_rgba(20,41,27,0.4)] sm:max-w-[360px]"
            >
              <ToastIcon className={cn("mt-0.5 h-4 w-4 shrink-0", toastIconClass[toast.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold">{toast.title}</p>
                {toast.body && (
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{toast.body}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-full p-0.5 text-muted transition hover:bg-cream hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </DialogContext.Provider>
  );
}
