"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { Opportunity, Transaction } from "@/lib/types";
import { formatKobo } from "@/lib/money";
import { apiPost, ClientApiError } from "@/lib/client";
import { LogoMark } from "./logo";

export function SandboxCheckout({
  transaction,
  opportunity,
  signature,
}: {
  transaction: Transaction;
  opportunity: Opportunity | null;
  signature: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(transaction.status === "PAID");

  const isDeposit = transaction.type === "DEPOSIT";
  const isContribution = transaction.type === "CONTRIBUTION";

  if (paid) {
    return (
      <div className="mx-auto w-full max-w-[460px]">
        <div className="card card-pad text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-soft text-brand">
            <Check className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 font-display text-[26px] font-extrabold">Payment verified</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            {formatKobo(transaction.amount)} was confirmed for{" "}
            {isDeposit ? "your wallet" : opportunity?.title ?? "your contribution"}.
          </p>

          <div className="mt-5 rounded-2xl bg-cream px-4 py-3 text-left">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">Reference</span>
              <span className="font-mono text-[11px] font-semibold text-ink">{transaction.reference}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[12px]">
              <span className="text-muted">Status</span>
              <span className="font-semibold text-brand">Verified server-side</span>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <Link href={isDeposit ? "/wallet" : "/participations"} className="btn-primary w-full">
              {isDeposit ? "Back to wallet" : "View my participations"} <ArrowRight className="h-4 w-4" />
            </Link>
            {isContribution && opportunity && (
              <Link href={`/opportunities/${opportunity.slug}`} className="btn-secondary w-full">
                Back to opportunity
              </Link>
            )}
          </div>
        </div>
        <p className="mt-3 text-center text-[10.5px] text-muted">
          Recorded in the ShareUp double-entry ledger. A refund is queued automatically if capacity
          closed before this payment was claimed.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="notice-warn mb-3 flex items-start gap-2 text-[12px]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Sandbox checkout.</strong> This is a local payment simulator. No real money moves
          and no card is charged.
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="flex items-center gap-2">
            <LogoMark className="h-8 w-8 rounded-[10px]" />
            <span className="font-display text-[16px] font-extrabold">ShareUp</span>
          </span>
          <span className="flex items-center gap-1 text-[10.5px] font-semibold text-muted">
            <Lock className="h-3 w-3 text-brand" /> Secure checkout
          </span>
        </div>

        <div className="px-5 py-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            Amount to pay
          </p>
          <p className="mt-1.5 font-display text-[38px] font-extrabold leading-none tracking-[-0.04em]">
            {formatKobo(transaction.amount)}
          </p>
          <p className="mt-2 text-[12px] text-muted">
            {isDeposit ? "Wallet top-up" : opportunity?.title ?? "Contribution"}
          </p>
        </div>

        <div className="border-t border-line px-5 py-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted">Paying with</span>
            <span className="flex items-center gap-2 font-semibold text-ink">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[9px] font-bold text-white">
                S
              </span>
              Sandbox transfer
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px]">
            <span className="text-muted">Payment reference</span>
            <span className="font-mono text-[10.5px]">{transaction.reference}</span>
          </div>
          {isContribution && opportunity && (
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <span className="text-muted">Units</span>
              <span className="font-semibold">
                {Number(transaction.metadata?.units ?? 0).toLocaleString()} at {formatKobo(opportunity.unitPrice ?? 0)}
              </span>
            </div>
          )}
        </div>

        {error && <div className="mx-5 mb-3 notice-danger text-[12px]">{error}</div>}

        <div className="px-5 pb-5">
          <button
            type="button"
            disabled={busy || !signature}
            onClick={async () => {
              if (!signature) return;
              setBusy(true);
              setError(null);
              try {
                await apiPost(`payments/sandbox/settle`, {
                  reference: transaction.reference,
                  signature,
                });
                setPaid(true);
                router.refresh();
              } catch (exception) {
                setError(
                  exception instanceof ClientApiError
                    ? exception.message
                    : "The payment could not be verified."
                );
                setBusy(false);
              }
            }}
            className="btn-primary btn-lg w-full"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {busy ? "Verifying with provider…" : `Pay ${formatKobo(transaction.amount)}`}
          </button>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-muted">
            The server verifies this payment signature before any capacity is claimed.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="mx-auto mt-3 block text-[11px] font-medium text-muted hover:text-ink"
      >
        Cancel and go back
      </button>
    </div>
  );
}
