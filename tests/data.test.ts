import { describe, expect, test } from "bun:test";
import { categories } from "../data/categories";
import { frameworkListSchema, frameworks } from "../data/frameworks";
import { derive, firstMonth } from "../scripts/derive";
import { mergeWeeks } from "../scripts/update-data";
import type { WeekRow } from "../src/lib/series";

describe("frameworks list", () => {
  test("the shipped list is valid and covers every category", () => {
    expect(frameworks.length).toBeGreaterThanOrEqual(90);
    const used = new Set(frameworks.map((framework) => framework.category));
    expect(used.size).toBe(categories.length);
  });

  test("duplicate ids and repositories are rejected", () => {
    const entry = { id: "a", name: "A", category: "frontend", repos: ["o/a"] } as const;
    expect(() => frameworkListSchema.parse([entry, entry])).toThrow(/duplicate id a/);
    expect(() => frameworkListSchema.parse([entry, { ...entry, id: "b", repos: ["O/A"] }])).toThrow(
      /duplicate repo/,
    );
  });

  test("malformed entries are rejected", () => {
    const base = { id: "a", name: "A", category: "frontend", repos: ["o/a"] };
    expect(() => frameworkListSchema.parse([{ ...base, repos: ["no-slash"] }])).toThrow();
    expect(() => frameworkListSchema.parse([{ ...base, id: "Not Kebab" }])).toThrow();
    expect(() => frameworkListSchema.parse([{ ...base, mirror: "yes" }])).toThrow();
  });
});

describe("mergeWeeks", () => {
  test("fetched weeks overwrite stored ones and the result is sorted", () => {
    const stored: WeekRow[] = [
      [100, 1, 1, 1, 1, 1, 1, 1],
      [200, 2, 2, 2, 2, 2, 2, 2],
    ];
    const fetched: Parameters<typeof mergeWeeks>[1] = [
      { week: 300, total: 7, days: [1, 1, 1, 1, 1, 1, 1] },
      { week: 200, total: 0, days: [0, 0, 0, 0, 0, 0, 0] },
    ];
    expect(mergeWeeks(stored, fetched)).toEqual([
      [100, 1, 1, 1, 1, 1, 1, 1],
      [200, 0, 0, 0, 0, 0, 0, 0],
      [300, 1, 1, 1, 1, 1, 1, 1],
    ]);
  });
});

describe("derive (on the committed data)", () => {
  const data = derive(new Date("2026-11-07T15:00:00Z"));

  test("months run from 2015-01 to the month before the fetch", () => {
    expect(data.months[0]).toBe(firstMonth);
    expect(data.months.at(-1)).toBe("2026-10");
    for (const framework of data.frameworks) {
      expect(framework.share).toHaveLength(data.months.length);
      expect(framework.stars).toHaveLength(data.months.length);
    }
  });

  test("shares in the last month add up to 100", () => {
    const total = data.frameworks.reduce((sum, framework) => sum + (framework.share.at(-1) ?? 0), 0);
    expect(total).toBeCloseTo(100, 1);
  });

  test("frameworks are sorted by rank", () => {
    const ranks = data.frameworks.map((framework) => framework.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(ranks[0]).toBe(1);
  });
});
