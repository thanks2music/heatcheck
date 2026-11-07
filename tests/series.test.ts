import { describe, expect, test } from "bun:test";
import {
  addMonths,
  columnShares,
  monthIndex,
  monthlyTotals,
  monthOf,
  monthRange,
  trailingMedian,
  type WeekRow,
} from "../src/lib/series";

const utc = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 1000;

describe("months", () => {
  test("monthOf uses UTC", () => {
    expect(monthOf(new Date("2026-10-31T23:59:59Z"))).toBe("2026-10");
    expect(monthOf(new Date("2026-11-01T00:00:00Z"))).toBe("2026-11");
  });

  test("addMonths rolls over years both ways", () => {
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2015-01", -2)).toBe("2014-11");
  });

  test("monthIndex makes month arithmetic a subtraction", () => {
    expect(monthIndex("2027-01") - monthIndex("2026-10")).toBe(3);
  });

  test("monthRange is inclusive", () => {
    expect(monthRange("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(monthRange("2026-03", "2026-03")).toEqual(["2026-03"]);
  });
});

describe("monthlyTotals", () => {
  test("splits a week that crosses a month boundary by day", () => {
    // Sunday 2026-09-27 to Saturday 2026-10-03: four days in September, three in October.
    const week: WeekRow = [utc("2026-09-27"), 1, 2, 3, 4, 10, 20, 30];
    const totals = monthlyTotals([week]);
    expect(totals.get("2026-09")).toBe(10);
    expect(totals.get("2026-10")).toBe(60);
  });

  test("assigns days by midday when week starts are offset from UTC midnight", () => {
    // A week that starts at 07:00 UTC (midnight Pacific time) on Sunday 2026-11-01.
    const week: WeekRow = [utc("2026-11-01") + 7 * 3600, 5, 0, 0, 0, 0, 0, 0];
    expect(monthlyTotals([week]).get("2026-11")).toBe(5);
  });

  test("adds up several weeks", () => {
    const weeks: WeekRow[] = [
      [utc("2026-10-04"), 1, 1, 1, 1, 1, 1, 1],
      [utc("2026-10-11"), 2, 2, 2, 2, 2, 2, 2],
    ];
    expect(monthlyTotals(weeks).get("2026-10")).toBe(21);
  });
});

describe("trailingMedian", () => {
  test("ignores a one-month burst", () => {
    expect(trailingMedian([10, 12, 500, 11, 13], 3)).toEqual([10, 11, 12, 12, 13]);
  });

  test("uses the available values at the start", () => {
    expect(trailingMedian([4, 8], 3)).toEqual([4, 6]);
  });
});

describe("columnShares", () => {
  test("each column adds up to 100", () => {
    const shares = columnShares([
      [1, 3],
      [3, 1],
    ]);
    expect(shares).toEqual([
      [25, 75],
      [75, 25],
    ]);
  });

  test("an empty column stays at zero", () => {
    expect(columnShares([[0], [0]])).toEqual([[0], [0]]);
  });
});
