import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  PieChart,
  Plus,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { apiFetch, getSessionUser } from "@/lib/api";
import type { DashboardSummary, Opportunity } from "@/lib/types";
import { OpportunityCard } from "@/components/opportunity-card";
import { Sparkline } from "@/components/ui";
import { formatKobo } from "@/lib/money";

export const dynamic = "force-dynamic";

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

const trustItems = [
  { icon: Users, title: "Collective Buying", body: "Get better value together" },
  { icon: PieChart, title: "Shared Ownership", body: "Own a part, not all" },
  { icon: ShieldCheck, title: "Trusted & Secure", body: "Your contributions are safe" },
  { icon: TrendingUp, title: "Real Benefits", body: "Get value. Grow together." },
];

const quickActions = [
  { href: "/create", label: "Create Opportunity", icon: Plus, tint: "bg-brand" },
  { href: "/wallet", label: "Fund Wallet", icon: Wallet, tint: "bg-brand-dark" },
  { href: "/participations", label: "View My Participations", icon: Star, tint: "bg-[#7fa74b]" },
];

export default async function HomePage() {
  const user = await getSessionUser();

  const [opportunityResponse, summaryResponse] = await Promise.all([
    safe(apiFetch<{ data: Opportunity[] }>("opportunities?sort=popular"), { data: [] as Opportunity[] }),
    user
      ? safe(apiFetch<{ data: DashboardSummary }>("dashboard/summary"), null as { data: DashboardSummary } | null)
      : Promise.resolve(null),
  ]);

  const opportunities = opportunityResponse.data;
  const featured = opportunities.slice(0, 2);
  const trending =
    opportunities.find((item) => item.slug === "residential-property") ??
    opportunities[2] ??
    opportunities[0];
  const mobileCards = [trending, ...featured]
    .filter((item): item is Opportunity => Boolean(item))
    .filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index)
    .slice(0, 2);
  const summary = summaryResponse?.data;

  return (
    <div>
      {/* ------------------------------------------------------------ desktop hero */}
      <section className="relative hidden overflow-hidden bg-field md:block">
        <div className="absolute inset-y-0 right-0 w-[68%]">
          <Image
            src="/images/hero-community.webp"
            alt="ShareUp members exploring opportunities together"
            fill
            priority
            sizes="(max-width: 1280px) 68vw, 900px"
            className="object-cover object-[center_32%]"
          />
          <div className="absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-field via-field/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[640px] px-8 pb-16 pt-11 lg:pb-20 lg:pt-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e9f8e1] px-3.5 py-1.5 text-[12px] font-semibold text-[#203920]">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#49a939] text-white">
              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
            </span>
            Buy · Invest · Own Together
          </span>

          <h1 className="mt-5 font-display text-[56px] font-extrabold leading-[0.92] tracking-[-0.05em] text-ink lg:text-[68px]">
            Own more.
            <br />
            <span className="text-grass">Together.</span>
          </h1>

          <p className="mt-5 max-w-[352px] text-[15px] leading-relaxed text-[#3c4a40]">
            A marketplace where people come together to collectively buy products and assets.
          </p>

          <Link href="/discover" className="btn-primary btn-lg group mt-7">
            Explore Opportunities
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------- desktop trust bar */}
      <div className="relative z-20 hidden px-8 md:block">
        <div className="-mt-8 grid grid-cols-4 divide-x divide-line rounded-[20px] border border-line/80 bg-white px-2 py-5 shadow-[0_18px_40px_-32px_rgba(20,41,27,0.45)]">
          {trustItems.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col items-center px-3 text-center">
              <Icon className="h-7 w-7 text-brand" strokeWidth={1.7} />
              <p className="mt-2 text-[12.5px] font-bold leading-tight text-ink">{title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------ mobile hero */}
      <section className="px-3.5 pt-3 md:hidden">
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-b from-[#0d7a20] via-[#0a6319] to-[#07460f] px-5 pb-5 pt-6 text-white">
          <div className="relative z-10 max-w-[61%]">
            <h1 className="font-display text-[33px] font-extrabold leading-[0.95] tracking-[-0.045em] text-white">
              Own more.
              <br />
              <span className="text-[#c8f21b]">Together.</span>
            </h1>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-white/85">
              Join people to buy, invest
              <br className="hidden min-[380px]:block" /> and own valuable assets.
            </p>
            <Link
              href="/discover"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[11.5px] font-bold text-brand-dark"
            >
              Explore Opportunities <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="pointer-events-none absolute -right-10 top-5 h-[78%] w-[52%] overflow-hidden rounded-full">
            <Image
              src="/images/mobile-people.webp"
              alt=""
              fill
              sizes="220px"
              className="object-cover object-[45%_28%]"
            />
          </div>

          <span className="pointer-events-none absolute right-[42%] top-5 h-6 w-1 rotate-[24deg] rounded-full bg-[#c8f21b]" />
          <span className="pointer-events-none absolute right-[36%] top-6 h-5 w-1 rotate-[58deg] rounded-full bg-[#c8f21b]" />
          <span className="pointer-events-none absolute right-[47%] top-7 h-4 w-1 rotate-[92deg] rounded-full bg-[#c8f21b]" />
        </div>
      </section>

      {/* ------------------------------------------------------ opportunities + aside */}
      <section className="px-3.5 pt-7 md:px-8 md:pt-9">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_298px] lg:gap-7">
          <div>
            <div className="mb-4 flex items-center justify-between gap-4 md:mb-5">
              <h2 className="text-[24px] font-bold tracking-[-0.03em] md:text-[27px]">
                <span className="md:hidden">Trending Opportunities</span>
                <span className="hidden md:inline">Popular Opportunities</span>
              </h2>
              <Link
                href="/discover"
                className="flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:text-brand-dark"
              >
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {featured.length > 0 ? (
              <>
                <div className="grid gap-4 md:hidden">
                  {mobileCards.map((opportunity) => (
                    <OpportunityCard key={opportunity.id} opportunity={opportunity} compact />
                  ))}
                </div>
                <div className="hidden gap-5 md:grid md:grid-cols-2">
                  {featured.map((opportunity) => (
                    <OpportunityCard key={opportunity.id} opportunity={opportunity} compact />
                  ))}
                </div>
              </>
            ) : (
              <div className="card card-pad">
                <p className="font-semibold">Opportunities are loading…</p>
                <p className="mt-1 text-sm text-muted">
                  Start the Laravel API with{" "}
                  <code className="rounded bg-cream px-1.5 py-0.5">npm run dev:api</code>, then refresh.
                </p>
              </div>
            )}
          </div>

          <aside className="hidden lg:block">
            <h2 className="text-[17px] font-bold">Your Summary</h2>

            <div className="mt-3 rounded-[18px] bg-mint px-5 py-5">
              <p className="text-[11.5px] font-medium text-muted">Total Contributions</p>
              <p className="mt-1 font-display text-[27px] font-extrabold leading-none text-ink">
                {formatKobo(summary?.totalInvested ?? 0)}
              </p>

              {user ? (
                <div className="mt-2.5 flex items-end justify-between gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10.5px] font-bold text-brand">
                    <TrendingUp className="h-3 w-3" />
                    {summary?.growthPercent ?? 0}%
                  </span>
                  <Sparkline
                    values={summary?.trend?.length ? summary.trend : [0, 0]}
                    className="h-10 w-[118px]"
                  />
                </div>
              ) : (
                <>
                  <p className="mt-1.5 max-w-[196px] text-[12px] leading-relaxed text-muted">
                    Sign in to track contributions, assets and growth.
                  </p>
                  <Link
                    href="/login"
                    className="mt-3 inline-flex items-center rounded-full bg-brand px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-brand-dark"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[18px] border border-line bg-white px-4 py-3.5">
              <div>
                <p className="text-[11.5px] leading-tight text-muted">Your Assets</p>
                <p className="mt-0.5 font-display text-[20px] font-bold leading-tight text-ink">
                  {summary?.assetCount ?? 0}
                </p>
              </div>
              <Link
                href="/assets"
                aria-label="View your assets"
                className="grid h-8 w-8 place-items-center rounded-full bg-cream text-ink transition hover:text-brand"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <h3 className="mt-5 text-[14px] font-bold">Quick Actions</h3>
            <div className="mt-2 rounded-[18px] border border-line bg-white p-2">
              <div className="space-y-1">
                {quickActions.map(({ href, label, icon: Icon, tint }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex items-center gap-3 rounded-xl bg-[#f7f8f5] px-3 py-2.5 transition hover:bg-cream"
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${tint} text-white`}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                    <span className="flex-1 text-[12.5px] font-medium text-ink">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

    </div>
  );
}
