"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { parseNairaInput } from "@/lib/money";
import { useDialog } from "@/components/dialog-provider";
import { cn } from "@/lib/utils";

async function post(endpoint: string, body: unknown) {
  const response = await fetch(`/api/proxy/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const firstError =
      payload?.errors && typeof payload.errors === "object"
        ? (Object.values(payload.errors)[0] as string[] | undefined)?.[0]
        : null;
    throw new Error(firstError ?? payload?.message ?? "The action could not be completed.");
  }

  return payload;
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-[10.5px] leading-snug text-danger">{error}</p>;
}

type Tone = "primary" | "secondary" | "danger";

const toneClass: Record<Tone, string> = {
  primary: "btn-primary btn-sm",
  secondary: "btn-secondary btn-sm",
  danger: "btn-secondary btn-sm text-danger hover:border-danger/40",
};

export function AdminActionButton({
  label,
  endpoint,
  body,
  confirm,
  tone = "secondary",
}: {
  label: string;
  endpoint: string;
  body?: Record<string, unknown>;
  confirm?: string;
  tone?: Tone;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (
      confirm &&
      !(await dialog.confirm(confirm, {
        title: label,
        confirmLabel: label,
        tone: tone === "danger" ? "danger" : "info",
      }))
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await post(endpoint, body ?? {});
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" onClick={run} disabled={busy} className={toneClass[tone]}>
        {busy && <Loader2 className="h-3 w-3 animate-spin" />}
        {label}
      </button>
      <ErrorText error={error} />
    </div>
  );
}

export function AdminNoteAction({
  label,
  endpoint,
  field,
  placeholder,
  tone = "secondary",
}: {
  label: string;
  endpoint: string;
  field: string;
  placeholder: string;
  tone?: Tone;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (note.trim().length < 3) {
      setError("Add a short reason first.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await post(endpoint, { [field]: note.trim() });
      setNote("");
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={toneClass[tone]}>
        {label}
      </button>
    );
  }

  return (
    <div className="w-[220px] space-y-1.5">
      <textarea
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={placeholder}
        className="input px-3 py-2 text-[11.5px]"
      />
      <div className="flex gap-1.5">
        <button type="button" onClick={run} disabled={busy} className={toneClass[tone]}>
          {busy && <Loader2 className="h-3 w-3 animate-spin" />}
          Confirm
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
          Cancel
        </button>
      </div>
      <ErrorText error={error} />
    </div>
  );
}

export function AdminReviewForm({ id }: { id: number }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "APPROVE" | "REJECT" | "CHANGES") {
    if (decision !== "APPROVE" && notes.trim().length < 3) {
      setError("Reviewer notes are required to reject or request changes.");
      return;
    }

    setBusy(decision);
    setError(null);
    try {
      await post(`admin/opportunities/${id}/review`, { decision, notes: notes.trim() || null });
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="w-[230px] space-y-1.5">
      <textarea
        rows={2}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Reviewer notes"
        className="input px-3 py-2 text-[11.5px]"
      />
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => decide("APPROVE")}
          disabled={busy !== null}
          className="btn-primary btn-sm"
        >
          {busy === "APPROVE" && <Loader2 className="h-3 w-3 animate-spin" />}
          Approve
        </button>
        <button
          type="button"
          onClick={() => decide("CHANGES")}
          disabled={busy !== null}
          className={toneClass.secondary}
        >
          Changes
        </button>
        <button
          type="button"
          onClick={() => decide("REJECT")}
          disabled={busy !== null}
          className={toneClass.danger}
        >
          Reject
        </button>
      </div>
      <ErrorText error={error} />
    </div>
  );
}

export function RecordAcquisitionForm({ id }: { id: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [custodian, setCustodian] = useState("");
  const [valuation, setValuation] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function run() {
    const currentValuation = valuation ? parseNairaInput(valuation) : null;
    if (valuation && !currentValuation) {
      setError("Enter the valuation in naira.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await post(`admin/opportunities/${id}/acquisition`, {
        name: name.trim() || null,
        custodian: custodian.trim() || null,
        currentValuation,
        documentsNote: note.trim() || null,
      });
      setDone(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record the acquisition.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="text-[11px] font-semibold text-brand">Acquisition recorded.</p>;
  }

  return (
    <div className="w-[240px] space-y-1.5">
      <input
        className="input px-3 py-2 text-[11.5px]"
        placeholder="Asset name (optional)"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <input
        className="input px-3 py-2 text-[11.5px]"
        placeholder="Custodian"
        value={custodian}
        onChange={(event) => setCustodian(event.target.value)}
      />
      <input
        className="input px-3 py-2 text-[11.5px]"
        placeholder="Current valuation (₦)"
        inputMode="decimal"
        value={valuation}
        onChange={(event) => setValuation(event.target.value)}
      />
      <input
        className="input px-3 py-2 text-[11.5px]"
        placeholder="Evidence reference / note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button type="button" onClick={run} disabled={busy} className="btn-primary btn-sm">
        {busy && <Loader2 className="h-3 w-3 animate-spin" />}
        Record acquisition
      </button>
      <ErrorText error={error} />
    </div>
  );
}

export function CreateDistributionForm({
  assets,
  opportunities,
}: {
  assets: Array<{ id: number; name: string }>;
  opportunities: Array<{ id: number; title: string }>;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [type, setType] = useState<"FINANCIAL" | "PHYSICAL">("FINANCIAL");
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [gross, setGross] = useState("");
  const [expense, setExpense] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!title.trim()) {
      setError("Give the distribution a title.");
      return;
    }
    if (type === "FINANCIAL" && !parseNairaInput(gross)) {
      setError("Enter the gross amount in naira.");
      return;
    }

    const [kind, rawId] = target.split(":");
    if (!rawId) {
      setError("Choose the asset or opportunity this distribution belongs to.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await post("admin/distributions", {
        type,
        assetId: kind === "asset" ? Number(rawId) : null,
        opportunityId: kind === "opportunity" ? Number(rawId) : null,
        title: title.trim(),
        grossAmount: parseNairaInput(gross) ?? 0,
        expenseAmount: parseNairaInput(expense) ?? 0,
        totalQuantity: quantity ? Number(quantity) : 0,
      });
      setTitle("");
      setGross("");
      setExpense("");
      setQuantity("");
      setTarget("");
      dialog.notify(
        "Distribution created",
        "Queued for approval by a second authorised user.",
        "success"
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the distribution.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-pad card">
      <h2 className="text-[16px] font-bold">New distribution</h2>
      <p className="mt-1 text-[11.5px] text-muted">
        A second authorised user must approve before any payout runs.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Type</label>
          <select
            className="select"
            value={type}
            onChange={(event) => setType(event.target.value as "FINANCIAL" | "PHYSICAL")}
          >
            <option value="FINANCIAL">Financial</option>
            <option value="PHYSICAL">Physical</option>
          </select>
        </div>
        <div>
          <label className="field-label">Belongs to</label>
          <select className="select" value={target} onChange={(event) => setTarget(event.target.value)}>
            <option value="">Select asset or opportunity</option>
            {assets.length > 0 && (
              <optgroup label="Assets">
                {assets.map((asset) => (
                  <option key={`asset-${asset.id}`} value={`asset:${asset.id}`}>
                    {asset.name}
                  </option>
                ))}
              </optgroup>
            )}
            {opportunities.length > 0 && (
              <optgroup label="Opportunities">
                {opportunities.map((item) => (
                  <option key={`opportunity-${item.id}`} value={`opportunity:${item.id}`}>
                    {item.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Q2 rice sale proceeds"
          />
        </div>
        {type === "FINANCIAL" ? (
          <>
            <div>
              <label className="field-label">Gross amount (₦)</label>
              <input
                className="input"
                inputMode="decimal"
                value={gross}
                onChange={(event) => setGross(event.target.value)}
                placeholder="5,000,000"
              />
            </div>
            <div>
              <label className="field-label">Approved expenses (₦)</label>
              <input
                className="input"
                inputMode="decimal"
                value={expense}
                onChange={(event) => setExpense(event.target.value)}
                placeholder="350,000"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="field-label">Total quantity</label>
            <input
              className="input"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="500"
            />
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}
      <button type="button" onClick={run} disabled={busy} className="btn-primary btn-sm mt-3">
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Create distribution
      </button>
    </div>
  );
}

export function CreatePayoutForm({
  opportunities,
}: {
  opportunities: Array<{ id: number; title: string; supplierName: string }>;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [opportunityId, setOpportunityId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    const kobo = parseNairaInput(amount);
    if (!opportunityId) {
      setError("Choose the opportunity this payout belongs to.");
      return;
    }
    if (!kobo || kobo <= 0) {
      setError("Enter the supplier amount in naira.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await post("admin/payouts", {
        opportunityId: Number(opportunityId),
        amount: kobo,
        note: note.trim() || null,
      });
      setAmount("");
      setNote("");
      dialog.notify(
        "Payout requested",
        "A different authorised user must approve it.",
        "success"
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request the payout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-pad card">
      <h2 className="text-[16px] font-bold">Request supplier payout</h2>
      <p className="mt-1 text-[11.5px] text-muted">
        Only approved acquisition conditions should be paid. Maker-checker always applies.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="field-label">Opportunity</label>
          <select
            className="select"
            value={opportunityId}
            onChange={(event) => setOpportunityId(event.target.value)}
          >
            <option value="">Select opportunity</option>
            {opportunities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — {item.supplierName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Amount (₦)</label>
          <input
            className="input"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="8,000,000"
          />
        </div>
        <div>
          <label className="field-label">Note</label>
          <input
            className="input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Acquisition balance after fee"
          />
        </div>
      </div>
      {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}
      <button type="button" onClick={run} disabled={busy} className="btn-primary btn-sm mt-3">
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Request payout
      </button>
    </div>
  );
}

export function RecordIncomeForm({ assetId }: { assetId: number }) {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function run() {
    const kobo = parseNairaInput(amount);
    if (!source.trim()) {
      setError("Name the income source.");
      return;
    }
    if (!kobo) {
      setError("Enter the amount in naira.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await post(`admin/assets/${assetId}/income`, {
        source: source.trim(),
        category: category.trim() || null,
        amount: kobo,
      });
      setDone(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record income.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="text-[10.5px] font-semibold text-brand">Income recorded.</p>;
  }

  return (
    <div className="flex min-w-[300px] flex-wrap items-center gap-1.5">
      <input
        className="input w-[110px] px-2.5 py-1.5 text-[11px]"
        placeholder="Source"
        value={source}
        onChange={(event) => setSource(event.target.value)}
      />
      <input
        className="input w-[90px] px-2.5 py-1.5 text-[11px]"
        placeholder="Category"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      />
      <input
        className="input w-[95px] px-2.5 py-1.5 text-[11px]"
        placeholder="₦ amount"
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <button type="button" onClick={run} disabled={busy} className="btn-secondary btn-sm">
        {busy && <Loader2 className="h-3 w-3 animate-spin" />}
        Add
      </button>
      <ErrorText error={error} />
    </div>
  );
}
