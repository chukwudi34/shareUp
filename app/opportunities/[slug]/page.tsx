import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  Landmark,
  MapPin,
  PieChart,
  ShieldCheck,
  Users,
} from "lucide-react";
import { apiFetch, getSessionUser, ApiError } from "@/lib/api";
import type { Opportunity } from "@/lib/types";
import { JoinPanel } from "@/components/join-panel";
import { OpportunityCard } from "@/components/opportunity-card";
import { Definition, Progress, SectionHeading, StatusBadge } from "@/components/ui";
import { formatKobo, formatDateTime } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let opportunity: Opportunity;
  try {
    const response = await apiFetch<{ data: Opportunity }>(`opportunities/${slug}`);
    opportunity = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const user = await getSessionUser();
  const paragraphs = opportunity.description?.split(/\n{2,}/).filter(Boolean) ?? [];
  const open = opportunity.status === "FUNDING" && new Date(opportunity.fundingDeadline ?? 0).getTime() > Date.now();

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11.5px] text-muted">
          <Link href="/discover" className="inline-flex items-center gap-1 hover:text-brand">
            <ArrowLeft className="h-3.5 w-3.5" /> Discover
          </Link>
          <span>/</span>
          <span>{opportunity.category}</span>
          <span className="hidden sm:inline">/</span>
          <span className="hidden truncate text-ink sm:inline">{opportunity.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={opportunity.status} />
          {opportunity.supplierVerified && (
            <span className="chip text-brand">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified supplier
            </span>
          )}
        </div>
      </div>

      <div className="relative aspect-[16/7] min-h-[220px] w-full overflow-hidden rounded-[24px] bg-cream">
        <Image
          src={opportunity.coverImage}
          alt={opportunity.title}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f12]/65 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold text-white">
            Funding {opportunity.percentFunded}%
          </span>
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-ink backdrop-blur">
            {opportunity.model === "MANAGED_ASSET" ? "Managed asset" : "Collective purchase"}
          </span>
        </div>
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
              {opportunity.category}
            </p>
            <h1 className="mt-1 max-w-[720px] font-display text-[27px] font-extrabold leading-tight text-white sm:text-[36px]">
              {opportunity.title}
            </h1>
          </div>
          <div className="hidden items-center gap-4 text-[11px] text-white/85 sm:flex">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {opportunity.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {opportunity.participantCount} people
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {opportunity.fundingDeadline ? formatDateTime(opportunity.fundingDeadline) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_352px]">
        <div className="min-w-0 space-y-5">
          <section className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-[560px]">
                <p className="eyebrow">The opportunity</p>
                <h2 className="mt-1 text-[22px] font-bold">{opportunity.summary}</h2>
              </div>
              <div className="rounded-2xl bg-cream px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Target</p>
                <p className="font-display text-[20px] font-extrabold">{formatKobo(opportunity.targetAmount)}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-muted">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[11.5px]">
                <span className="font-semibold text-ink">{formatKobo(opportunity.committedAmount)} committed</span>
                <span className="text-muted">{opportunity.percentFunded}% of target</span>
              </div>
              <Progress percent={opportunity.percentFunded} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                <span>{opportunity.participantCount} participants</span>
                <span>
                  {open
                    ? `Closes ${formatDateTime(opportunity.fundingDeadline)}`
                    : `Status: ${opportunity.status.replaceAll("_", " ").toLowerCase()}`}
                </span>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <SectionHeading eyebrow="Your entitlement" title="What you actually own" className="mb-4" />
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Definition label="Ownership type" value={(opportunity.ownershipType ?? "Co-ownership").replaceAll("_", " ").toLowerCase()} />
              <Definition label="Legal structure" value={(opportunity.legalStructure ?? "Contractual").replaceAll("_", " ").toLowerCase()} />
              <Definition
                label="Unit price"
                value={opportunity.unitPrice ? formatKobo(opportunity.unitPrice) : "Amount-based"}
              />
              <Definition
                label="Total units"
                value={opportunity.totalUnits ? opportunity.totalUnits.toLocaleString() : "—"}
              />
              <Definition
                label="Physical yield"
                value={
                  opportunity.targetQuantity && opportunity.quantityLabel
                    ? `${opportunity.targetQuantity.toLocaleString()} ${opportunity.quantityLabel}`
                    : "Managed asset share"
                }
              />
              <Definition label="Policy version" value={`v${opportunity.policyVersion ?? 1}`} />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-lime-soft/70 px-4 py-3.5">
              <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-[12px] leading-relaxed text-brand-dark">
                Ownership and entitlement are separate. Your units determine your pro-rata share of
                income and proceeds; physical goods are allocated using largest-remainder rounding so
                nothing is lost.
              </p>
            </div>
          </section>

          <section className="card card-pad">
            <SectionHeading eyebrow="Risk & conditions" title="Know before you join" className="mb-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#f0dfc0] bg-warn-bg px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-warn">
                  <AlertTriangle className="h-3.5 w-3.5" /> Key risks
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#7b4a12]">{opportunity.riskNotes}</p>
              </div>
              <div className="rounded-2xl border border-line bg-cream px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Acquisition conditions
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{opportunity.acquisitionConditions}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              <Definition
                label="If target is missed"
                value={opportunity.allowsPartialFunding ? "Partial funding may proceed" : "Full refunds"}
              />
              <Definition label="Cancellation" value={opportunity.allowCancellation ? "Allowed before acquisition" : "Locked at payment"} />
              <Definition label="Funds held" value="Safeguarded account" />
            </div>
          </section>

          <section className="card card-pad">
            <SectionHeading eyebrow="Due diligence" title="Supplier & documents" className="mb-4" />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-soft text-brand">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{opportunity.supplierName}</p>
                  <p className="text-[11px] text-muted">
                    {opportunity.supplierVerified ? "Identity and delivery record verified" : "Verification in progress"}
                  </p>
                </div>
              </div>
              <span className={opportunity.supplierVerified ? "badge badge-green" : "badge badge-warn"}>
                {opportunity.supplierVerified ? "Verified" : "Pending"}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {(opportunity.documents ?? []).map((document) => (
                <div key={document.id} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
                  <FileCheck2 className="h-4 w-4 shrink-0 text-brand" />
                  <span className="flex-1 text-[12.5px] font-medium text-ink">{document.title}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {document.kind.replaceAll("_", " ")}
                  </span>
                  {document.verified && <BadgeCheck className="h-4 w-4 text-brand" />}
                </div>
              ))}
              {(opportunity.documents ?? []).length === 0 && (
                <p className="notice text-[12px]">
                  Documents are uploaded and verified during compliance review. Nothing here is
                  presented as evidence until it is checked.
                </p>
              )}
            </div>

            {(opportunity.evidence ?? []).length > 0 && (
              <div className="mt-4">
                <p className="eyebrow mb-2">Acquisition evidence</p>
                {opportunity.evidence?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-line/70 py-2.5 text-[12px] last:border-0">
                    <div>
                      <p className="font-medium text-ink">{item.title}</p>
                      <p className="text-[10.5px] text-muted">{item.vendor} · {item.reference}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-muted">
                      {formatKobo(item.amount)}
                      {item.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand" />}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-[11.5px] text-muted">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Payments are verified server-side before capacity is claimed. If capacity fills first,
            your money is queued for a full refund — never silently kept.
          </div>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <JoinPanel
            opportunity={opportunity}
            viewerParticipation={opportunity.viewerParticipation ?? null}
            isAuthenticated={Boolean(user)}
          />
        </aside>
      </div>

      {(opportunity.related ?? []).length > 0 && (
        <section className="mt-10">
          <SectionHeading
            eyebrow="Keep exploring"
            title="Similar opportunities"
            action={
              <Link href="/discover" className="text-[12px] font-semibold text-brand">
                See all →
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {opportunity.related?.slice(0, 3).map((item) => (
              <OpportunityCard key={item.id} opportunity={item} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
