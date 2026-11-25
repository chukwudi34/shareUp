import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Building2, MapPin, PieChart, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/session";
import type { Asset, Distribution } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { Definition, Progress, SectionHeading, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/assets/${id}`);

  const response = await apiFetch<{ data: { asset: Asset; distributions: Distribution[] } }>(`assets/${id}`);
  const { asset, distributions } = response.data;

  const gain = asset.ownership
    ? asset.currentValuation * (asset.ownership.sharePercent / 100) - asset.ownership.costBasis
    : 0;

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8">
      <Link href="/assets" className="mb-4 inline-flex items-center gap-1.5 text-[11.5px] text-muted hover:text-brand">
        <ArrowLeft className="h-3.5 w-3.5" /> My assets
      </Link>

      <div className="relative aspect-[16/6] min-h-[200px] overflow-hidden rounded-[24px] bg-cream">
        <Image src={asset.coverImage} alt={asset.name} fill priority sizes="1200px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f12]/70 via-transparent to-transparent" />
        <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="flex items-center gap-2">
              <StatusBadge status={asset.status} />
              <span className="badge bg-white/90 text-ink">{asset.category}</span>
            </span>
            <h1 className="mt-2 font-display text-[28px] font-extrabold text-white sm:text-[34px]">{asset.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/70">
              <MapPin className="h-3.5 w-3.5" /> {asset.location} · {asset.reference}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-right ring-1 ring-white/15 backdrop-blur">
            <p className="text-[10px] uppercase tracking-wide text-white/60">Current valuation</p>
            <p className="font-display text-[22px] font-extrabold text-white">{formatKobo(asset.currentValuation)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <section className="card card-pad">
            <SectionHeading eyebrow="The asset" title="What this is" className="mb-3" />
            <p className="text-[13.5px] leading-relaxed text-muted">{asset.description}</p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <Definition label="Acquired" value={formatDateTime(asset.acquisitionDate)} />
              <Definition label="Custodian" value={asset.custodian} />
              <Definition label="Legal structure" value={asset.legalStructure.replaceAll("_", " ").toLowerCase()} />
              <Definition label="Acquisition price" value={formatKobo(asset.acquisitionPrice)} />
              <Definition label="Total units" value={asset.totalUnits.toLocaleString()} />
              <Definition label="Owners" value={asset.ownerCount ? `${asset.ownerCount}` : "—"} />
            </div>
          </section>

          {asset.reports.length > 0 && (
            <section className="card card-pad">
              <SectionHeading eyebrow="Reporting" title="Asset updates" className="mb-3" />
              <div className="space-y-3">
                {asset.reports.map((report) => (
                  <article key={report.id} className="rounded-2xl border border-line px-4 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold">{report.title}</p>
                      <span className="badge badge-lime">{report.kind}</span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{report.body}</p>
                    <p className="mt-2 text-[10px] text-muted">Published {formatDateTime(report.publishedAt)}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="card card-pad">
            <SectionHeading eyebrow="Ledger" title="Distributions" className="mb-3" />
            {distributions.length === 0 ? (
              <p className="notice text-[12px]">No distributions have been declared for this asset yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {distributions.map((distribution) => (
                  <div key={distribution.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-[12.5px] font-semibold">{distribution.title}</p>
                      <p className="text-[10.5px] text-muted">
                        {distribution.type === "FINANCIAL"
                          ? `${formatKobo(distribution.netAmount)} net to owners`
                          : "Physical allocation"}
                        {distribution.executedAt ? ` · executed ${formatDateTime(distribution.executedAt)}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={distribution.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="card card-pad">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-brand" />
              <h2 className="text-[14px] font-bold">Your ownership</h2>
            </div>

            {asset.ownership ? (
              <>
                <p className="mt-4 font-display text-[30px] font-extrabold leading-none">
                  {asset.ownership.sharePercent}%
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {asset.ownership.units.toLocaleString()} of {asset.totalUnits.toLocaleString()} units
                </p>
                <Progress percent={asset.ownership.sharePercent} className="mt-2 h-1.5" />

                <div className="mt-4 space-y-2.5 border-t border-line pt-3 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Cost basis</span>
                    <span className="font-semibold">{formatKobo(asset.ownership.costBasis)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Current value</span>
                    <span className="font-semibold">
                      {formatKobo(asset.currentValuation * (asset.ownership.sharePercent / 100))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Unrealised gain</span>
                    <span className={`font-semibold ${gain >= 0 ? "text-brand" : "text-danger"}`}>
                      {gain >= 0 ? "+" : "−"}{formatKobo(Math.abs(gain))}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-[12px] text-muted">Staff view — no personal ownership record.</p>
            )}
          </div>

          {asset.incomes.length > 0 && (
            <div className="card card-pad">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand" />
                <h2 className="text-[14px] font-bold">Income recorded</h2>
              </div>
              <div className="mt-3 space-y-2">
                {asset.incomes.map((income) => (
                  <div key={income.id} className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">{income.source}</span>
                    <span className="font-semibold">{formatKobo(income.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-white px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
              <BadgeCheck className="h-3.5 w-3.5 text-brand" /> Verified valuation
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {asset.valuationSource ?? "Independent valuation"} · {formatDateTime(asset.valuationAt)}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-2xl bg-lime-soft/60 px-4 py-3">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <p className="text-[11px] leading-relaxed text-muted">
              Ownership is recorded against the asset, not just the opportunity. Your units stay
              yours through every distribution and valuation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
