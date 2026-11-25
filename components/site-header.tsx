"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/discover", label: "Discover" },
  { href: "/participations", label: "My Participations" },
  { href: "/assets", label: "Assets" },
  { href: "/create", label: "Create" },
];

export function SiteHeader({ user, unread }: { user: User | null; unread: number }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    (href === "/discover" && pathname === "/") || pathname === href || pathname.startsWith(`${href}/`);
  // The mobile home screen is app-style: the tab bar handles navigation, so the
  // hamburger only appears on the inner pages.
  const isHome = pathname === "/";

  async function signOut() {
    await fetch("/api/session/logout", { method: "POST" });
    setAccountOpen(false);
    setMenuOpen(false);
    // Hard navigation so the server renders the signed-out layout immediately.
    window.location.assign("/");
  }

  return (
    <header className="relative z-40 border-b border-line/80 bg-white">
      <div className="flex items-center gap-2 px-4 py-3 sm:px-6 lg:gap-3 lg:px-8 lg:py-5">
        <Logo />

        <nav className="ml-3 hidden items-center gap-1 lg:flex xl:ml-6 xl:gap-2">
          {primaryNav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-full px-3 py-2 text-[13px] font-semibold text-ink transition hover:text-brand xl:px-4",
                isActive(href) && "bg-brand text-white hover:text-white"
              )}
            >
              {label}
            </Link>
          ))}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className="flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-semibold text-ink transition hover:text-brand"
              aria-expanded={moreOpen}
            >
              More
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-11 w-52 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                <Link
                  href="/wallet"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-cream"
                >
                  <Wallet className="h-4 w-4 text-muted" /> Wallet
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-cream"
                >
                  <Bell className="h-4 w-4 text-muted" /> Notifications
                </Link>
                {user?.isStaff && (
                  <Link
                    href="/admin"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-cream"
                  >
                    <ShieldCheck className="h-4 w-4 text-muted" /> Control centre
                  </Link>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/discover"
            className="hidden h-10 w-[190px] items-center gap-2 rounded-full bg-[#f5f6f8] px-4 text-[12px] text-[#858b95] transition hover:bg-[#eef0f3] xl:flex xl:w-[235px]"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Search opportunities...</span>
          </Link>

          <Link
            href="/notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-[#f5f6f8] text-ink transition hover:bg-[#eef0f3]"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e04848] ring-2 ring-white" />
            )}
          </Link>

          {user ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full text-left"
                aria-label="Account menu"
              >
                <Image
                  src={user.avatarUrl || "/images/avatar-member.webp"}
                  alt={user.name}
                  width={80}
                  height={80}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-line"
                />
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted lg:block" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-[12px] text-muted">{user.email}</p>
                    <span className="badge badge-lime mt-2">{user.role}</span>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  <Link
                    href="/wallet"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-cream"
                  >
                    <Wallet className="h-4 w-4 text-muted" /> Wallet
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-cream"
                  >
                    <Bell className="h-4 w-4 text-muted" /> Notifications
                  </Link>
                  {user.isStaff && (
                    <Link
                      href="/admin"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-cream"
                    >
                      <Settings className="h-4 w-4 text-muted" /> Control centre
                    </Link>
                  )}
                  <div className="my-1 h-px bg-line" />
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-danger hover:bg-[#fdf1f1]"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-brand px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-dark sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full bg-[#f5f6f8] text-ink lg:hidden",
              isHome && "hidden"
            )}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-white px-4 py-3 lg:hidden">
          <div className="grid gap-1">
            {primaryNav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-cream",
                  isActive(href) && "bg-cream text-brand"
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/wallet"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-cream"
            >
              <Wallet className="h-4 w-4" /> Wallet
            </Link>
            <Link
              href="/notifications"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-cream"
            >
              <Bell className="h-4 w-4" /> Notifications
            </Link>
            {user?.isStaff && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-cream"
              >
                <ShieldCheck className="h-4 w-4" /> Control centre
              </Link>
            )}
            {!user && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-secondary btn-sm">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary btn-sm">
                  Create account
                </Link>
              </div>
            )}
            {user && (
              <button
                type="button"
                onClick={signOut}
                className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-[#fdf1f1]"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
