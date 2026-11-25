import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Banknote, ReceiptText, RotateCcw, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/session";
import type { Refund, Transaction } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";
import { DepositForm } from "@/components/deposit-form";
import { EmptyState, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wallet" };

const typeLabel: Record<string, string> = {
  DEPOSIT: "Wallet deposit",
  CONTRIBUTION: "Contribution",
  REFUND: "Refund",
  DISTRIBUTION: "Distribution",
  WITHDRAWAL: "Withdrawal",
  FEE: "Platform fee",
  ADJUSTMENT: "Adjustment",
};

export default async function WalletPage() {
  const user = await requireUser("/wallet");

  const response = await apiFetch<{
    data: { balance: number; transactions: Transaction[]; refunds: Refund[] };
  }>("wallet");

  const { balance, transactions, refunds } = response.data;
  const pendingRefunds = refunds.filter((refund) => ["REQUESTED", "APPROVED"].includes(refund.status));

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="border-b border-line pb-7">
        <p className="eyebrow">Money</p>
        <h1 className="mt-1.5 font-display text-[32px] font-extrabold tracking-[-0.04em] sm:text-[38px]">Wallet</h1>
        <p className="mt-1.5 max-w-[540px] text-[13.5px] text-muted">
          Distributions and refunds land here. Contributions are always paid from a verified
          payment, never from an unconfirmed balance.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="relative overflow-hidden rounded-[24px] bg-brand-dark px-6 py-6 text-white">
          <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 right-10 h-44 w-44 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
                <Wallet className="h-4 w-4" /> Available balance
              </span>
              <span className="badge badge-lime">NGN</span>
            </div>
            <p className="mt-5 font-display text-[40px] font-extrabold leading-none tracking-[-0.04em]">
              {formatKobo(balance)}
            </p>
            <p className="mt-2 text-[11.5px] text-white/60">
              {user.name} · {user.email}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/8 px-3.5 py-3 ring-1 ring-white/10">
                <p className="text-[10px] uppercase tracking-wide text-white/50">Refunds queued</p>
                <p className="mt-0.5 text-[14px] font-bold">{pendingRefunds.length}</p>
              </div>
              <div className="rounded-2xl bg-white/8 px-3.5 py-3 ring-1 ring-white/10">
                <p className="text-[10px] uppercase tracking-wide text-white/50">Transactions</p>
                <p className="mt-0.5 text-[14px] font-bold">{transactions.length}</p>
              </div>
            </div>
          </div>
        </div>

        <DepositForm />
      </div>

      {refunds.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-bold">Refunds</h2>
            <span className="text-[11px] text-muted">{refunds.length} total</span>
          </div>
          <div className="card divide-y divide-line">
            {refunds.map((refund) => (
              <div key={refund.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-cream text-muted">
                  <RotateCcw className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{refund.opportunityTitle}</p>
                  <p className="text-[11px] text-muted">
                    {refund.reference} · {refund.reasonLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold">{formatKobo(refund.amount)}</p>
                  <StatusBadge status={refund.status} className="mt-0.5" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] text-muted">
            Refunds are approved by a second authorised finance user (maker-checker) before payout.
          </p>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">Transaction history</h2>
          <span className="text-[11px] text-muted">Server-verified</span>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title="No transactions yet"
            body="Fund your wallet or join an opportunity to see your money trail here."
            action={
              <Link href="/discover" className="btn-primary btn-sm">
                Explore opportunities
              </Link>
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-base min-w-[620px]">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>When</th>
                    <th>Status</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const incoming = ["DEPOSIT", "REFUND", "DISTRIBUTION"].includes(transaction.type);
                    return (
                      <tr key={transaction.id}>
                        <td>
                          <span className="flex items-center gap-2 font-medium">
                            <span className={`grid h-7 w-7 place-items-center rounded-full ${incoming ? "bg-lime-soft text-brand" : "bg-cream text-muted"}`}>
                              {incoming ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                            </span>
                            {typeLabel[transaction.type] ?? transaction.type}
                          </span>
                        </td>
                        <td className="font-mono text-[10.5px] text-muted">{transaction.reference}</td>
                        <td className="text-[11.5px] text-muted">{formatDateTime(transaction.createdAt)}</td>
                        <td><StatusBadge status={transaction.status} /></td>
                        <td className={`text-right font-semibold ${incoming ? "text-brand" : "text-ink"}`}>
                          {incoming ? "+" : "−"}
                          {formatKobo(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
        <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p className="text-[11.5px] leading-relaxed text-muted">
          Balances are held as a payable in the ShareUp ledger. Payouts to your bank are processed
          by finance after identity verification — the demo wallet keeps balances in-platform.
        </p>
      </div>
    </div>
  );
}
