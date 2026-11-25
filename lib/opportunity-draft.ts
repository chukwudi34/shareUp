import type { Opportunity } from "./types";
import { formatKobo, parseIntegerInput, parseNairaInput, KOBO_PER_NAIRA } from "./money";

export type AcquisitionModel = "COLLECTIVE_PURCHASE" | "MANAGED_ASSET";
export type ParticipationMethod = "AMOUNT" | "UNITS";

/** Form state for the guided opportunity flow. Money/quantity stay as input strings. */
export interface DraftFormValues {
  model: AcquisitionModel;
  title: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  coverImage: string;
  supplierName: string;
  supplierContact: string;
  quantityLabel: string;
  targetQuantity: string;
  unitPrice: string;
  totalUnits: string;
  unitsPerPackage: string;
  packageLabel: string;
  participationMethod: ParticipationMethod;
  targetAmount: string;
  minContribution: string;
  maxContribution: string;
  minUnits: string;
  maxUnits: string;
  maxParticipants: string;
  fundingDeadline: string;
  expectedAcquisitionDate: string;
  estimatedDeliveryDate: string;
  allowsPartialFunding: boolean;
  allowsOverfunding: boolean;
  allowCancellation: boolean;
  waitingListEnabled: boolean;
  legalStructure: string;
  ownershipType: string;
  riskNotes: string;
  acquisitionConditions: string;
}

export interface OpportunityDraftInput {
  title: string;
  summary?: string;
  description?: string;
  coverImage?: string;
  category?: string;
  location?: string;
  model: AcquisitionModel;
  supplierName?: string;
  supplierContact?: string;
  targetAmount: number;
  targetQuantity?: number;
  quantityLabel?: string;
  unitPrice?: number;
  totalUnits?: number;
  unitsPerPackage?: number;
  packageLabel?: string;
  participationMethod: ParticipationMethod;
  minContribution?: number;
  maxContribution?: number;
  minUnits?: number;
  maxUnits?: number;
  maxParticipants?: number;
  fundingDeadline?: string;
  expectedAcquisitionDate?: string;
  estimatedDeliveryDate?: string;
  allowsPartialFunding?: boolean;
  allowsOverfunding?: boolean;
  allowCancellation?: boolean;
  waitingListEnabled?: boolean;
  legalStructure?: string;
  ownershipType?: string;
  riskNotes?: string;
  acquisitionConditions?: string;
}

export const CATEGORIES = [
  "Agriculture",
  "Commodities",
  "Real Estate",
  "Equipment",
  "Energy",
  "Logistics",
  "Food & Beverage",
  "Retail",
];

export const COVER_OPTIONS = [
  { src: "/images/cover-rice-bags.webp", label: "Commodities" },
  { src: "/images/cover-produce.webp", label: "Agriculture" },
  { src: "/images/cover-farmland.webp", label: "Farmland" },
  { src: "/images/cover-property.webp", label: "Property" },
  { src: "/images/cover-solar.webp", label: "Energy" },
  { src: "/images/cover-warehouse.webp", label: "Warehouse" },
];

export const LEGAL_STRUCTURES = [
  { value: "DIRECT_CO_OWNERSHIP", label: "Direct co-ownership" },
  { value: "BENEFICIAL", label: "Beneficial ownership via a legal vehicle" },
  { value: "CONTRACTUAL_ECONOMIC", label: "Contractual economic interest" },
];

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function defaultDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function emptyDraft(): DraftFormValues {
  return {
    model: "COLLECTIVE_PURCHASE",
    title: "",
    summary: "",
    description: "",
    category: "Agriculture",
    location: "",
    coverImage: COVER_OPTIONS[0].src,
    supplierName: "",
    supplierContact: "",
    quantityLabel: "",
    targetQuantity: "",
    unitPrice: "",
    totalUnits: "",
    unitsPerPackage: "",
    packageLabel: "",
    participationMethod: "AMOUNT",
    targetAmount: "",
    minContribution: "",
    maxContribution: "",
    minUnits: "",
    maxUnits: "",
    maxParticipants: "",
    fundingDeadline: defaultDeadline(),
    expectedAcquisitionDate: "",
    estimatedDeliveryDate: "",
    allowsPartialFunding: false,
    allowsOverfunding: false,
    allowCancellation: true,
    waitingListEnabled: true,
    legalStructure: "DIRECT_CO_OWNERSHIP",
    ownershipType: "DIRECT_CO_OWNERSHIP",
    riskNotes: "",
    acquisitionConditions: "",
  };
}

