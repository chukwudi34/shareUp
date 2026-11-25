"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, Wallet } from "lucide-react";
import { parseNairaInput } from "@/lib/money";
import { apiPost, ClientApiError, idempotencyKey } from "@/lib/client";

export function DepositForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("25000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kobo = parseNairaInput(amount) ?? 0;

  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-soft text-brand">
          <Wallet className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[14px] font-bold">Fund your wallet</h2>
          <p className="text-[11px] text-muted">For new contributions or top-ups</p>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {[10000, 25000, 50000].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(String(value))}
            className="chip flex-1 justify-center hover:border-brand/40 hover:text-brand"
          >
            ₦{(value / 1000).toFixed(0)}k
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-muted">₦</span>
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
          inputMode="numeric"
          className="input pl-8 font-semibold"
          aria-label="Deposit amount"
        />
      </div>

      {error && <div className="notice-danger mt-3 text-[12px]">{error}</div>}

      <button
        type="button"
        disabled={busy || kobo < 10000}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const response = await apiPost<{ data: { authorizationUrl: string | null } }>("wallet/deposit", {
              amountKobo: kobo,
              idempotencyKey: idempotencyKey("deposit"),
            });
            router.push(response.data.authorizationUrl ?? "/wallet");
          } catch (exception) {
            setError(exception instanceof ClientApiError ? exception.message : "Could not start the deposit.");
            setBusy(false);
          }
        }}
        className="btn-primary mt-3 w-full"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Opening checkout…" : "Continue to payment"}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>
      <p className="mt-2 text-center text-[10px] text-muted">Minimum deposit ₦100 · Sandbox checkout</p>
    </div>
  );
}
