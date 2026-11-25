"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiPost, ClientApiError } from "@/lib/client";
import { useDialog } from "@/components/dialog-provider";

export function CancelParticipation({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    const confirmed = await dialog.confirm(
      `Cancel your participation in ${title}? A refund will be queued if you have paid.`,
      {
        title: "Cancel participation",
        confirmLabel: "Yes, cancel",
        cancelLabel: "Keep participation",
        tone: "danger",
      }
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);

    try {
      await apiPost(`participations/${id}/cancel`);
      router.refresh();
    } catch (exception) {
      setError(exception instanceof ClientApiError ? exception.message : "Could not cancel this participation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={cancel}
        disabled={busy}
        className="btn-ghost btn-sm text-[11.5px] text-danger hover:bg-[#fdf1f1]"
      >
        {busy && <Loader2 className="h-3 w-3 animate-spin" />}
        {busy ? "Cancelling…" : "Cancel"}
      </button>
      {error && <span className="max-w-[180px] text-right text-[10px] text-danger">{error}</span>}
    </div>
  );
}
