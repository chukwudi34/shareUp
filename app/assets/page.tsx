import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, Layers3, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/session";
import type { Asset, DashboardSummary, Participation } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { EmptyState, Progress, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "My assets" };

export default async function AssetsPage() {
  await requireUser("/assets");

  const [assetsResponse, participationsResponse, summaryResponse] = await Promise.all([
    apiFetch<{ data: Asset[] }>("assets"),
    apiFetch<{ data: Participation[] }>("participations"),
    apiFetch<{ data: DashboardSummary }>("dashboard/summary"),
  ]);

  const assets = assetsResponse.data;
  const summary = summaryResponse.data;
  const holdings = participationsResponse.data.filter(
    (item) => ["CONFIRMED", "REFUND_PENDING"].includes(item.status) && item.opportunity
  );

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1 className="mt-1.5 font-display text-[32px] font-extrabold tracking-[-0.04em] sm:text-[38px]">
            My assets
          </h1>
          <p className="mt-1.5 max-w-[520px] text-[13.5px] text-muted">
            Assets you own outright, plus holdings still in funding. Every unit maps to a real
            ownership record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl border border-line bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Portfolio value</p>
            <p className="font-display text-[20px] font-extrabold">{formatKobo(summary.portfolioValue)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Contributed</p>
            <p className="font-display text-[20px] font-extrabold">{formatKobo(summary.totalInvested)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Holdings</p>
            <p className="font-display text-[20px] font-extrabold">{summary.assetCount}</p>
          </div>
        </div>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">Acquired assets</h2>
          <span className="text-[11px] text-muted">{assets.length} registered</span>
        </div>

        {assets.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="No acquired assets yet"
            body="When a collective purchase you joined completes acquisition, the asset and your ownership record appear here."
            action={
              <Link href="/participations" className="btn-secondary btn-sm">
                View funding participations
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {assets.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-brand/25"
              >
                <div className="relative aspect-[16/8] w-full overflow-hidden bg-cream">
                  <Image src={asset.coverImage} alt={asset.name} fill sizes="420px" className="object-cover transition group-hover:scale-[1.03]" />
                  <span className="absolute left-3 top-3"><StatusBadge status={asset.status} /></span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="eyebrow">{asset.category}</p>
                      <h3 className="mt-1 text-[17px] font-bold group-hover:text-brand">{asset.name}</h3>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 text-muted" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] text-muted">{asset.description}</p>

                  {asset.ownership && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted">Your ownership</span>
                        <span className="font-semibold text-brand">{asset.ownership.sharePercent}%</span>
                      </div>
                      <Progress percent={asset.ownership.sharePercent} className="mt-1.5 h-1.5" />
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-muted">Units</p>
                          <p className="text-[12.5px] font-bold">{asset.ownership.units.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-muted">Cost basis</p>
                          <p className="text-[12.5px] font-bold">{formatKobo(asset.ownership.costBasis)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-muted">Valuation</p>
                          <p className="text-[12.5px] font-bold">{formatKobo(asset.currentValuation)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {holdings.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold">Holdings in progress</h2>
              <p className="text-[11.5px] text-muted">Ownership is registered when acquisition completes.</p>
            </div>
            <Link href="/participations" className="text-[11.5px] font-semibold text-brand">
              Manage →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {holdings.map((participation) => {
              const opportunity = participation.opportunity!;
              return (
                <Link
                  key={participation.id}
                  href={`/opportunities/${opportunity.slug}`}
                  className="card flex items-center gap-3 p-3.5 transition hover:border-brand/25"
                >
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
                    <Image src={opportunity.coverImage} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold">{opportunity.title}</p>
                      <StatusBadge status={participation.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {participation.units.toLocaleString()} units · {formatKobo(participation.amount)}
                    </p>
                    <Progress percent={opportunity.percentFunded} className="mt-2 h-1" />
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-lime-soft/50 px-4 py-3.5">
        <TrendingUp className="h-4 w-4 shrink-0 text-brand" />
        <p className="text-[11.5px] leading-relaxed text-muted">
          Valuation updates come from independent reports recorded by operations. Distributions are
          allocated pro-rata using your units and the largest-remainder method.
        </p>
      </div>
    </div>
  );
}