export function draftFromOpportunity(opportunity: Opportunity): DraftFormValues {
  const base = emptyDraft();
  const details = opportunity as Opportunity & {
    allowsOverfunding?: boolean;
    waitingListEnabled?: boolean;
    maxUnits?: number | null;
  };

  return {
    ...base,
    model: opportunity.model,
    title: opportunity.title,
    summary: opportunity.summary ?? "",
    description: opportunity.description ?? "",
    category: opportunity.category,
    location: opportunity.location ?? "",
    coverImage: opportunity.coverImage || base.coverImage,
    supplierName: opportunity.supplierName ?? "",
    supplierContact: opportunity.supplierContact ?? "",
    quantityLabel: opportunity.quantityLabel ?? "",
    targetQuantity: opportunity.targetQuantity ? String(opportunity.targetQuantity) : "",
    unitPrice: opportunity.unitPrice ? String(opportunity.unitPrice / KOBO_PER_NAIRA) : "",
    totalUnits: opportunity.totalUnits ? String(opportunity.totalUnits) : "",
    unitsPerPackage: opportunity.unitsPerPackage ? String(opportunity.unitsPerPackage) : "",
    packageLabel: opportunity.packageLabel ?? "",
    participationMethod: opportunity.participationMethod,
    targetAmount: String(opportunity.targetAmount / KOBO_PER_NAIRA),
    minContribution: String(opportunity.minContribution / KOBO_PER_NAIRA),
    maxContribution: opportunity.maxContribution
      ? String(opportunity.maxContribution / KOBO_PER_NAIRA)
      : "",
    minUnits: opportunity.minUnits ? String(opportunity.minUnits) : "",
    maxUnits: details.maxUnits ? String(details.maxUnits) : "",
    maxParticipants: opportunity.maxParticipants ? String(opportunity.maxParticipants) : "",
    fundingDeadline: toDateInput(opportunity.fundingDeadline) || defaultDeadline(),
    expectedAcquisitionDate: toDateInput(opportunity.expectedAcquisitionDate),
    estimatedDeliveryDate: toDateInput(opportunity.estimatedDeliveryDate),
    allowsPartialFunding: opportunity.allowsPartialFunding,
    allowsOverfunding: Boolean(details.allowsOverfunding),
    allowCancellation: opportunity.allowCancellation,
    waitingListEnabled: Boolean(details.waitingListEnabled),
    legalStructure: opportunity.legalStructure ?? base.legalStructure,
    ownershipType: opportunity.ownershipType ?? base.ownershipType,
    riskNotes: opportunity.riskNotes ?? "",
    acquisitionConditions: opportunity.acquisitionConditions ?? "",
  };
}

