import { expect, test } from "bun:test";
import { competitionRanks, rankChange } from "../src/lib/ranking";

test("ties share a rank and the next rank skips", () => {
  expect(competitionRanks([5, 9, 5, 1])).toEqual([2, 1, 2, 4]);
});

test("rank change is positive when moving up", () => {
  expect(rankChange(3, 8, 0.5)).toBe(5);
  expect(rankChange(8, 3, 0.5)).toBe(-5);
});

test("rank change is null without a share a year earlier", () => {
  expect(rankChange(3, 90, 0)).toBeNull();
});
