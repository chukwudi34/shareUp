import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { Opportunity } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { Progress, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  AdminActionButton,
  AdminNoteAction,
  AdminReviewForm,
  RecordAcquisitionForm,
} from "@/components/admin/admin-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opportunities · Control centre" };

const tabs = [
  "All",
  "PENDING_REVIEW",
  "PUBLISHED",
  "FUNDING",
  "FUNDED",
  "ACQUIRING",
  "ACQUIRED",
  "DISTRIBUTING",
  "COMPLETED",
  "CANCELLED",
];

export default async function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("opportunity.review");
  const { status } = await searchParams;
  const active = status ?? "All";
  const query = active === "All" ? "" : `?status=${encodeURIComponent(active)}`;

  const { data } = await apiFetch<{ data: Opportunity[] }>(`admin/opportunities${query}`);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-bold">Opportunity management</h2>
        <p className="mt-1 text-[12px] text-muted">
          Review submissions, publish approved offers and move funded deals into acquisition.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={tab === "All" ? "/admin/opportunities" : `/admin/opportunities?status=${tab}`}
            className={cn("chip", active === tab && "chip-active")}
          >
            {tab === "All" ? "All" : tab.replaceAll("_", " ").toLowerCase()}
          </Link>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="card-pad card text-center text-[12px] text-muted">
          No opportunities in this state.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base min-w-[900px]">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Funding</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link
                        href={`/opportunities/${item.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 text-[12.5px] font-semibold hover:text-brand"
                      >
                        {item.title} <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        {item.creatorName ?? "ShareUp"} · {item.category} · {item.location}
                      </p>
                      <p className="text-[10px] text-muted">
                        Created {formatDateTime(item.createdAt)}
                      </p>
                    </td>
                    <td className="min-w-[170px]">
                      <p className="text-[12px] font-semibold">{formatKobo(item.committedAmount)}</p>
                      <p className="text-[10px] text-muted">of {formatKobo(item.targetAmount)}</p>
                      <Progress percent={item.percentFunded} className="mt-1.5" />
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                      {item.participantCount > 0 && (
                        <p className="mt-1 text-[10px] text-muted">
                          {item.participantCount} participants
                        </p>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap items-start gap-2">
                        {item.status === "PENDING_REVIEW" && <AdminReviewForm id={item.id} />}

                        {item.status === "PUBLISHED" && (
                          <>
                            <AdminActionButton
                              label="Open funding"
                              endpoint={`admin/opportunities/${item.id}/publish`}
                              tone="primary"
                              confirm="Open this opportunity for contributions?"
                            />
                            <AdminNoteAction
                              label="Cancel"
                              endpoint={`admin/opportunities/${item.id}/cancel`}
                              field="reason"
                              placeholder="Reason for cancelling"
                              tone="danger"
                            />
                          </>
                        )}

                        {["FUNDING"].includes(item.status) && (
                          <AdminNoteAction
                            label="Cancel"
                            endpoint={`admin/opportunities/${item.id}/cancel`}
                            field="reason"
                            placeholder="Reason for cancelling"
                            tone="danger"
                          />
                        )}

                        {["FUNDED", "PARTIALLY_FUNDED"].includes(item.status) && (
                          <>
                            <AdminActionButton
                              label="Start acquisition"
                              endpoint={`admin/opportunities/${item.id}/acquisition/start`}
                              tone="primary"
                              confirm="Move this funded deal into acquisition?"
                            />
                            <AdminNoteAction
                              label="Cancel"
                              endpoint={`admin/opportunities/${item.id}/cancel`}
                              field="reason"
                              placeholder="Reason for cancelling"
                              tone="danger"
                            />
                          </>
                        )}

                        {item.status === "ACQUIRING" && <RecordAcquisitionForm id={item.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
