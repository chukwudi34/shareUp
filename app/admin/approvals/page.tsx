import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { Approval } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approvals · Control centre" };

export default async function AdminApprovalsPage() {
  await requirePermission("audit.view");
  const { data } = await apiFetch<{ data: Approval[] }>("admin/approvals");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-bold">Approvals queue</h2>
        <p className="mt-1 text-[12px] text-muted">
          Sensitive financial actions wait for a second authorised user. Clear them from the module
          that owns the request.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="card-pad card text-center text-[12px] text-muted">
          Nothing is waiting for a second signature.
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {data.map((approval) => (
            <div key={approval.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold">{approval.summary}</p>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  {approval.type.replaceAll("_", " ")} · requested by{" "}
                  {approval.requesterName ?? "system"} · {formatDateTime(approval.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-semibold">
                  {approval.amount ? formatKobo(approval.amount) : "—"}
                </span>
                <StatusBadge status={approval.status} />
                {approval.type === "SUPPLIER_PAYOUT" && (
                  <Link href="/admin/payouts" className="btn-secondary btn-sm">
                    Review
                  </Link>
                )}
                {approval.type === "REFUND" && (
                  <Link href="/admin/refunds" className="btn-secondary btn-sm">
                    Review
                  </Link>
                )}
                {approval.type === "DISTRIBUTION" && (
                  <Link href="/admin/distributions" className="btn-secondary btn-sm">
                    Review
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
