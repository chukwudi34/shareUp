import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Opportunity } from "@/lib/types";
import { OpportunityCard } from "@/components/opportunity-card";
import { DiscoverControls } from "@/components/discover-controls";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Discover opportunities" };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "popular";
  const model = typeof params.model === "string" ? params.model : undefined;

  const query = new URLSearchParams({ sort });
  if (category) query.set("category", category);
  if (q) query.set("q", q);
  if (model) query.set("model", model);

  let opportunities: Opportunity[] = [];
  let failed = false;

  try {
    const response = await apiFetch<{ data: Opportunity[] }>(`opportunities?${query.toString()}`);
    opportunities = response.data;
  } catch {
    failed = true;
  }

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 border-b border-line pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-soft px-3 py-1 text-[11px] font-bold text-brand">
            <Compass className="h-3 w-3" /> Marketplace
          </span>
          <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[42px]">
            Find your next shared asset.
          </h1>
          <p className="mt-2 max-w-[540px] text-[14px] leading-relaxed text-muted">
            Verified collective purchases and managed assets. Every offer shows the exact price,
            the minimum stake and what you actually own.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-cream/60 px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Live now</p>
            <p className="text-[13px] font-semibold text-ink">
              {opportunities.length} opportunit{opportunities.length === 1 ? "y" : "ies"} to join
            </p>
          </div>
          <Link href="/create" className="btn-dark btn-sm ml-2 hidden sm:inline-flex">
            Create <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="py-6">
        <DiscoverControls total={opportunities.length} />
      </div>

      {failed ? (
        <EmptyState
          title="The marketplace API is offline"
          body="Start the Laravel API with `npm run dev:api`, then refresh this page."
          icon={<Compass className="h-6 w-6" />}
        />
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No opportunities match that search"
          body="Try a different category, or clear your search to see everything that is live."
          icon={<Compass className="h-6 w-6" />}
          action={
            <Link href="/discover" className="btn-secondary btn-sm">
              Clear filters
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[22px] bg-brand-dark px-6 py-6 text-white sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[20px] font-bold text-white">Can&apos;t find what you want to own?</h2>
          <p className="mt-1 max-w-[560px] text-[13px] text-white/70">
            Start a collective purchase yourself. Add the supplier, set the target and invite others to join.
          </p>
        </div>
        <Link href="/create" className="btn-lime btn-sm whitespace-nowrap">
          Create an opportunity <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
