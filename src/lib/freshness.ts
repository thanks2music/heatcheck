// The update workflow runs early each month, so the newest month in the data is
// normally last month. GitHub disables scheduled workflows in a public
// repository after 60 days without activity; when that happens the data falls
// behind and the header says so.

import { monthIndex, monthOf } from "./series";

export const staleAfterMonths = 3;

/** Whole months from `lastMonth` ("YYYY-MM") to the month of `now` (UTC). */
export function monthsBehind(lastMonth: string, now: Date): number {
  return monthIndex(monthOf(now)) - monthIndex(lastMonth);
}

export function isStale(lastMonth: string, now: Date): boolean {
  return monthsBehind(lastMonth, now) >= staleAfterMonths;
}
