import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-[26px] w-[26px]" fill="none">
        <circle cx="16" cy="9.4" r="3.2" fill="#d9f69b" />
        <circle cx="8.9" cy="11.6" r="2.5" fill="#ffffff" />
        <circle cx="23.1" cy="11.6" r="2.5" fill="#ffffff" />
        <path
          d="M10.4 22.6c0-4.4 2.4-7.2 5.6-7.2s5.6 2.8 5.6 7.2"
          stroke="#d9f69b"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M3.5 22.6c0-3.9 2-6.4 4.7-6.4 1.5 0 2.8.8 3.6 2.1"
          stroke="#ffffff"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M28.5 22.6c0-3.9-2-6.4-4.7-6.4-1.5 0-2.8.8-3.6 2.1"
          stroke="#ffffff"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** The ShareUp wordmark and people mark, extracted from the supplied design. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center" aria-label="ShareUp home">
      <Image
        src="/images/logo-shareup.png"
        alt="ShareUp"
        width={936}
        height={160}
        priority
        className={cn("w-auto", compact ? "h-7" : "h-8 sm:h-9 xl:h-10")}
      />
    </Link>
  );
}
