import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { Asset, Distribution, Opportunity } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { StatusBadge } from "@/components/ui";
import { AdminActionButton, CreateDistributionForm } from "@/components/admin/admin-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Distributions · Control centre" };

export default async function AdminDistributionsPage() {
  await requirePermission("distribution.manage");

  const [distributions, assets, opportunities] = await Promise.all([
    apiFetch<{ data: Distribution[] }>("admin/distributions"),
    apiFetch<{ data: Asset[] }>("admin/assets"),
    apiFetch<{ data: Opportunity[] }>("admin/opportunities"),
  ]);

  const eligible = opportunities.data.filter((item) =>
    ["FUNDED", "PARTIALLY_FUNDED", "ACQUIRING", "ACQUIRED", "DISTRIBUTING", "COMPLETED"].includes(
      item.status
    )
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold">Distributions</h2>
        <p className="mt-1 text-[12px] text-muted">
          Physical goods and financial proceeds are distributed from recorded entitlements only.
          Expenses are deducted before net proceeds are shared.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <CreateDistributionForm
          assets={assets.data.map((asset) => ({ id: asset.id, name: asset.name }))}
          opportunities={eligible.map((item) => ({ id: item.id, title: item.title }))}
        />

        <div className="card-pad card">
          <h2 className="text-[16px] font-bold">How it runs</h2>
          <ol className="mt-3 space-y-2 text-[11.5px] leading-relaxed text-muted">
            <li>1. Create a draft and record the verified gross amount or inventory quantity.</li>
            <li>2. Approved expenses are deducted. Net proceeds are only shared after that.</li>
            <li>3. A different authorised user approves the statement.</li>
            <li>4. Execution posts participant entitlements to payouts or fulfilment orders.</li>
            <li>5. Every step is written to the ledger and audit trail.</li>
          </ol>
        </div>
      </div>

      {distributions.data.length === 0 ? (
        <div className="card-pad card text-center text-[12px] text-muted">
          No distributions yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base min-w-[780px]">
              <thead>
                <tr>
                  <th>Distribution</th>
                  <th>Net</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {distributions.data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="text-[12.5px] font-semibold">{item.title}</p>
                      <p className="text-[10.5px] text-muted">
                        {item.type === "FINANCIAL" ? "Financial" : "Physical"} ·{" "}
                        {item.assetName ?? item.opportunityTitle ?? "—"}
                      </p>
                      <p className="text-[10px] text-muted">
                        {item.reference} · {formatDateTime(item.createdAt)}
                      </p>
                    </td>
                    <td>
                      <p className="text-[12px] font-semibold">{formatKobo(item.netAmount)}</p>
                      <p className="text-[10px] text-muted">
                        gross {formatKobo(item.grossAmount)} · expenses{" "}
                        {formatKobo(item.expenseAmount)}
                      </p>
                      {item.itemCount !== null && (
                        <p className="text-[10px] text-muted">{item.itemCount} recipients</p>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {item.status === "DRAFT" && (
                          <AdminActionButton
                            label="Approve"
                            endpoint={`admin/distributions/${item.id}/approve`}
                            tone="primary"
                            confirm="Approve this distribution statement?"
                          />
                        )}
                        {item.status === "APPROVED" && (
                          <AdminActionButton
                            label="Execute"
                            endpoint={`admin/distributions/${item.id}/execute`}
                            tone="primary"
                            confirm="Execute this distribution now?"
                          />
                        )}
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
