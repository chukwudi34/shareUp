import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "badge-neutral" },
  PENDING_REVIEW: { label: "In review", className: "badge-warn" },
  PUBLISHED: { label: "Approved", className: "badge-lime" },
  FUNDING: { label: "Funding open", className: "badge-green" },
  FUNDED: { label: "Fully funded", className: "badge-green" },
  PARTIALLY_FUNDED: { label: "Partially funded", className: "badge-lime" },
  ACQUIRING: { label: "Acquiring", className: "badge-lime" },
  ACQUIRED: { label: "Acquired", className: "badge-lime" },
  DISTRIBUTING: { label: "Distributing", className: "badge-lime" },
  COMPLETED: { label: "Completed", className: "badge-neutral" },
  REFUNDING: { label: "Refunding", className: "badge-warn" },
  CANCELLED: { label: "Cancelled", className: "badge-danger" },
  REJECTED: { label: "Needs changes", className: "badge-danger" },
  EXPIRED: { label: "Expired", className: "badge-neutral" },
  CONFIRMED: { label: "Confirmed", className: "badge-green" },
  PENDING: { label: "Payment pending", className: "badge-warn" },
  REFUND_PENDING: { label: "Refund pending", className: "badge-warn" },
  REFUNDED: { label: "Refunded", className: "badge-neutral" },
  REQUESTED: { label: "Awaiting approval", className: "badge-warn" },
  APPROVED: { label: "Approved", className: "badge-lime" },
  PAID: { label: "Paid", className: "badge-green" },
  AWAITING_APPROVAL: { label: "Awaiting approval", className: "badge-warn" },
  EXECUTED: { label: "Executed", className: "badge-green" },
  ACTIVE: { label: "Active", className: "badge-green" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = statusMap[status] ?? { label: status, className: "badge-neutral" };
  return <span className={cn(entry.className, className)}>{entry.label}</span>;
}

export function Progress({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn("progress-track", className)}>
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="text-[22px] font-bold sm:text-[25px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-lime-soft text-brand">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-white",
        className
      )}
    >
      {initials || "SU"}
    </span>
  );
}

export function Definition({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-cream px-4 py-3", className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const series = values.length > 1 ? values : [0, 0];
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const width = 220;
  const height = 54;
  const points = series.map((value, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = height - 4 - ((value - min) / span) * (height - 12);
    return [x, y] as const;
  });

  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-14 w-full", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ccf4f" stopOpacity=".32" />
          <stop offset="100%" stopColor="#8ccf4f" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="#00621c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
