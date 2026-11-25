import Link from "next/link";
import Image from "next/image";
import { Handshake, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-9 px-4 pb-5 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[20px] bg-mint px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#d9e8d0]">
          <div className="flex items-center gap-3 sm:pr-5">
            <Image
              src="/images/proof-avatars.webp"
              alt="ShareUp members"
              width={603}
              height={225}
              className="h-11 w-auto shrink-0"
            />
            <div>
              <p className="text-[11.5px] leading-tight text-muted">Trusted by over</p>
              <p className="text-[17px] font-bold leading-tight text-ink">250,000+ Nigerians</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:px-5 lg:px-7">
            <ShieldCheck className="h-8 w-8 shrink-0 text-[#2ea71d]" strokeWidth={1.7} />
            <div>
              <p className="text-[12px] font-semibold leading-tight text-ink">Secure Payments</p>
              <p className="text-[11.5px] leading-tight text-muted">Powered by Paystack</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:pl-5 lg:pl-7">
            <Handshake className="h-8 w-8 shrink-0 text-[#2ea71d]" strokeWidth={1.7} />
            <div>
              <p className="text-[12px] font-semibold leading-tight text-ink">Transparent Process</p>
              <p className="text-[11.5px] leading-tight text-muted">Full visibility, always</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-1 pt-4 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} ShareUp Technologies Ltd. Own more. Together.</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <Link href="/discover" className="hover:text-brand">Discover</Link>
          <Link href="/create" className="hover:text-brand">Start a purchase</Link>
          <Link href="/login" className="hover:text-brand">Sign in</Link>
          <span className="hidden items-center gap-1.5 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Escrow-protected
          </span>
        </div>
      </div>
    </footer>
  );
}
