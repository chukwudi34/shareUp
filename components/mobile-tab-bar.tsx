"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Plus, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/** App-style bottom navigation shown on the phone layout of the home screen. */
export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/participations", label: "Participations", icon: Users },
    { href: "/create", label: "Create", icon: Plus, primary: true },
    { href: "/assets", label: "Assets", icon: Package },
    { href: signedIn ? "/wallet" : "/login", label: "Profile", icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {tabs.map(({ href, label, icon: Icon, primary }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          if (primary) {
            return (
              <Link
                key={label}
                href={href}
                aria-label="Create an opportunity"
                className="-mt-5 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_10px_20px_-10px_rgba(0,98,28,0.9)] transition hover:bg-brand-dark"
              >
                <Icon className="h-5 w-5" strokeWidth={2.4} />
              </Link>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex w-16 flex-col items-center gap-1 rounded-xl py-1 text-[#8b938d] transition",
                active && "text-brand"
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && label === "Home" && "fill-brand")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={cn("text-[9.5px]", active && "font-semibold")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
