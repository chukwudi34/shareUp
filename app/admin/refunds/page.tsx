import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { Refund } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { StatusBadge } from "@/components/ui";
import { AdminActionButton } from "@/components/admin/admin-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Refunds · Control centre" };

export default async function AdminRefundsPage() {
  await requirePermission("refund.review");
  const { data } = await apiFetch<{ data: Refund[] }>("admin/refunds");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-bold">Refunds</h2>
        <p className="mt-1 text-[12px] text-muted">
          Approve only eligible requests. Payout is recorded against the participant&apos;s ledger
          after a second authorised user signs off.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="card-pad card text-center text-[12px] text-muted">No refunds requested.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base min-w-[820px]">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((refund) => (
                  <tr key={refund.id}>
                    <td>
                      <p className="text-[12.5px] font-semibold">{refund.userName ?? "Participant"}</p>
                      <p className="text-[10.5px] text-muted">{refund.opportunityTitle ?? "—"}</p>
                      <p className="text-[10px] text-muted">{refund.reference}</p>
                    </td>
                    <td className="max-w-[240px]">
                      <p className="text-[11.5px]">{refund.reasonLabel}</p>
                      {refund.detail && (
                        <p className="mt-0.5 text-[10.5px] leading-snug text-muted">{refund.detail}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted">
                        Requested {formatDateTime(refund.createdAt)}
                      </p>
                    </td>
                    <td className="font-semibold">{formatKobo(refund.amount)}</td>
                    <td>
                      <StatusBadge status={refund.status} />
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {refund.status === "REQUESTED" && (
                          <AdminActionButton
                            label="Approve"
                            endpoint={`admin/refunds/${refund.id}/approve`}
                            tone="primary"
                            confirm={`Approve ${formatKobo(refund.amount)} for ${refund.userName}?`}
                          />
                        )}
                        {refund.status === "APPROVED" && (
                          <AdminActionButton
                            label="Pay refund"
                            endpoint={`admin/refunds/${refund.id}/pay`}
                            tone="primary"
                            confirm="Record this refund as paid to the participant?"
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
