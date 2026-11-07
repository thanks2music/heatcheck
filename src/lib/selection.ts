// The chart shows up to ten frameworks. Each selected framework holds a slot,
// and the slot decides its color, so removing one never repaints the others.

export const maxSelected = 10;

/** Framework ids by slot; null is a free slot. Always `maxSelected` long. */
export type Slots = readonly (string | null)[];

export function slotsFromIds(ids: readonly string[]): Slots {
  const unique = [...new Set(ids)].slice(0, maxSelected);
  return Array.from({ length: maxSelected }, (_, index) => unique[index] ?? null);
}

export function selectedIds(slots: Slots): string[] {
  return slots.filter((id): id is string => id !== null);
}

/**
 * Selects or deselects a framework. A new selection takes the lowest free
 * slot; `full` is true when every slot is taken and nothing changed.
 */
export function toggleSlot(slots: Slots, id: string): { slots: Slots; full: boolean } {
  const current = slots.indexOf(id);
  if (current !== -1) {
    return { slots: slots.map((slot, index) => (index === current ? null : slot)), full: false };
  }
  const free = slots.indexOf(null);
  if (free === -1) return { slots, full: true };
  return { slots: slots.map((slot, index) => (index === free ? id : slot)), full: false };
}
