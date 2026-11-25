import { ShieldCheck } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Control centre" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff("/admin");

  return (
    <div className="px-4 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Operations
          </p>
          <h1 className="mt-1.5 font-display text-[30px] font-extrabold tracking-[-0.04em] sm:text-[36px]">
            Control centre
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {user.name} · {user.role} access. Every action is written to the audit trail.
          </p>
        </div>
        <span className="badge badge-lime">Maker-checker enforced on money movement</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[205px_1fr]">
        <aside>
          <AdminNav permissions={user.permissions} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
