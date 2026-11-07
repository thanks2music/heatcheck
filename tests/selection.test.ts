import { expect, test } from "bun:test";
import { slotStyle } from "../src/lib/colors";
import { maxSelected, selectedIds, slotsFromIds, toggleSlot } from "../src/lib/selection";

const ids = (count: number) => Array.from({ length: count }, (_, index) => `f${index}`);

test("slotsFromIds dedupes and caps at the maximum", () => {
  const slots = slotsFromIds([...ids(12), "f0"]);
  expect(slots).toHaveLength(maxSelected);
  expect(selectedIds(slots)).toEqual(ids(10));
});

test("deselecting frees the slot without moving the others", () => {
  const { slots } = toggleSlot(slotsFromIds(["a", "b", "c"]), "b");
  expect(slots.slice(0, 3)).toEqual(["a", null, "c"]);
});

test("a new selection takes the lowest free slot", () => {
  const freed = toggleSlot(slotsFromIds(["a", "b", "c"]), "a").slots;
  expect(toggleSlot(freed, "d").slots.slice(0, 3)).toEqual(["d", "b", "c"]);
});

test("an eleventh selection is refused", () => {
  const full = slotsFromIds(ids(10));
  const result = toggleSlot(full, "extra");
  expect(result.full).toBe(true);
  expect(result.slots).toBe(full);
});

test("slots 9 and 10 reuse the first two colors with a dashed line", () => {
  expect(slotStyle(0)).toEqual({ color: "#3987e5", dashed: false });
  expect(slotStyle(7).dashed).toBe(false);
  expect(slotStyle(8)).toEqual({ color: slotStyle(0).color, dashed: true });
  expect(slotStyle(9)).toEqual({ color: slotStyle(1).color, dashed: true });
});
