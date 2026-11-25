import { apiFetch } from "@/lib/api";
import { requirePermission } from "@/lib/session";
import type { LedgerEntryView, TrialBalanceRow } from "@/lib/types";
import { formatDateTime, formatKobo } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ledger · Control centre" };

interface LedgerResponse {
  trialBalance: TrialBalanceRow[];
  entries: LedgerEntryView[];
}

interface Reconciliation {
  confirmedParticipations: number;
  participantFunds: number;
  refundPayable: number;
  distributionPayable: number;
  walletPayable: number;
  pendingTransactions: number;
  ledgerEntries: number;
  unbalancedEntries: number;
}

export default async function AdminLedgerPage() {
  await requirePermission("ledger.view");

  const [ledger, reconciliation] = await Promise.all([
    apiFetch<{ data: LedgerResponse }>("admin/ledger"),
    apiFetch<{ data: Reconciliation }>("admin/reconciliation"),
  ]);

  const balance = ledger.data.trialBalance;
  const totals = balance.reduce(
    (sum, row) => ({ debit: sum.debit + row.debit, credit: sum.credit + row.credit }),
    { debit: 0, credit: 0 }
  );
  const rec = reconciliation.data;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold">Financial ledger</h2>
        <p className="mt-1 text-[12px] text-muted">
          Double-entry records are append-only. Every contribution, fee, refund and payout posts to
          this ledger.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Participant funds", value: formatKobo(rec.participantFunds) },
          { label: "Refund payable", value: formatKobo(rec.refundPayable) },
          { label: "Distribution payable", value: formatKobo(rec.distributionPayable) },
          { label: "Wallet payable", value: formatKobo(rec.walletPayable) },
        ].map((card) => (
          <div key={card.label} className="card-pad card">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
              {card.label}
            </p>
            <p className="mt-2 font-display text-[20px] font-extrabold tracking-[-0.03em]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card-pad card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[16px] font-bold">Reconciliation</h3>
          <span
            className={
              rec.unbalancedEntries === 0
                ? "badge badge-green"
                : "badge badge-danger"
            }
          >
            {rec.unbalancedEntries === 0
              ? "Every entry balances"
              : `${rec.unbalancedEntries} unbalanced entries`}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[11.5px] sm:grid-cols-4">
          <div>
            <p className="text-muted">Confirmed participations</p>
            <p className="text-[14px] font-bold">{rec.confirmedParticipations}</p>
          </div>
          <div>
            <p className="text-muted">Ledger entries</p>
            <p className="text-[14px] font-bold">{rec.ledgerEntries}</p>
          </div>
          <div>
            <p className="text-muted">Pending transactions</p>
            <p className="text-[14px] font-bold">{rec.pendingTransactions}</p>
          </div>
          <div>
            <p className="text-muted">Trial balance debits</p>
            <p className="text-[14px] font-bold">{formatKobo(totals.debit)}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3.5">
          <h3 className="text-[15px] font-bold">Trial balance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base min-w-[560px]">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Credit</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {balance.map((row) => (
                <tr key={row.code}>
                  <td>
                    <span className="font-mono text-[10px] text-muted">{row.code}</span>{" "}
                    {row.name}
                  </td>
                  <td className="text-[11px] text-muted">{row.type}</td>
                  <td className="text-right">{formatKobo(row.debit)}</td>
                  <td className="text-right">{formatKobo(row.credit)}</td>
                  <td className="text-right font-semibold">{formatKobo(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3.5">
          <h3 className="text-[15px] font-bold">Recent entries</h3>
        </div>
        <div className="divide-y divide-line">
          {ledger.data.entries.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-muted">No ledger entries yet.</p>
          ) : (
            ledger.data.entries.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-semibold">{entry.description}</p>
                    <p className="text-[10px] text-muted">
                      {entry.reference} · {entry.kind.replaceAll("_", " ")} ·{" "}
                      {formatDateTime(entry.postedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {entry.lines.map((line, index) => (
                    <p key={`${entry.id}-${index}`} className="text-[10.5px] text-muted">
                      {line.code} {line.name}:{" "}
                      <span className="font-semibold text-ink">
                        {line.direction === "DEBIT" ? "Dr" : "Cr"} {formatKobo(line.amount)}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