/** Convert the form to the API payload. Returns a message when a required value is invalid. */
export function buildDraftPayload(
  form: DraftFormValues
): { payload: OpportunityDraftInput; error?: never } | { payload?: never; error: string } {
  const targetAmount = parseNairaInput(form.targetAmount);
  if (!targetAmount) {
    return { error: "Enter the acquisition target amount in naira." };
  }

  const minContribution = form.minContribution ? parseNairaInput(form.minContribution) : null;
  if (form.minContribution && !minContribution) {
    return { error: "The minimum contribution must be a valid naira amount." };
  }

  const maxContribution = form.maxContribution ? parseNairaInput(form.maxContribution) : null;
  if (form.maxContribution && !maxContribution) {
    return { error: "The maximum contribution must be a valid naira amount." };
  }

  const unitPrice = form.unitPrice ? parseNairaInput(form.unitPrice) : null;
  if (form.unitPrice && !unitPrice) {
    return { error: "Price per unit must be a valid naira amount." };
  }

  const targetQuantity = form.targetQuantity ? parseIntegerInput(form.targetQuantity) : null;
  const totalUnits = form.totalUnits ? parseIntegerInput(form.totalUnits) : null;
  const minUnits = form.minUnits ? parseIntegerInput(form.minUnits) : null;
  const maxUnits = form.maxUnits ? parseIntegerInput(form.maxUnits) : null;
  const maxParticipants = form.maxParticipants ? parseIntegerInput(form.maxParticipants) : null;

  if (form.targetQuantity && !targetQuantity) return { error: "Enter a whole number of units to acquire." };
  if (form.totalUnits && !totalUnits) return { error: "Total units must be a whole number." };
  if (form.minUnits && !minUnits) return { error: "Minimum units must be a whole number." };
  if (form.maxUnits && !maxUnits) return { error: "Maximum units must be a whole number." };
  if (form.maxParticipants && !maxParticipants) {
    return { error: "Maximum participants must be a whole number." };
  }

  if (!form.fundingDeadline) {
    return { error: "Choose a funding deadline." };
  }

  if (new Date(`${form.fundingDeadline}T23:59:59`).getTime() <= Date.now()) {
    return { error: "The funding deadline must be in the future." };
  }

  const computedMin =
    minContribution ??
    (form.participationMethod === "UNITS" && unitPrice && minUnits
      ? unitPrice * minUnits
      : Math.max(10000, Math.floor(targetAmount / 10)));

  const payload: OpportunityDraftInput = {
    title: form.title.trim(),
    summary: form.summary.trim() || undefined,
    description: form.description.trim() || undefined,
    coverImage: form.coverImage,
    category: form.category,
    location: form.location.trim() || undefined,
    model: form.model,
    supplierName: form.supplierName.trim() || undefined,
    supplierContact: form.supplierContact.trim() || undefined,
    targetAmount,
    targetQuantity: targetQuantity ?? undefined,
    quantityLabel: form.quantityLabel.trim() || undefined,
    unitPrice: unitPrice ?? undefined,
    totalUnits: totalUnits ?? undefined,
    unitsPerPackage:
      form.unitsPerPackage ? (parseIntegerInput(form.unitsPerPackage) ?? undefined) : undefined,
    packageLabel: form.packageLabel.trim() || undefined,
    participationMethod: form.participationMethod,
    minContribution: computedMin,
    maxContribution: maxContribution ?? undefined,
    minUnits: minUnits ?? undefined,
    maxUnits: maxUnits ?? undefined,
    maxParticipants: maxParticipants ?? undefined,
    fundingDeadline: new Date(`${form.fundingDeadline}T12:00:00`).toISOString(),
    expectedAcquisitionDate: form.expectedAcquisitionDate
      ? new Date(`${form.expectedAcquisitionDate}T12:00:00`).toISOString()
      : undefined,
    estimatedDeliveryDate: form.estimatedDeliveryDate
      ? new Date(`${form.estimatedDeliveryDate}T12:00:00`).toISOString()
      : undefined,
    allowsPartialFunding: form.allowsPartialFunding,
    allowsOverfunding: form.allowsOverfunding,
    allowCancellation: form.allowCancellation,
    waitingListEnabled: form.waitingListEnabled,
    legalStructure: form.model === "MANAGED_ASSET" ? form.legalStructure : "CONTRACTUAL_ECONOMIC",
    ownershipType:
      form.model === "MANAGED_ASSET"
        ? form.ownershipType
        : form.participationMethod === "UNITS"
          ? "PHYSICAL_QUANTITY"
          : "CONTRACTUAL_ECONOMIC",
    riskNotes: form.riskNotes.trim() || undefined,
    acquisitionConditions: form.acquisitionConditions.trim() || undefined,
  };

  return { payload };
}

/** Missing requirements the API checks before an offer can enter review. */
export function submissionBlockers(form: DraftFormValues): string[] {
  const blockers: string[] = [];
  if (!form.title.trim()) blockers.push("Title");
  if (!form.summary.trim()) blockers.push("Short summary");
  if (!form.description.trim()) blockers.push("Full description");
  if (!form.coverImage) blockers.push("Cover image");
  if (!form.supplierName.trim()) blockers.push("Supplier name");
  if (!form.targetAmount.trim()) blockers.push("Target amount");
  if (!form.minContribution.trim()) blockers.push("Minimum contribution");
  if (!form.fundingDeadline) blockers.push("Funding deadline");
  if (!form.location.trim()) blockers.push("Location");
  if (!form.riskNotes.trim()) blockers.push("Risk information");
  if (!form.acquisitionConditions.trim()) blockers.push("Acquisition conditions");
  if (form.participationMethod === "UNITS" && (!form.unitPrice || !form.totalUnits || !form.minUnits)) {
    blockers.push("Unit price, total units and minimum units");
  }
  return blockers;
}

export function estimatedFee(targetAmount: string): { fee: number; net: number } | null {
  const amount = parseNairaInput(targetAmount);
  if (!amount) return null;
  const fee = Math.floor((amount * 350) / 10_000);
  return { fee, net: amount - fee };
}

export function formatNairaInput(value: number): string {
  return (value / KOBO_PER_NAIRA).toLocaleString("en-NG");
}

export { formatKobo };
