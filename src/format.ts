import { monthIndex } from "./lib/series";

// Built once: toLocaleString with options creates a new formatter per call.
const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-10" → "Oct 2026". */
export function formatMonth(month: string): string {
  const index = monthIndex(month);
  return monthFormat.format(Date.UTC(Math.floor(index / 12), index % 12));
}

/** Percentages with two decimals below 10%, one above. */
export function formatShare(share: number): string {
  return `${share.toFixed(share >= 10 ? 1 : 2)}%`;
}
