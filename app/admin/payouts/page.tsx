import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { Opportunity, Payout } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { StatusBadge } from "@/components/ui";
import { AdminActionButton, CreatePayoutForm } from "@/components/admin/admin-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts · Control centre" };

export default async function AdminPayoutsPage() {
  await requirePermission("payout.request");

  const [payouts, opportunities] = await Promise.all([
    apiFetch<{ data: Payout[] }>("admin/payouts"),
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
        <h2 className="text-[20px] font-bold">Supplier payouts</h2>
        <p className="mt-1 text-[12px] text-muted">
          Supplier money moves only after acquisition conditions are met. The requester can never
          approve their own payout.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <CreatePayoutForm
          opportunities={eligible.map((item) => ({
            id: item.id,
            title: item.title,
            supplierName: item.supplierName,
          }))}
        />

        <div className="card-pad card">
          <h2 className="text-[16px] font-bold">Safeguards</h2>
          <ul className="mt-3 space-y-2 text-[11.5px] leading-relaxed text-muted">
            <li>Payouts cannot exceed the amount participants have committed.</li>
            <li>The request creates an approval that a different staff member must clear.</li>
            <li>Payment confirmation is recorded with a provider reference and timestamp.</li>
            <li>Participant funds stay in the safeguarded ledger account until release.</li>
          </ul>
        </div>
      </div>

      {payouts.data.length === 0 ? (
        <div className="card-pad card text-center text-[12px] text-muted">
          No supplier payouts requested.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base min-w-[760px]">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.data.map((payout) => (
                  <tr key={payout.id}>
                    <td>
                      <p className="text-[12.5px] font-semibold">
                        {payout.supplierName ?? "Supplier"}
                      </p>
                      <p className="text-[10.5px] text-muted">{payout.opportunityTitle ?? "—"}</p>
                      <p className="text-[10px] text-muted">
                        {payout.reference} · {formatDateTime(payout.createdAt)}
                      </p>
                      {payout.note && (
                        <p className="mt-0.5 text-[10px] text-muted">{payout.note}</p>
                      )}
                    </td>
                    <td className="font-semibold">{formatKobo(payout.amount)}</td>
                    <td>
                      <StatusBadge status={payout.status} />
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {payout.status === "AWAITING_APPROVAL" && (
                          <AdminActionButton
                            label="Approve"
                            endpoint={`admin/payouts/${payout.id}/approve`}
                            tone="primary"
                            confirm="Approve this supplier payout?"
                          />
                        )}
                        {payout.status === "APPROVED" && (
                          <AdminActionButton
                            label="Mark paid"
                            endpoint={`admin/payouts/${payout.id}/pay`}
                            tone="primary"
                            confirm="Record this payout as paid?"
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
