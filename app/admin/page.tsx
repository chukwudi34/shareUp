import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Building2,
  Clock3,
  Landmark,
  ShieldCheck,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requireStaff } from "@/lib/session";
import type { AdminOverview } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { Progress, StatusBadge } from "@/components/ui";
import { AdminReviewForm } from "@/components/admin/admin-controls";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireStaff("/admin");
  const { data } = await apiFetch<{ data: AdminOverview }>("admin/overview");

  const stats = [
    {
      label: "Committed by participants",
      value: formatKobo(data.stats.committedAmount),
      icon: Landmark,
      note: `${data.stats.fundingCount} offers currently funding`,
    },
    {
      label: "Safeguarded funds",
      value: formatKobo(data.stats.safeguardedFunds),
      icon: ShieldCheck,
      note: "Held in the client-funds ledger account",
    },
    {
      label: "Platform revenue",
      value: formatKobo(data.stats.platformRevenue),
      icon: Banknote,
      note: "Only recognised on funded deals",
    },
    {
      label: "Participants",
      value: data.stats.participants.toLocaleString("en-NG"),
      icon: Users,
      note: `${data.stats.activeAssets} active assets`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, note }) => (
          <div key={label} className="card-pad card">
            <div className="flex items-start justify-between">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-lime-soft text-brand">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-[24px] font-extrabold tracking-[-0.03em]">{value}</p>
            <p className="mt-1 text-[10.5px] text-muted">{note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Pending approvals", value: data.stats.pendingApprovals, href: "/admin/approvals" },
          { label: "Refunds requested", value: data.stats.pendingRefunds, href: "/admin/refunds" },
          { label: "Awaiting review", value: data.pendingReviews.length, href: "/admin/opportunities" },
          { label: "Active assets", value: data.stats.activeAssets, href: "/admin/assets" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="card flex items-center justify-between px-4 py-3 transition hover:border-brand/40"
          >
            <span className="text-[11.5px] text-muted">{item.label}</span>
            <span className="text-[15px] font-bold">{item.value}</span>
          </Link>
        ))}
      </div>

      <section className="card-pad card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-bold">Awaiting review</h2>
            <p className="mt-1 text-[11.5px] text-muted">
              Approve, reject or return with notes. Nothing can accept money before approval.
            </p>
          </div>
          <Link href="/admin/opportunities" className="btn-secondary btn-sm">
            All opportunities
          </Link>
        </div>

        {data.pendingReviews.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-cream px-4 py-6 text-center text-[12px] text-muted">
            No submissions are waiting. New creator submissions will appear here.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.pendingReviews.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line px-4 py-3.5"
              >
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-bold">{item.title}</p>
                    <span className="badge badge-neutral">{item.category}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {item.creatorName ?? "ShareUp"} · {item.location} · target{" "}
                    {formatKobo(item.targetAmount)}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress percent={item.percentFunded} className="max-w-[220px]" />
                    <span className="text-[10.5px] text-muted">{item.percentFunded}%</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <Link
                    href={`/opportunities/${item.slug}`}
                    target="_blank"
                    className="btn-ghost btn-sm"
                  >
                    Preview <ArrowUpRight className="h-3 w-3" />
                  </Link>
                  <AdminReviewForm id={item.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card-pad card">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold">Approvals queue</h2>
            <Clock3 className="h-4 w-4 text-muted" />
          </div>
          {data.approvals.length === 0 ? (
            <p className="mt-4 text-[12px] text-muted">Nothing awaiting a second signature.</p>
          ) : (
            <div className="mt-3 divide-y divide-line">
              {data.approvals.map((approval) => (
                <div key={approval.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold">{approval.summary}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted">
                      {approval.type.replaceAll("_", " ")} ·{" "}
                      {approval.requesterName ?? "system"} · {formatDateTime(approval.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] font-semibold">
                    {approval.amount ? formatKobo(approval.amount) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card-pad card">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold">Recent audit trail</h2>
            <Link href="/admin/audit" className="text-[11px] font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 divide-y divide-line">
            {data.recentAudit.map((entry) => (
              <div key={entry.id} className="py-2.5">
                <p className="text-[12px] font-semibold">
                  {entry.action.replaceAll(".", " · ")}
                  <span className="ml-2 font-normal text-muted">{entry.actor ?? "System"}</span>
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  {entry.entity} #{entry.entityId} · {formatDateTime(entry.createdAt)}
                  {entry.reason ? ` · ${entry.reason}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card-pad card">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold">Recent opportunities</h2>
          <Building2 className="h-4 w-4 text-muted" />
        </div>
        <div className="mt-3 divide-y divide-line">
          {data.recentOpportunities.map((item) => (
            <Link
              key={item.id}
              href={`/opportunities/${item.slug}`}
              target="_blank"
              className="flex flex-wrap items-center gap-3 py-2.5 transition hover:text-brand"
            >
              <span className="min-w-[200px] flex-1">
                <span className="block truncate text-[12px] font-semibold">{item.title}</span>
                <span className="text-[10.5px] text-muted">
                  {item.creatorName ?? "ShareUp"} · {formatKobo(item.committedAmount)} of{" "}
                  {formatKobo(item.targetAmount)}
                </span>
              </span>
              <StatusBadge status={item.status} />
              <span className="text-[11px] text-muted">{item.percentFunded}%</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
