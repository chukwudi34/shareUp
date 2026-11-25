import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Clock3, Users } from "lucide-react";
import type { Opportunity } from "@/lib/types";
import { formatKobo, formatKoboCompact } from "@/lib/money";
import { Progress, StatusBadge } from "./ui";
import { cn } from "@/lib/utils";

export function OpportunityCard({
  opportunity,
  compact = false,
}: {
  opportunity: Opportunity;
  compact?: boolean;
}) {
  const daysLeft = opportunity.fundingDeadline
    ? Math.max(0, Math.ceil((new Date(opportunity.fundingDeadline).getTime() - Date.now()) / 86_400_000))
    : null;

  // Compact card as drawn in the landing-page design: image, funding badge,
  // title, target, one line of copy, progress and a full-width join button.
  if (compact) {
    return (
      <article className="group flex flex-col overflow-hidden rounded-[18px] border border-line bg-white transition duration-300 hover:border-brand/25 hover:shadow-[0_22px_45px_-34px_rgba(20,41,27,0.4)]">
        <Link
          href={`/opportunities/${opportunity.slug}`}
          className="relative block aspect-[2.05/1] overflow-hidden bg-cream"
        >
          <Image
            src={opportunity.coverImage}
            alt={opportunity.title}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute right-3 top-3 rounded-full bg-[#2f7d32] px-3 py-1 text-[10.5px] font-semibold text-white md:left-3 md:right-auto">
            Funding {opportunity.percentFunded}%
          </span>
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <Link href={`/opportunities/${opportunity.slug}`}>
            <h3 className="text-[17px] font-bold leading-snug transition group-hover:text-brand">
              {opportunity.title}
            </h3>
          </Link>
          <p className="mt-0.5 font-display text-[21px] font-extrabold tracking-tight text-brand">
            {formatKobo(opportunity.targetAmount)}
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">{opportunity.summary}</p>

          <div className="mt-auto pt-4">
            <Progress percent={opportunity.percentFunded} className="h-1.5" />

            <p className="mt-2.5 text-[11.5px] text-muted md:hidden">
              Min. {formatKobo(opportunity.minContribution)}
              <span className="px-1.5 text-line-strong">•</span>
              {opportunity.participantCount} people
            </p>

            <div className="mt-2.5 hidden items-end justify-between gap-3 md:flex">
              <div>
                <p className="text-[10px] leading-tight text-muted">Min. Contribution</p>
                <p className="text-[12.5px] font-bold leading-tight text-ink">
                  {formatKobo(opportunity.minContribution)}
                </p>
              </div>
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <Users className="h-3.5 w-3.5" /> {opportunity.participantCount} people
              </p>
            </div>

            <Link
              href={`/opportunities/${opportunity.slug}`}
              className="btn-primary mt-3.5 w-full py-2.5 text-[13px]"
            >
              <span className="md:hidden">Join Now</span>
              <span className="hidden md:inline-flex md:items-center md:gap-2">
                Join Opportunity <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-[0_24px_50px_-34px_rgba(20,41,27,0.45)]">
      <Link href={`/opportunities/${opportunity.slug}`} className="relative block overflow-hidden">
        <div className={cn("relative w-full overflow-hidden bg-cream", compact ? "aspect-[16/9]" : "aspect-[16/10]")}>
          <Image
            src={opportunity.coverImage}
            alt={opportunity.title}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-brand-dark/90 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur">
            {opportunity.percentFunded}% funded
          </span>
          {opportunity.supplierVerified && (
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold text-brand-dark backdrop-blur">
              <BadgeCheck className="h-3 w-3 text-brand" /> Verified
            </span>
          )}
        </div>
        {opportunity.status !== "FUNDING" && (
          <span className="absolute right-3.5 top-3.5">
            <StatusBadge status={opportunity.status} />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">{opportunity.category}</span>
          <span className="text-[11px] font-medium text-muted">{opportunity.location}</span>
        </div>

        <Link href={`/opportunities/${opportunity.slug}`} className="mt-1.5 flex items-start justify-between gap-2">
          <h3 className="text-[18px] font-bold leading-snug transition group-hover:text-brand">
            {opportunity.title}
          </h3>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted transition group-hover:text-brand" />
        </Link>

        <p className="mt-1 font-display text-[21px] font-extrabold tracking-tight">
          {formatKobo(opportunity.targetAmount)}
        </p>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{opportunity.summary}</p>

        <div className="mt-3.5">
          <Progress percent={opportunity.percentFunded} className="h-1.5" />
          <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-muted">
            <span className="font-semibold text-brand">{opportunity.percentFunded}% funded</span>
            <span>{formatKoboCompact(opportunity.committedAmount)} committed</span>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3 text-[11px]">
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted">Min. Contribution</p>
            <p className="mt-0.5 text-[12.5px] font-bold text-ink">{formatKobo(opportunity.minContribution)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted">Participants</p>
            <p className="mt-0.5 flex items-center justify-end gap-1 text-[12.5px] font-bold text-ink">
              <Users className="h-3 w-3 text-brand" /> {opportunity.participantCount} people
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10.5px] text-muted">
            <Clock3 className="h-3 w-3" /> {daysLeft === null ? "—" : `${daysLeft} days left`}
          </span>
          <Link
            href={`/opportunities/${opportunity.slug}`}
            className="btn-primary btn-sm flex-1 justify-center"
          >
            Join Opportunity <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function OpportunityMini({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5 transition hover:border-brand/25"
    >
      <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
        <Image src={opportunity.coverImage} alt="" fill sizes="56px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{opportunity.title}</p>
        <p className="text-[11px] text-muted">
          {formatKobo(opportunity.minContribution)} min · {opportunity.percentFunded}% funded
        </p>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
    </Link>
  );
}
