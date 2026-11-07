/** "2026-10" → "Oct 2026". */
export function formatMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(year, mon - 1)).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Percentages with two decimals below 10%, one above. */
export function formatShare(share: number): string {
  return `${share.toFixed(share >= 10 ? 1 : 2)}%`;
}
