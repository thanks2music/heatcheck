// Pure helpers that turn weekly star history into monthly shares.

/** [weekStart (Unix seconds), Sunday, Monday, ..., Saturday] star counts. */
export type WeekRow = readonly [number, number, number, number, number, number, number, number];

const daySeconds = 86_400;

/** "YYYY-MM" for a date, in UTC. */
export function monthOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Months since year 0 for "YYYY-MM", so month arithmetic is plain subtraction. */
export function monthIndex(month: string): number {
  const [year, mon] = month.split("-").map(Number) as [number, number];
  return year * 12 + mon - 1;
}

export function addMonths(month: string, count: number): string {
  const index = monthIndex(month) + count;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Inclusive list of months from `from` to `to`. */
export function monthRange(from: string, to: string): string[] {
  const months: string[] = [];
  for (let month = from; month <= to; month = addMonths(month, 1)) {
    months.push(month);
  }
  return months;
}

/**
 * Sums daily stars into calendar months. GitHub does not promise that week and
 * day boundaries align with UTC, so each day is assigned by its midday.
 */
export function monthlyTotals(weeks: readonly WeekRow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const [weekStart, ...days] of weeks) {
    days.forEach((count, index) => {
      if (count === 0) return;
      const midday = new Date((weekStart + index * daySeconds + daySeconds / 2) * 1000);
      const month = monthOf(midday);
      totals.set(month, (totals.get(month) ?? 0) + count);
    });
  }
  return totals;
}

/**
 * Trailing median over `window` entries (fewer at the start). A median ignores
 * a single month of burst starring, which an average would carry for the
 * whole window.
 */
export function trailingMedian(values: readonly number[], window: number): number[] {
  return values.map((_, index) => {
    const sorted = values.slice(Math.max(0, index - window + 1), index + 1).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? (sorted[middle] as number)
      : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
  });
}

/** Turns rows of values (one row per series) into percentages of each column's total. */
export function columnShares(rows: readonly (readonly number[])[]): number[][] {
  const width = rows[0]?.length ?? 0;
  const totals = Array.from({ length: width }, (_, column) =>
    rows.reduce((sum, row) => sum + (row[column] ?? 0), 0),
  );
  return rows.map((row) =>
    row.map((value, column) => {
      const total = totals[column] ?? 0;
      return total > 0 ? (100 * value) / total : 0;
    }),
  );
}
