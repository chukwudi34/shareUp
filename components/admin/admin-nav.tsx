"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  BookOpen,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  PieChart,
  RotateCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, permission: null },
  { href: "/admin/opportunities", label: "Opportunities", icon: ClipboardCheck, permission: "opportunity.review" },
  { href: "/admin/refunds", label: "Refunds", icon: RotateCcw, permission: "refund.review" },
  { href: "/admin/distributions", label: "Distributions", icon: PieChart, permission: "distribution.manage" },
  { href: "/admin/payouts", label: "Payouts", icon: Banknote, permission: "payout.request" },
  { href: "/admin/assets", label: "Assets", icon: Building2, permission: "asset.manage" },
  { href: "/admin/ledger", label: "Ledger", icon: BookOpen, permission: "ledger.view" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "user.manage" },
  { href: "/admin/audit", label: "Audit trail", icon: ShieldCheck, permission: "audit.view" },
];

export function AdminNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
      aria-label="Control centre"
    >
      {items
        .filter((item) => !item.permission || permissions.includes(item.permission))
        .map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition",
                active ? "bg-brand text-white" : "text-muted hover:bg-cream hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
