/**
 * Money utilities. Every amount in ShareUp is an integer number of kobo.
 * Never use floating point for a monetary value that reaches persistence.
 */
export const KOBO_PER_NAIRA = 100;
export const BPS_DENOMINATOR = 10_000;

export function assertInteger(value: number, label = "amount"): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer minor unit, received ${value}`);
  }
  return value;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * KOBO_PER_NAIRA);
}

export function koboToNaira(kobo: number): number {
  return kobo / KOBO_PER_NAIRA;
}

/** Parse a user-entered naira string ("80,000", "₦80 000.50") into kobo. */
export function parseNairaInput(input: string | null | undefined): number | null {
  if (!input) return null;
  const cleaned = input.replace(/[₦,\s]/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const kobo = Number(whole) * KOBO_PER_NAIRA + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(kobo) ? kobo : null;
}

export function parseIntegerInput(input: string | null | undefined): number | null {
  if (!input) return null;
  const cleaned = input.replace(/[,\s]/g, "").trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isSafeInteger(value) ? value : null;
}

/** Display full naira amounts, dropping kobo when the amount is whole. */
export function formatKobo(kobo: number | null | undefined): string {
  if (kobo === null || kobo === undefined || Number.isNaN(kobo)) return "₦0";
  const sign = kobo < 0 ? "-" : "";
  const abs = Math.abs(Math.round(kobo));
  const naira = Math.floor(abs / KOBO_PER_NAIRA);
  const koboPart = abs % KOBO_PER_NAIRA;
  const main = naira.toLocaleString("en-NG");
  return koboPart === 0
    ? `${sign}₦${main}`
    : `${sign}₦${main}.${String(koboPart).padStart(2, "0")}`;
}

/** Compact display for cards: ₦8.0M, ₦150,000, ₦25k. */
export function formatKoboCompact(kobo: number | null | undefined): string {
  if (!kobo) return "₦0";
  const naira = kobo / KOBO_PER_NAIRA;
  if (naira >= 1_000_000_000) return `₦${trim(naira / 1_000_000_000)}B`;
  if (naira >= 1_000_000) return `₦${trim(naira / 1_000_000)}M`;
  if (naira >= 10_000) return `₦${trim(naira / 1_000)}k`;
  return formatKobo(kobo);
}

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

/** Whole percentage of a target that has been committed (0–100). */
export function fundingPercent(committed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.floor((committed * 100) / target)));
}

export function bps(percent: number): number {
  return Math.round(percent * 100);
}

/** Fee calculation always rounds down in the platform's favour of the participant. */
export function applyBps(amount: number, basisPoints: number): number {
  assertInteger(amount);
  assertInteger(basisPoints, "basisPoints");
  return Math.floor((amount * basisPoints) / BPS_DENOMINATOR);
}

export function unitsShareBps(units: number, totalUnits: number): number {
  if (totalUnits <= 0) return 0;
  return Math.floor((units * BPS_DENOMINATOR) / totalUnits);
}

export function formatUnits(units: number, unitsPerPackage: number | null | undefined): string {
  if (unitsPerPackage && unitsPerPackage > 0) {
    const packages = units / unitsPerPackage;
    const formatted = Number.isInteger(packages) ? packages.toString() : packages.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${formatted}`;
  }
  return units.toLocaleString("en-NG");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function daysLeft(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000));
}
