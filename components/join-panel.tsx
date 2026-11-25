"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { Opportunity, Participation } from "@/lib/types";
import { formatKobo, parseNairaInput } from "@/lib/money";
import { apiPost, idempotencyKey, ClientApiError } from "@/lib/client";
import { StatusBadge } from "./ui";

export function JoinPanel({
  opportunity,
  viewerParticipation,
  isAuthenticated,
}: {
  opportunity: Opportunity;
  viewerParticipation: Participation | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(opportunity.minContribution / 100));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountKobo = parseNairaInput(amount) ?? 0;
  const unitPrice = opportunity.unitPrice ?? 0;
  const units = unitPrice > 0 ? Math.floor(amountKobo / unitPrice) : 0;
  const effectiveAmount =
    opportunity.participationMethod === "UNITS" && unitPrice > 0 ? units * unitPrice : amountKobo;
  const ownershipPercent =
    opportunity.totalUnits && opportunity.totalUnits > 0
      ? ((units / opportunity.totalUnits) * 100).toFixed(2)
      : null;
  const packages =
    opportunity.unitsPerPackage && opportunity.unitsPerPackage > 0
      ? Math.floor(units / opportunity.unitsPerPackage)
      : units;

  const quickAmounts = useMemo(() => {
    const base = opportunity.minContribution;
    return Array.from(
      new Set([base, base * 2, base * 5].filter((value) => value <= opportunity.remainingAmount + opportunity.committedAmount))
    ).slice(0, 3);
  }, [opportunity]);

  const open = opportunity.status === "FUNDING" && new Date(opportunity.fundingDeadline ?? 0).getTime() > Date.now();

  if (viewerParticipation && ["CONFIRMED", "REFUND_PENDING"].includes(viewerParticipation.status)) {
    return (
      <div className="card card-pad">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-brand" />
          <h3 className="text-[16px] font-bold">You&apos;re in this one</h3>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          You committed <strong className="text-ink">{formatKobo(viewerParticipation.amount)}</strong> for{" "}
          <strong className="text-ink">{viewerParticipation.units.toLocaleString()} units</strong>.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-cream px-3.5 py-3">
          <span className="text-[12px] text-muted">Status</span>
          <StatusBadge status={viewerParticipation.status} />
        </div>
        <Link href="/participations" className="btn-primary mt-4 w-full">
          View my participations <ArrowRight className="h-4 w-4" />
        </Link>
        {viewerParticipation.status === "PENDING" && (
          <p className="mt-2 text-center text-[11px] text-muted">
            Payment is still pending. Open your participations to complete it.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Minimum contribution</p>
          <p className="mt-1 font-display text-[26px] font-extrabold leading-none">
            {formatKobo(opportunity.minContribution)}
          </p>
        </div>
        {open ? <StatusBadge status="FUNDING" /> : <StatusBadge status={opportunity.status} />}
      </div>

      <div className="mt-4 space-y-2.5 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="text-muted">Target</span>
          <span className="font-semibold">{formatKobo(opportunity.targetAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Committed</span>
          <span className="font-semibold">{formatKobo(opportunity.committedAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Remaining</span>
          <span className="font-semibold">{formatKobo(opportunity.remainingAmount)}</span>
        </div>
        {opportunity.unitPrice && (
          <div className="flex items-center justify-between">
            <span className="text-muted">Price per unit</span>
            <span className="font-semibold">{formatKobo(opportunity.unitPrice)}</span>
          </div>
        )}
      </div>

      {open ? (
        <>
          <div className="mt-5">
            <label htmlFor="contribution" className="field-label">
              Your contribution
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted">₦</span>
              <input
                id="contribution"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
                className="input input-lg pl-8 font-semibold"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(String(value / 100))}
                  className="chip hover:border-brand/40 hover:text-brand"
                >
                  {formatKobo(value)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-cream/70 px-3.5 py-3">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-muted">You receive</span>
              <span className="font-semibold text-ink">
                {units.toLocaleString()} units
                {opportunity.unitsPerPackage ? ` · ${packages.toLocaleString()} ${opportunity.packageLabel ?? "packages"}` : ""}
              </span>
            </div>
            {ownershipPercent && (
              <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
                <span className="text-muted">Ownership share</span>
                <span className="font-semibold text-brand">{ownershipPercent}%</span>
              </div>
            )}
            <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
              <span className="text-muted">You pay today</span>
              <span className="font-semibold text-ink">{formatKobo(effectiveAmount)}</span>
            </div>
          </div>

          {error && <div className="notice-danger mt-3 text-[12px]">{error}</div>}

          <button
            type="button"
            disabled={busy || effectiveAmount < opportunity.minContribution || effectiveAmount > opportunity.remainingAmount}
            onClick={async () => {
              setError(null);

              if (!isAuthenticated) {
                router.push(`/login?next=${encodeURIComponent(`/opportunities/${opportunity.slug}`)}`);
                return;
              }

              setBusy(true);
              try {
                const response = await apiPost<{
                  data: { authorizationUrl: string | null };
                }>("participations", {
                  opportunityId: opportunity.id,
                  amountKobo: effectiveAmount,
                  idempotencyKey: idempotencyKey("participation"),
                });

                const url = response.data.authorizationUrl;
                router.push(url ?? "/participations");
              } catch (exception) {
                setError(exception instanceof ClientApiError ? exception.message : "Could not start your contribution.");
                setBusy(false);
              }
            }}
            className="btn-primary btn-lg mt-4 w-full"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Reserving your spot…
              </>
            ) : isAuthenticated ? (
              <>
                Join this opportunity <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Sign in to join <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="mt-2 text-center text-[10.5px] leading-relaxed text-muted">
            You will confirm payment on the next screen. Capacity is only reserved after the
            payment is verified.
          </p>
        </>
      ) : (
        <div className="mt-5 rounded-xl bg-cream px-4 py-4">
          <p className="text-[13px] font-semibold text-ink">
            {opportunity.status === "FUNDED" || opportunity.status === "ACQUIRED"
              ? "This opportunity is fully funded."
              : opportunity.status === "COMPLETED"
                ? "This opportunity is complete."
                : "Funding is not open right now."}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Follow it to see acquisition and distribution updates.
          </p>
          <Link href="/discover" className="btn-secondary btn-sm mt-3 w-full">
            Explore other opportunities
          </Link>
        </div>
      )}

      <div className="mt-5 space-y-2 border-t border-line pt-4">
        {[
          { icon: Lock, text: "Contributions held in a safeguarded account" },
          { icon: ShieldCheck, text: "Full refund if funding does not complete" },
          { icon: CheckCircle2, text: `${opportunity.feeBps / 100}% platform fee, only on funded deals` },
        ].map(({ icon: Icon, text }) => (
          <p key={text} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> {text}
          </p>
        ))}
      </div>
    </div>
  );
}
