import Image from "next/image";
import { redirect } from "next/navigation";
import { BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/api";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();

  if (user) redirect(next || "/");

  return (
    <div className="grid min-h-[660px] lg:grid-cols-[1.02fr_1fr]">
      <div className="relative hidden overflow-hidden bg-brand-dark p-8 text-white lg:block">
        <Image
          src="/images/hero-community.webp"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-brand-dark/70 to-brand-dark" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-lime ring-1 ring-white/15">
            <BadgeCheck className="h-3.5 w-3.5" /> 250,000+ members
          </span>

          <div>
            <h2 className="max-w-[420px] font-display text-[38px] font-extrabold leading-[1.02] tracking-[-0.04em] text-white">
              Own a part of something real.
            </h2>
            <p className="mt-3 max-w-[360px] text-[13.5px] leading-relaxed text-white/70">
              Buy in with as little as ₦10,000. Track every contribution, asset and distribution in
              one transparent portfolio.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                { icon: ShieldCheck, title: "Verified before it goes live", body: "Supplier and document checks on every offer" },
                { icon: Lock, title: "Safeguarded contributions", body: "Server-verified payments and a double-entry ledger" },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <Icon className="mt-0.5 h-4 w-4 text-lime" />
                  <div>
                    <p className="text-[12.5px] font-semibold text-white">{title}</p>
                    <p className="text-[11px] text-white/60">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10.5px] text-white/45">
            ShareUp Technologies Ltd · Collective ownership marketplace
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[380px]">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-2 font-display text-[30px] font-extrabold tracking-[-0.04em]">
            Sign in to ShareUp
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Pick up where you left off and keep building your portfolio.
          </p>

          <div className="mt-6">
            <LoginForm next={next ?? "/"} />
          </div>
        </div>
      </div>
    </div>
  );
}
