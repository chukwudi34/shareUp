import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckCircle2, PieChart, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/api";
import { RegisterForm } from "@/components/register-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();

  if (user) redirect(next || "/");

  return (
    <div className="grid min-h-[680px] lg:grid-cols-[1fr_1.02fr]">
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <p className="eyebrow">Join ShareUp</p>
          <h1 className="mt-2 font-display text-[30px] font-extrabold tracking-[-0.04em]">
            Start owning together
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Create a free account. Browse verified opportunities, contribute from ₦10,000 and
            track your ownership in one place.
          </p>

          <div className="mt-6">
            <RegisterForm next={next ?? "/discover"} />
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-brand-dark p-8 text-white lg:block">
        <Image src="/images/cover-farmland.webp" alt="" fill sizes="50vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/40 via-brand-dark/80 to-[#061f10]" />
        <div className="relative z-10 flex h-full flex-col justify-center">
          <div className="rounded-[26px] border border-white/10 bg-white/8 p-6 backdrop-blur">
            <span className="badge badge-lime">Every offer, inspected</span>
            <h2 className="mt-4 max-w-[380px] font-display text-[31px] font-extrabold leading-[1.08] tracking-[-0.04em] text-white">
              Your money follows a verified path.
            </h2>

            <div className="mt-6 space-y-4">
              {[
                { icon: ShieldCheck, title: "Compliance review before launch", body: "Supplier identity, quotes and ownership documents are checked by operations." },
                { icon: PieChart, title: "Ownership, not promises", body: "Your share is recorded in units with a cost basis and entitlement." },
                { icon: CheckCircle2, title: "Refunds when funding fails", body: "If a deal does not complete, your contribution is queued for a full refund." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-white/60">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
            <Image
              src="/images/proof-avatars.webp"
              alt=""
              width={80}
              height={32}
              className="h-8 w-auto rounded-full object-cover"
            />
            <p className="text-[11px] text-white/70">
              <strong className="text-white">250,000+ Nigerians</strong> already own more, together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
