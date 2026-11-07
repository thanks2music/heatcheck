/**
 * Standard competition ranking ("1224"): higher values rank first, equal values
 * share a rank, and the next rank skips the tied places.
 */
export function competitionRanks(values: readonly number[]): number[] {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value);
  const ranks = new Array<number>(values.length);
  order.forEach((entry, position) => {
    const previous = order[position - 1];
    ranks[entry.index] =
      previous && previous.value === entry.value ? (ranks[previous.index] as number) : position + 1;
  });
  return ranks;
}

/**
 * Places moved since an earlier ranking: positive means moved up. Returns null
 * when the framework had no share back then, so "moved up from nowhere" is not
 * shown as a large jump.
 */
export function rankChange(rankNow: number, rankBefore: number, shareBefore: number): number | null {
  return shareBefore > 0 ? rankBefore - rankNow : null;
}
