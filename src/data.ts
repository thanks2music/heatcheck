import raw from "./generated/series.json" with { type: "json" };
import type { SeriesData } from "./lib/types";

/** Written by scripts/derive.ts; frameworks are sorted by rank. */
export const seriesData = raw as unknown as SeriesData;
