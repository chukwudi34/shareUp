import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { Asset } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { StatusBadge } from "@/components/ui";
import { RecordIncomeForm } from "@/components/admin/admin-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assets · Control centre" };

export default async function AdminAssetsPage() {
  await requirePermission("asset.manage");
  const { data } = await apiFetch<{ data: Asset[] }>("admin/assets");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-bold">Managed assets</h2>
        <p className="mt-1 text-[12px] text-muted">
          Record verified income against acquired assets. Income is visible to participants and
          feeds distribution calculations — never enter estimates as confirmed.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="card-pad card text-center text-[12px] text-muted">
          No assets have been acquired yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((asset) => (
            <div key={asset.id} className="card-pad card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-bold">{asset.name}</p>
                    <StatusBadge status={asset.status} />
                    <span className="badge badge-neutral">{asset.category}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {asset.reference} · {asset.location} · custodian {asset.custodian}
                  </p>
                  <p className="text-[10.5px] text-muted">
                    Acquired {formatDateTime(asset.acquisitionDate)} ·{" "}
                    {asset.ownerCount ?? 0} owners · {asset.legalStructure.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-bold">{formatKobo(asset.currentValuation)}</p>
                  <p className="text-[10px] text-muted">
                    cost {formatKobo(asset.acquisitionPrice)}
                  </p>
                  {asset.opportunityTitle && (
                    <Link
                      href={`/assets/${asset.id}`}
                      target="_blank"
                      className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-semibold text-brand hover:underline"
                    >
                      Asset record <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    Recorded income ({asset.incomes.length})
                  </p>
                  {asset.incomes.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted">No income recorded.</p>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {asset.incomes.slice(0, 4).map((income) => (
                        <p key={income.id} className="text-[10.5px] text-muted">
                          {income.source}: <span className="font-semibold">{formatKobo(income.amount)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <RecordIncomeForm assetId={asset.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
