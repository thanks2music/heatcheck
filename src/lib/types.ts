import type { Category } from "../../data/categories";

/** The file scripts/derive.ts writes to src/generated/series.json. */
export interface SeriesData {
  /** "YYYY-MM", oldest first, ending with the last complete month before the data was fetched. */
  months: string[];
  /** ISO timestamp of the fetch the data came from. */
  fetchedAt: string;
  /** Sorted by rank. */
  frameworks: FrameworkSeries[];
}

export interface FrameworkSeries {
  id: string;
  name: string;
  category: Category;
  /** The first listed repository, used for the link. */
  repo: string;
  mirror?: boolean;
  note?: string;
  /** Per month: this framework's median of the last 3 months as a share (%) of all frameworks' medians. */
  share: number[];
  /** Per month: new stars, as the median of the last 3 months. */
  stars: number[];
  /** Rank by share in the last month. */
  rank: number;
  /** Places moved up since 12 months earlier, or null when it had no stars then. */
  rankChange: number | null;
}
