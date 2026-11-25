import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass, Layers, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/session";
import type { DashboardSummary, Participation } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { EmptyState, Progress, StatusBadge } from "@/components/ui";
import { CancelParticipation } from "@/components/cancel-participation";

export const dynamic = "force-dynamic";
export const metadata = { title: "My participations" };

export default async function ParticipationsPage() {
  const user = await requireUser("/participations");

  const [response, summaryResponse] = await Promise.all([
    apiFetch<{ data: Participation[] }>("participations"),
    apiFetch<{ data: DashboardSummary }>("dashboard/summary"),
  ]);

  const participations = response.data;
  const summary = summaryResponse.data;
  const active = participations.filter((item) => ["CONFIRMED", "PENDING", "REFUND_PENDING"].includes(item.status));

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Your portfolio</p>
          <h1 className="mt-1.5 font-display text-[32px] font-extrabold tracking-[-0.04em] sm:text-[38px]">
            My participations
          </h1>
          <p className="mt-1.5 max-w-[520px] text-[13.5px] text-muted">
            Every contribution, the units it bought and where it sits in the lifecycle.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-2xl border border-line bg-cream/60 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Committed</p>
            <p className="font-display text-[20px] font-extrabold">{formatKobo(summary.totalInvested)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-cream/60 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Active</p>
            <p className="font-display text-[20px] font-extrabold">{active.length}</p>
          </div>
        </div>
      </div>

      {participations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Layers className="h-6 w-6" />}
            title="You haven't joined anything yet"
            body="Browse verified opportunities and commit your first share. You can start from ₦10,000."
            action={
              <Link href="/discover" className="btn-primary">
                Discover opportunities <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {participations.map((participation) => {
            const opportunity = participation.opportunity;
            const canCancel =
              opportunity &&
              ["CONFIRMED", "PENDING"].includes(participation.status) &&
              opportunity.allowCancellation;

            return (
              <article key={participation.id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href={opportunity ? `/opportunities/${opportunity.slug}` : "/discover"}
                    className="relative h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-20 sm:w-28"
                  >
                    {opportunity && (
                      <Image src={opportunity.coverImage} alt="" fill sizes="112px" className="object-cover" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={opportunity ? `/opportunities/${opportunity.slug}` : "/discover"}
                        className="text-[15px] font-bold text-ink hover:text-brand"
                      >
                        {opportunity?.title ?? "Opportunity"}
                      </Link>
                      <StatusBadge status={participation.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {participation.reference} · joined {formatDateTime(participation.createdAt)}
                    </p>

                    <div className="mt-2.5 grid grid-cols-2 gap-3 text-[11.5px] sm:grid-cols-4">
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted">Amount</p>
                        <p className="font-semibold text-ink">{formatKobo(participation.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted">Units</p>
                        <p className="font-semibold text-ink">{participation.units.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted">Ownership</p>
                        <p className="font-semibold text-ink">{participation.entitlementUnits.toLocaleString()} units</p>
                      </div>
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted">Refunded</p>
                        <p className="font-semibold text-ink">{formatKobo(participation.refundedAmount)}</p>
                      </div>
                    </div>

                    {opportunity && opportunity.status === "FUNDING" && (
                      <div className="mt-3 max-w-[420px]">
                        <Progress percent={opportunity.percentFunded} className="h-1.5" />
                        <p className="mt-1 text-[10px] text-muted">
                          {opportunity.percentFunded}% funded · {opportunity.participantCount} participants
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
                    {participation.status === "PENDING" && participation.checkoutUrl && (
                      <Link href={participation.checkoutUrl} className="btn-primary btn-sm">
                        Complete payment <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {canCancel && (
                      <CancelParticipation id={participation.id} title={opportunity?.title ?? "this opportunity"} />
                    )}
                    {participation.status === "REFUND_PENDING" && (
                      <Link href="/wallet" className="btn-secondary btn-sm">
                        <Wallet className="h-3.5 w-3.5" /> Refund status
                      </Link>
                    )}
                    {opportunity && (
                      <Link href={`/opportunities/${opportunity.slug}`} className="text-[11.5px] font-semibold text-brand hover:underline">
                        View opportunity →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-col items-start justify-between gap-3 rounded-[22px] border border-line bg-white px-5 py-4 sm:flex-row sm:items-center">
        <p className="text-[12.5px] text-muted">
          Payments are only claimed after server verification. Check the ledger trail in{" "}
          <Link href="/wallet" className="font-semibold text-brand hover:underline">
            your wallet
          </Link>
          .
        </p>
        <Link href="/discover" className="btn-secondary btn-sm whitespace-nowrap">
          <Compass className="h-3.5 w-3.5" /> Find more to own
        </Link>
      </div>
    </div>
  );
}
