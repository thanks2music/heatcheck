import { expect, test } from "bun:test";
import { isStale, monthsBehind } from "../src/lib/freshness";
import { parseUrlState, serializeUrlState, type UrlState } from "../src/lib/url-state";

const known = new Set(["react", "vue", "django"]);
const defaults = ["react", "vue"];

test("a state survives a round trip through the query string", () => {
  const state: UrlState = { selected: ["django", "react"], scale: "log", category: "backend" };
  const query = serializeUrlState(state, defaults);
  expect(query).toBe("?f=django,react&scale=log&cat=backend");
  expect(parseUrlState(query, known)).toEqual(state);
});

test("default values are left out", () => {
  expect(serializeUrlState({ selected: defaults, scale: "linear", category: "all" }, defaults)).toBe("");
});

test("an empty selection is kept", () => {
  const query = serializeUrlState({ selected: [], scale: "linear", category: "all" }, defaults);
  expect(query).toBe("?f=");
  expect(parseUrlState(query, known).selected).toEqual([]);
});

test("unknown ids, duplicates and bad values are dropped", () => {
  expect(parseUrlState("?f=react,nope,react,vue&scale=huge&cat=games", known)).toEqual({
    selected: ["react", "vue"],
  });
});

test("data counts as stale three months after its last month", () => {
  expect(monthsBehind("2026-10", new Date("2026-11-03T00:00:00Z"))).toBe(1);
  expect(isStale("2026-10", new Date("2026-12-31T23:00:00Z"))).toBe(false);
  expect(isStale("2026-10", new Date("2027-01-01T00:00:00Z"))).toBe(true);
});
