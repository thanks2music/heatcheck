// Turns data/stars/ into src/generated/series.json, the only data the site loads.
//
// For each framework: sum its repositories' new stars per calendar month, take
// the median of the last 3 months, and express it as a share of the sum of
// those medians across all listed frameworks. Months run from 2015-01 to the
// last month that was complete when the data was fetched.
//
// Usage: bun run derive (run automatically by `dev` and `build`)

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { frameworks } from "../data/frameworks";
import { competitionRanks, rankChange } from "../src/lib/ranking";
import {
  addMonths,
  columnShares,
  monthlyTotals,
  monthOf,
  monthRange,
  trailingMedian,
} from "../src/lib/series";
import type { FrameworkSeries, SeriesData } from "../src/lib/types";
import { readFetchedAt, readStarsFile } from "./stars-store";

export const firstMonth = "2015-01";
const windowMonths = 3;
const rankChangeMonths = 12;
const outputPath = join(import.meta.dir, "../src/generated/series.json");

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function derive(fetchedAt: Date): SeriesData {
  const lastMonth = addMonths(monthOf(fetchedAt), -1);
  // Start early enough that the first displayed month has a full window.
  const months = monthRange(addMonths(firstMonth, -(windowMonths - 1)), lastMonth);

  const medians = frameworks.map((framework) => {
    const monthly = months.map(() => 0);
    for (const repo of framework.repos) {
      const stored = readStarsFile(repo);
      if (!stored) throw new Error(`No star data for ${repo}. Run bun run update-data.`);
      const totals = monthlyTotals(stored.weeks);
      months.forEach((month, index) => {
        monthly[index] = (monthly[index] ?? 0) + (totals.get(month) ?? 0);
      });
    }
    return trailingMedian(monthly, windowMonths).slice(windowMonths - 1);
  });
  const shares = columnShares(medians);
  const shownMonths = months.slice(windowMonths - 1);
  const last = shownMonths.length - 1;
  const yearAgo = last - rankChangeMonths;

  const ranksNow = competitionRanks(shares.map((share) => share[last] ?? 0));
  const ranksBefore = competitionRanks(shares.map((share) => share[yearAgo] ?? 0));

  const series: FrameworkSeries[] = frameworks.map((framework, index) => {
    const share = shares[index] ?? [];
    return {
      id: framework.id,
      name: framework.name,
      category: framework.category,
      repo: framework.repos[0] as string,
      ...(framework.mirror ? { mirror: true } : {}),
      ...(framework.note ? { note: framework.note } : {}),
      share: share.map((value) => round(value, 3)),
      stars: (medians[index] ?? []).map((value) => Math.round(value)),
      rank: ranksNow[index] as number,
      rankChange: rankChange(ranksNow[index] as number, ranksBefore[index] as number, share[yearAgo] ?? 0),
    };
  });
  series.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

  return { months: shownMonths, fetchedAt: fetchedAt.toISOString(), frameworks: series };
}

if (import.meta.main) {
  const data = derive(readFetchedAt());
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(data));
  const top = data.frameworks.slice(0, 10).map((f) => `${f.rank}. ${f.name} ${f.share.at(-1)}%`);
  console.log(`Wrote ${data.frameworks.length} frameworks, ${data.months[0]} to ${data.months.at(-1)}`);
  console.log(`Top 10: ${top.join(", ")}`);
}
