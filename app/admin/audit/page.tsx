import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { AuditEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit trail · Control centre" };

export default async function AdminAuditPage() {
  await requirePermission("audit.view");
  const { data } = await apiFetch<{ data: AuditEntry[] }>("admin/audit");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-bold">Audit trail</h2>
        <p className="mt-1 text-[12px] text-muted">
          Permanent record of who did what, when and why. Entries cannot be edited or deleted.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base min-w-[720px]">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>Reason</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-medium">{entry.action.replaceAll(".", " · ")}</td>
                  <td className="text-[11px] text-muted">
                    {entry.entity} #{entry.entityId}
                  </td>
                  <td>{entry.actor ?? "System"}</td>
                  <td className="max-w-[260px] text-[11px] text-muted">{entry.reason ?? "—"}</td>
                  <td className="text-[11px] text-muted">{formatDateTime(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
