import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { User } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { Avatar, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users · Control centre" };

export default async function AdminUsersPage() {
  await requirePermission("user.manage");
  const { data } = await apiFetch<{ data: User[] }>("admin/users");

  const staff = data.filter((user) => user.isStaff).length;
  const unverified = data.filter((user) => user.kycStatus !== "VERIFIED").length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-bold">Users and verification</h2>
        <p className="mt-1 text-[12px] text-muted">
          {data.length} accounts · {staff} staff · {unverified} awaiting identity verification.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base min-w-[760px]">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>KYC</th>
                <th>Participations</th>
                <th className="text-right">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.name} />
                      <div>
                        <p className="text-[12.5px] font-semibold">{user.name}</p>
                        <p className="text-[10.5px] text-muted">{user.email}</p>
                        <p className="text-[10px] text-muted">
                          Joined {formatDateTime(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={user.isStaff ? "badge badge-lime" : "badge badge-neutral"}>
                      {user.role}
                    </span>
                    <p className="mt-1">
                      <StatusBadge status={user.status} />
                    </p>
                  </td>
                  <td>
                    <span
                      className={
                        user.kycStatus === "VERIFIED" ? "badge badge-green" : "badge badge-warn"
                      }
                    >
                      {user.kycStatus.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>{user.participationCount ?? 0}</td>
                  <td className="text-right font-semibold">{formatKobo(user.walletBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
