import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, FileText, ShieldCheck } from "lucide-react";
import { apiFetch, getSessionUser } from "@/lib/api";
import { draftFromOpportunity } from "@/lib/opportunity-draft";
import type { Opportunity } from "@/lib/types";
import { formatDateTime } from "@/lib/money";
import { StatusBadge } from "@/components/ui";
import { CreateOpportunityWizard } from "@/components/create-opportunity-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create an opportunity" };

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/create");
  }

  const { draft } = await searchParams;
  const response = await apiFetch<{ data: Opportunity[] }>("opportunities/mine");
  const submissions = response.data;

  const selected = draft
    ? submissions.find(
        (item) =>
          String(item.id) === draft && ["DRAFT", "REJECTED"].includes(item.status)
      ) ?? null
    : null;

  const editable = submissions.filter((item) => ["DRAFT", "REJECTED"].includes(item.status));
  const live = submissions.filter((item) => !["DRAFT", "REJECTED"].includes(item.status));

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Opportunity engine</p>
          <h1 className="mt-1.5 font-display text-[32px] font-extrabold tracking-[-0.04em] sm:text-[38px]">
            Create an opportunity
          </h1>
          <p className="mt-1.5 max-w-[620px] text-[13.5px] leading-relaxed text-muted">
            Propose a collective purchase or a managed asset. ShareUp reviews the supplier, the
            numbers and the legal structure before any contribution is collected.
          </p>
        </div>
        <span className="badge badge-lime">
          <ShieldCheck className="h-3.5 w-3.5" /> Every offer is reviewed
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <CreateOpportunityWizard
            initial={selected ? draftFromOpportunity(selected) : undefined}
            draftId={selected?.id}
            initialDocuments={selected?.documents}
          />
          <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
            Money never moves on a draft. Contributions only open after ShareUp approves the offer
            and publishes its funding terms.
          </p>
        </div>

        <aside className="space-y-4">
          <div className="card-pad card">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold">My submissions</h2>
              <span className="text-[11px] text-muted">{submissions.length} total</span>
            </div>

            {submissions.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-line px-4 py-8 text-center">
                <FileText className="mx-auto h-5 w-5 text-muted" />
                <p className="mt-2 text-[12px] font-semibold">Nothing submitted yet</p>
                <p className="mt-1 text-[11px] text-muted">
                  Start with the steps on the left. You can save a draft at any point.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {editable.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      Drafts
                    </p>
                    {editable.map((item) => (
                      <div key={item.id} className="rounded-xl border border-line px-3.5 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12.5px] font-semibold">{item.title}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-1 text-[10.5px] text-muted">
                          {item.status === "REJECTED"
                            ? "Returned with reviewer notes"
                            : `Saved ${formatDateTime(item.createdAt)}`}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Link
                            href={`/create?draft=${item.id}`}
                            className="btn-secondary btn-sm"
                            prefetch={false}
                          >
                            Continue draft
                          </Link>
                          <Link
                            href={`/opportunities/${item.slug}`}
                            className="btn-ghost btn-sm"
                            target="_blank"
                          >
                            Preview
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {live.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      In review & published
                    </p>
                    {live.map((item) => (
                      <Link
                        key={item.id}
                        href={`/opportunities/${item.slug}`}
                        className="flex items-center justify-between gap-2 rounded-xl px-3.5 py-3 transition hover:bg-cream"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[12.5px] font-semibold">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-[10.5px] text-muted">
                            {item.percentFunded}% funded · {item.participantCount} participants
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={item.status} />
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-cream px-4 py-4">
            <p className="text-[12px] font-semibold">What reviewers check</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-muted">
              <li>Supplier identity and a valid quote.</li>
              <li>Target amount against real market pricing.</li>
              <li>Legal and regulatory clearance for managed assets.</li>
              <li>Clear risk information and acquisition conditions.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
