"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Package,
  Save,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import {
  buildDraftPayload,
  CATEGORIES,
  COVER_OPTIONS,
  emptyDraft,
  estimatedFee,
  LEGAL_STRUCTURES,
  submissionBlockers,
  type DraftFormValues,
} from "@/lib/opportunity-draft";
import { formatKobo } from "@/lib/money";
import { useDialog } from "@/components/dialog-provider";
import type { Opportunity } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  saveOpportunityDraft,
  submitOpportunityForReview,
  uploadOpportunityDocument,
} from "@/app/create/actions";

const STEPS = ["Model", "Details", "Supply", "Funding", "Terms", "Review"];

const DOCUMENT_KINDS = [
  { value: "SUPPLIER_QUOTE", label: "Supplier quote" },
  { value: "OWNERSHIP", label: "Ownership document" },
  { value: "IDENTITY", label: "Identity evidence" },
  { value: "LICENSE", label: "License or permit" },
  { value: "OTHER", label: "Other supporting file" },
];

type OpportunityDocument = NonNullable<Opportunity["documents"]>[number];

export function CreateOpportunityWizard({
  initial,
  draftId: initialDraftId,
  initialDocuments,
}: {
  initial?: DraftFormValues;
  draftId?: number;
  initialDocuments?: OpportunityDocument[];
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [form, setForm] = useState<DraftFormValues>(initial ?? emptyDraft());
  const [draftId, setDraftId] = useState<number | undefined>(initialDraftId);
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState<Opportunity | null>(null);
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<OpportunityDocument[]>(initialDocuments ?? []);
  const [documentKind, setDocumentKind] = useState("SUPPLIER_QUOTE");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fee = useMemo(() => estimatedFee(form.targetAmount), [form.targetAmount]);
  const blockers = useMemo(() => submissionBlockers(form), [form]);
  const busy = saving || submitting || uploading || pending;

  function update<K extends keyof DraftFormValues>(key: K, value: DraftFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseModel(model: DraftFormValues["model"]) {
    setForm((current) => ({
      ...current,
      model,
      participationMethod: model === "MANAGED_ASSET" ? "UNITS" : current.participationMethod,
      legalStructure: model === "MANAGED_ASSET" ? "BENEFICIAL" : "CONTRACTUAL_ECONOMIC",
      ownershipType: model === "MANAGED_ASSET" ? "BENEFICIAL" : "PHYSICAL_QUANTITY",
    }));
  }

  function next() {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1 && !form.title.trim()) {
      void dialog.alert("Add a title before continuing.");
      return;
    }

    if (step === 3) {
      if (!form.targetAmount.trim()) {
        void dialog.alert("Enter the amount you need to raise.");
        return;
      }
      if (!form.minContribution.trim()) {
        void dialog.alert("Set the minimum a participant can contribute.");
        return;
      }
      if (form.participationMethod === "UNITS") {
        if (!form.unitPrice || !form.totalUnits || !form.minUnits) {
          void dialog.alert("Unit offers need a unit price, total units and a minimum number of units.");
          return;
        }
      }
    }

    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  }

  function persist(): Promise<{ ok: true; opportunity: Opportunity } | { ok: false; error: string }> {
    const result = buildDraftPayload(form);
    if (!result.payload) {
      return Promise.resolve({ ok: false, error: result.error });
    }
    return saveOpportunityDraft(result.payload, draftId);
  }

  async function saveDraft() {
    setSaving(true);

    const result = await persist();
    setSaving(false);

    if (!result.ok) {
      void dialog.alert(result.error, { title: "Draft not saved", tone: "danger" });
      return;
    }

    setDraftId(result.opportunity.id);
    dialog.notify(
      draftId ? "Draft updated" : "Draft saved",
      draftId
        ? "Draft updated. It stays private until you submit it for review."
        : "Draft saved. You can leave and continue it from “My submissions”.",
      "success"
    );
    startTransition(() => router.refresh());
  }

  async function uploadDocument() {
    if (!documentFile) {
      void dialog.alert("Choose a PDF or image to upload.");
      return;
    }

    setUploading(true);

    let id = draftId;
    if (!id) {
      const saved = await persist();
      if (!saved.ok) {
        setUploading(false);
        void dialog.alert(saved.error, { title: "Draft not saved", tone: "danger" });
        return;
      }
      id = saved.opportunity.id;
      setDraftId(id);
    }

    const body = new FormData();
    body.set("file", documentFile);
    body.set("kind", documentKind);
    body.set("title", documentTitle.trim() || documentFile.name);

    const result = await uploadOpportunityDocument(id, body);
    setUploading(false);

    if (!result.ok) {
      void dialog.alert(result.error, { title: "Upload failed", tone: "danger" });
      return;
    }

    setDocuments((current) => [...current, result.document]);
    setDocumentFile(null);
    setDocumentTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    dialog.notify(
      "Document uploaded",
      "Operations verifies it during review.",
      "success"
    );
  }

  async function submit() {
    if (blockers.length > 0) {
      void dialog.alert(`Complete these before submitting: ${blockers.join(", ")}.`, {
        title: "Not ready to submit",
        tone: "danger",
      });
      return;
    }
    if (!agreed) {
      void dialog.alert("Confirm that the information is accurate before submitting.");
      return;
    }

    setSubmitting(true);

    const saved = await persist();
    if (!saved.ok) {
      setSubmitting(false);
      void dialog.alert(saved.error, { title: "Draft not saved", tone: "danger" });
      return;
    }

    setDraftId(saved.opportunity.id);

    const result = await submitOpportunityForReview(saved.opportunity.id);
    setSubmitting(false);

    if (!result.ok) {
      setDraftId(saved.opportunity.id);
      void dialog.alert(result.error, { title: "Submission failed", tone: "danger" });
      return;
    }

    setSubmitted(result.opportunity);
    startTransition(() => router.refresh());
  }

  if (submitted) {
    return (
      <div className="card flex flex-col items-center px-6 py-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-lime-soft text-brand">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-[24px] font-extrabold tracking-[-0.03em]">
          Submitted for review
        </h2>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">
          {submitted.title} is now with the ShareUp operations team. We check supplier details,
          pricing evidence and the legal structure before it opens for contributions. You will be
          notified when it is approved or returned with notes.
        </p>
        <div className="mt-5 rounded-2xl bg-cream px-4 py-3 text-left">
          <p className="text-[10.5px] uppercase tracking-wide text-muted">Reference</p>
          <p className="text-sm font-semibold">{submitted.slug}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/create" className="btn-secondary btn-sm">
            Create another
          </Link>
          <Link href="/discover" className="btn-primary btn-sm">
            Explore opportunities
          </Link>
        </div>
      </div>
    );
  }

  const stepTitle = [
    "What are we acquiring together?",
    "Describe the opportunity",
    "Supply and quantities",
    "Funding and participation rules",
    "Terms, risks and evidence",
    "Review and submit",
  ][step];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-line px-5 py-3.5">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index < step && setStep(index)}
            disabled={index > step}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
              index === step && "bg-brand text-white",
              index < step && "text-brand hover:bg-lime-soft",
              index > step && "text-muted/60"
            )}
          >
            <span
              className={cn(
                "grid h-4 w-4 place-items-center rounded-full text-[9px]",
                index === step ? "bg-white/20" : index < step ? "bg-lime-soft" : "bg-cream"
              )}
            >
              {index < step ? <Check className="h-2.5 w-2.5" /> : index + 1}
            </span>
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-6 sm:px-7">
        <p className="eyebrow">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-1 font-display text-[23px] font-extrabold tracking-[-0.03em]">
          {stepTitle}
        </h2>
        <p className="mt-1.5 max-w-[620px] text-[12.5px] leading-relaxed text-muted">
          {step === 0 &&
            "Collective purchasing is for divisible goods. Managed assets are held through a legal structure and can only open once its approvals are in place."}
          {step === 1 &&
            "Plain language works best. Participants need to understand what is being acquired, where it is and why the price is fair."}
          {step === 2 &&
            "Tell us what is being supplied and how it is measured. These details drive each participant's entitlement."}
          {step === 3 &&
            "Contributions are always paid by a verified payment. You define the minimum, the cap and the deadline."}
          {step === 4 &&
            "Risk information is mandatory. ShareUp does not publish offers without clear conditions and evidence of the supplier's quote."}
          {step === 5 &&
            "This is exactly what operations will review. Save a draft if you are not ready to submit."}
        </p>

        <div className="mt-6 space-y-5">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  value: "COLLECTIVE_PURCHASE" as const,
                  icon: Package,
                  title: "Collective purchase",
                  body: "Rice, produce, building materials or wholesale goods split by quantity. Participants receive their share of the goods.",
                },
                {
                  value: "MANAGED_ASSET" as const,
                  icon: Building2,
                  title: "Managed asset",
                  body: "Land, property or productive equipment held through an approved structure. Distributions follow the governing agreement.",
                },
              ].map(({ value, icon: Icon, title, body }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => chooseModel(value)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    form.model === value
                      ? "border-brand bg-lime-soft/60 ring-2 ring-brand/15"
                      : "border-line hover:border-brand/40 hover:bg-cream"
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand ring-1 ring-line">
                      <Icon className="h-4 w-4" />
                    </span>
                    {form.model === value && (
                      <span className="badge badge-lime">
                        <Check className="h-3 w-3" /> Selected
                      </span>
                    )}
                  </span>
                  <p className="mt-3 text-[14px] font-bold">{title}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{body}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="field-label" htmlFor="title">
                  Opportunity title
                </label>
                <input
                  id="title"
                  className="input"
                  maxLength={140}
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="e.g. 500 bags of long-grain rice, Kano"
                />
                <p className="mt-1 text-[10.5px] text-muted">{form.title.length}/140</p>
              </div>

              <div>
                <label className="field-label" htmlFor="summary">
                  Short summary
                </label>
                <input
                  id="summary"
                  className="input"
                  maxLength={300}
                  value={form.summary}
                  onChange={(event) => update("summary", event.target.value)}
                  placeholder="One line participants will see on the discover card."
                />
              </div>

              <div>
                <label className="field-label" htmlFor="description">
                  Full description
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className="input resize-y"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="What is being acquired, who supplies it, quality grade and what happens after funding."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="category">
                    Category
                  </label>
                  <select
                    id="category"
                    className="select"
                    value={form.category}
                    onChange={(event) => update("category", event.target.value)}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    className="input"
                    value={form.location}
                    onChange={(event) => update("location", event.target.value)}
                    placeholder="Lagos, Nigeria"
                  />
                </div>
              </div>

              <div>
                <span className="field-label">Cover image</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {COVER_OPTIONS.map((option) => (
                    <button
                      key={option.src}
                      type="button"
                      onClick={() => update("coverImage", option.src)}
                      className={cn(
                        "relative overflow-hidden rounded-xl border text-left transition",
                        form.coverImage === option.src
                          ? "border-brand ring-2 ring-brand/20"
                          : "border-line hover:border-brand/40"
                      )}
                    >
                      <Image
                        src={option.src}
                        alt={option.label}
                        width={320}
                        height={160}
                        className="h-20 w-full object-cover"
                      />
                      <span className="flex items-center justify-between px-2 py-1.5 text-[10.5px] font-semibold">
                        {option.label}
                        {form.coverImage === option.src && <Check className="h-3 w-3 text-brand" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="supplierName">
                    Supplier / seller
                  </label>
                  <input
                    id="supplierName"
                    className="input"
                    value={form.supplierName}
                    onChange={(event) => update("supplierName", event.target.value)}
                    placeholder="Registered business name"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="supplierContact">
                    Supplier contact
                  </label>
                  <input
                    id="supplierContact"
                    className="input"
                    value={form.supplierContact}
                    onChange={(event) => update("supplierContact", event.target.value)}
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="quantityLabel">
                    Unit label
                  </label>
                  <input
                    id="quantityLabel"
                    className="input"
                    value={form.quantityLabel}
                    onChange={(event) => update("quantityLabel", event.target.value)}
                    placeholder="bag, tonne, crate"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="targetQuantity">
                    Target quantity
                  </label>
                  <input
                    id="targetQuantity"
                    inputMode="numeric"
                    className="input"
                    value={form.targetQuantity}
                    onChange={(event) => update("targetQuantity", event.target.value)}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="unitPrice">
                    Price per unit (₦)
                  </label>
                  <input
                    id="unitPrice"
                    inputMode="decimal"
                    className="input"
                    value={form.unitPrice}
                    onChange={(event) => update("unitPrice", event.target.value)}
                    placeholder="80,000"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="unitsPerPackage">
                    Units per package
                  </label>
                  <input
                    id="unitsPerPackage"
                    inputMode="numeric"
                    className="input"
                    value={form.unitsPerPackage}
                    onChange={(event) => update("unitsPerPackage", event.target.value)}
                    placeholder="Optional, e.g. 10"
                  />
                </div>
              </div>

              {form.model === "MANAGED_ASSET" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="legalStructure">
                      Holding structure
                    </label>
                    <select
                      id="legalStructure"
                      className="select"
                      value={form.legalStructure}
                      onChange={(event) => update("legalStructure", event.target.value)}
                    >
                      {LEGAL_STRUCTURES.map((structure) => (
                        <option key={structure.value} value={structure.value}>
                          {structure.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="expectedAcquisitionDate">
                      Expected acquisition date
                    </label>
                    <input
                      id="expectedAcquisitionDate"
                      type="date"
                      className="input"
                      value={form.expectedAcquisitionDate}
                      onChange={(event) => update("expectedAcquisitionDate", event.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="estimatedDeliveryDate">
                  Estimated delivery / handover date
                </label>
                <input
                  id="estimatedDeliveryDate"
                  type="date"
                  className="input"
                  value={form.estimatedDeliveryDate}
                  onChange={(event) => update("estimatedDeliveryDate", event.target.value)}
                />
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-cream px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <p className="text-[11px] leading-relaxed text-muted">
                  Operations verifies the supplier and the quote before this offer can open.
                  Evidence you upload during review is tied to this opportunity and cannot be
                  changed after publication.
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <span className="field-label">How participants join</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "AMOUNT" as const, title: "Choose an amount", body: "Contribute any amount between the minimum and cap." },
                    { value: "UNITS" as const, title: "Choose units", body: "Buy whole units at a fixed unit price." },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update("participationMethod", option.value)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left transition",
                        form.participationMethod === option.value
                          ? "border-brand bg-lime-soft/60"
                          : "border-line hover:bg-cream"
                      )}
                    >
                      <p className="text-[12.5px] font-semibold">{option.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{option.body}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="targetAmount">
                    Target amount (₦)
                  </label>
                  <input
                    id="targetAmount"
                    inputMode="decimal"
                    className="input"
                    value={form.targetAmount}
                    onChange={(event) => update("targetAmount", event.target.value)}
                    placeholder="40,000,000"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="minContribution">
                    Minimum contribution (₦)
                  </label>
                  <input
                    id="minContribution"
                    inputMode="decimal"
                    className="input"
                    value={form.minContribution}
                    onChange={(event) => update("minContribution", event.target.value)}
                    placeholder="500,000"
                  />
                </div>
              </div>

              {form.participationMethod === "UNITS" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="field-label" htmlFor="totalUnits">
                      Total units
                    </label>
                    <input
                      id="totalUnits"
                      inputMode="numeric"
                      className="input"
                      value={form.totalUnits}
                      onChange={(event) => update("totalUnits", event.target.value)}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="minUnits">
                      Minimum units
                    </label>
                    <input
                      id="minUnits"
                      inputMode="numeric"
                      className="input"
                      value={form.minUnits}
                      onChange={(event) => update("minUnits", event.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="maxUnits">
                      Maximum units
                    </label>
                    <input
                      id="maxUnits"
                      inputMode="numeric"
                      className="input"
                      value={form.maxUnits}
                      onChange={(event) => update("maxUnits", event.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="maxContribution">
                    Maximum contribution (₦)
                  </label>
                  <input
                    id="maxContribution"
                    inputMode="decimal"
                    className="input"
                    value={form.maxContribution}
                    onChange={(event) => update("maxContribution", event.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="maxParticipants">
                    Maximum participants
                  </label>
                  <input
                    id="maxParticipants"
                    inputMode="numeric"
                    className="input"
                    value={form.maxParticipants}
                    onChange={(event) => update("maxParticipants", event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="fundingDeadline">
                  Funding deadline
                </label>
                <input
                  id="fundingDeadline"
                  type="date"
                  className="input"
                  value={form.fundingDeadline}
                  onChange={(event) => update("fundingDeadline", event.target.value)}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { key: "allowsPartialFunding" as const, label: "Allow partial funding", body: "Proceed at 80% of target if the deadline passes." },
                  { key: "allowCancellation" as const, label: "Allow cancellation", body: "Participants can withdraw before funding closes." },
                  { key: "waitingListEnabled" as const, label: "Enable waiting list", body: "Collect interest when the offer is full or closed." },
                  { key: "allowsOverfunding" as const, label: "Allow overfunding", body: "Accept contributions above the target amount." },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-3.5 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={form[toggle.key]}
                      onChange={(event) => update(toggle.key, event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#00621c]"
                    />
                    <span>
                      <span className="block text-[12px] font-semibold">{toggle.label}</span>
                      <span className="block text-[10.5px] leading-relaxed text-muted">{toggle.body}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="rounded-2xl bg-cream px-4 py-3">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-muted">Platform fee at funding (3.5%)</span>
                  <span className="font-semibold">{fee ? formatKobo(fee.fee) : "—"}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11.5px]">
                  <span className="text-muted">Estimated available for acquisition</span>
                  <span className="font-semibold">{fee ? formatKobo(fee.net) : "—"}</span>
                </div>
                <p className="mt-2 text-[10px] text-muted">
                  The fee is only earned on a successfully funded deal. It is shown here as an
                  estimate and can be adjusted by operations during review.
                </p>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <label className="field-label" htmlFor="riskNotes">
                  Risks and what could go wrong
                </label>
                <textarea
                  id="riskNotes"
                  rows={4}
                  className="input resize-y"
                  value={form.riskNotes}
                  onChange={(event) => update("riskNotes", event.target.value)}
                  placeholder="Price movements, supplier lead time, quality grade, delivery risk..."
                />
              </div>

              <div>
                <label className="field-label" htmlFor="acquisitionConditions">
                  Acquisition conditions
                </label>
                <textarea
                  id="acquisitionConditions"
                  rows={4}
                  className="input resize-y"
                  value={form.acquisitionConditions}
                  onChange={(event) => update("acquisitionConditions", event.target.value)}
                  placeholder="What must be true before money is released and the asset is acquired."
                />
              </div>

              <div className="rounded-2xl border border-line px-4 py-3.5">
                <p className="text-[12px] font-semibold">Supporting documents</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Upload the supplier quote, ownership documents and identity evidence. PDF, JPG,
                  PNG or WebP up to 10MB. Operations verifies each file during review.
                </p>

                {documents.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {documents.map((document) => (
                      <li
                        key={document.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-brand" />
                          <span className="truncate text-[11.5px] font-semibold">
                            {document.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] text-muted">
                          {document.verified ? "Verified" : "Pending verification"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]">
                  <label className="block">
                    <span className="text-[10.5px] font-semibold text-muted">Document type</span>
                    <select
                      className="select mt-1"
                      value={documentKind}
                      onChange={(event) => setDocumentKind(event.target.value)}
                      disabled={busy}
                    >
                      {DOCUMENT_KINDS.map((kind) => (
                        <option key={kind.value} value={kind.value}>
                          {kind.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10.5px] font-semibold text-muted">Title (optional)</span>
                    <input
                      className="input mt-1"
                      value={documentTitle}
                      onChange={(event) => setDocumentTitle(event.target.value)}
                      placeholder="e.g. Supplier quote — Sept 2026"
                      disabled={busy}
                    />
                  </label>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(event) => {
                      setDocumentFile(event.target.files?.[0] ?? null);
                    }}
                    disabled={busy}
                    className="block w-full max-w-[280px] text-[11px] text-muted file:mr-2 file:rounded-full file:border-0 file:bg-lime-soft file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-brand"
                  />
                  <button
                    type="button"
                    onClick={uploadDocument}
                    className="btn-secondary btn-sm"
                    disabled={busy || !documentFile}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload document
                  </button>
                </div>
                {!draftId && (
                  <p className="mt-1.5 text-[10px] text-muted">
                    Your draft is saved automatically before the first upload.
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#00621c]"
                />
                <span className="text-[11.5px] leading-relaxed text-muted">
                  I confirm the details are accurate, I have the supplier&apos;s permission to
                  propose this acquisition and I understand that ShareUp must review and approve it
                  before any money is collected.
                </span>
              </label>
            </>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-cream px-4 py-3">
                  <p className="text-[10.5px] uppercase tracking-wide text-muted">Opportunity</p>
                  <p className="mt-1 text-[14px] font-bold">{form.title || "Untitled draft"}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {form.category} · {form.location || "Location not set"}
                  </p>
                </div>
                <div className="rounded-2xl bg-cream px-4 py-3">
                  <p className="text-[10.5px] uppercase tracking-wide text-muted">Target</p>
                  <p className="mt-1 text-[14px] font-bold">
                    {form.targetAmount ? `₦${form.targetAmount}` : "Not set"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Min {form.minContribution ? `₦${form.minContribution}` : "not set"} ·{" "}
                    {form.fundingDeadline || "no deadline"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-line px-4 py-3.5">
                <p className="text-[12px] font-semibold">What happens next</p>
                <ol className="mt-2 space-y-1.5 text-[11.5px] text-muted">
                  <li>1. Operations checks the supplier, pricing and documentation.</li>
                  <li>2. Legal confirms the holding structure where the model requires it.</li>
                  <li>3. You get a notification with the decision or requested changes.</li>
                  <li>4. Approved offers are published and can open for contributions.</li>
                </ol>
              </div>

              {blockers.length > 0 ? (
                <div className="notice-warning text-[12px]">
                  <p className="font-semibold">Still needed for submission</p>
                  <p className="mt-1">{blockers.join(" · ")}</p>
                </div>
              ) : (
                <div className="notice-success text-[12px]">
                  All review requirements are present. You can submit this opportunity.
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#00621c]"
                />
                <span className="text-[11.5px] leading-relaxed text-muted">
                  I confirm the information is accurate and submit this opportunity for compliance
                  review.
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-[#fbfcf9] px-5 py-4 sm:px-7">
        {step > 0 && (
          <button
            type="button"
            onClick={() => {
              setStep((current) => current - 1);
            }}
            className="btn-ghost btn-sm"
            disabled={busy}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        )}

        <button type="button" onClick={saveDraft} className="btn-secondary btn-sm" disabled={busy}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save draft
        </button>

        <span className="ml-auto flex items-center gap-2">
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn-primary btn-sm" disabled={busy}>
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="btn-primary btn-sm"
              disabled={busy}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Submit for review
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
