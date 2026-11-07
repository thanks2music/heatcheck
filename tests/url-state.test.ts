import { expect, test } from "bun:test";
import { isStale, monthsBehind } from "../src/lib/freshness";
import { slotsFromIds } from "../src/lib/selection";
import { parseUrlState, serializeUrlState, type UrlState } from "../src/lib/url-state";

const known = new Set(["react", "vue", "django"]);
const defaults = slotsFromIds(["react", "vue"]);

test("a state survives a round trip through the query string", () => {
  const state: UrlState = { slots: slotsFromIds(["django", "react"]), scale: "log", category: "backend" };
  const query = serializeUrlState(state, defaults);
  expect(query).toBe("?f=django,react&scale=log&cat=backend");
  expect(parseUrlState(query, known)).toEqual(state);
});

test("free slots are kept so colors survive a reload", () => {
  const slots = slotsFromIds([null, "vue", "react"]);
  const query = serializeUrlState({ slots, scale: "linear", category: "all" }, defaults);
  expect(query).toBe("?f=,vue,react");
  expect(parseUrlState(query, known).slots).toEqual(slots);
});

test("default values are left out", () => {
  expect(serializeUrlState({ slots: defaults, scale: "linear", category: "all" }, defaults)).toBe("");
});

test("an empty selection is kept", () => {
  const query = serializeUrlState({ slots: slotsFromIds([]), scale: "linear", category: "all" }, defaults);
  expect(query).toBe("?f=");
  expect(parseUrlState(query, known).slots).toEqual(slotsFromIds([]));
});

test("unknown ids and duplicates free their slots, and bad values are dropped", () => {
  expect(parseUrlState("?f=react,nope,react,vue&scale=huge&cat=games", known)).toEqual({
    slots: slotsFromIds(["react", null, null, "vue"]),
  });
});

test("a link with only unknown ids falls back to the default selection", () => {
  expect(parseUrlState("?f=renamed,removed", known)).toEqual({});
});

test("data counts as stale three months after its last month", () => {
  expect(monthsBehind("2026-10", new Date("2026-11-03T00:00:00Z"))).toBe(1);
  expect(isStale("2026-10", new Date("2026-12-31T23:00:00Z"))).toBe(false);
  expect(isStale("2026-10", new Date("2027-01-01T00:00:00Z"))).toBe(true);
});
