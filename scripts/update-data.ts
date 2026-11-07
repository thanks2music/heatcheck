// Downloads weekly star history for every repository in data/frameworks.ts
// and stores it in data/stars/.
//
// Source: GET /repos/{owner}/{repo}/stargazers/history
// https://docs.github.com/en/rest/activity/starring?apiVersion=2026-03-10#get-repository-star-history
// Each page holds up to 30 weeks, newest first, and pages walk back to the
// week the repository was created.
//
// For repositories that already have data, pages are fetched back to the
// newest stored week (one page in a monthly run) and overwrite the stored
// weeks. Repositories without data, or every repository with --full, are
// fetched back to creation. Removed stars disappear from GitHub's history too, so older weeks
// drift slightly until the next --full run.
//
// Usage: bun run update-data [--full]
// Set GH_TOKEN (or GITHUB_TOKEN) to raise the rate limit from 60 requests an hour.

import { z } from "zod";
import { frameworks } from "../data/frameworks";
import type { WeekRow } from "../src/lib/series";
import { orphanedStarsFiles, readStarsFile, writeFetchedAt, writeStarsFile } from "./stars-store";

const apiVersion = "2026-03-10";
const perPage = 30;
const maxPages = 100;
const maxAttempts = 3;

const weekSchema = z
  .object({
    week: z.number().int(),
    total: z.number().int().nonnegative(),
    days: z.array(z.number().int().nonnegative()).length(7),
  })
  .refine((week) => week.days.reduce((sum, count) => sum + count, 0) === week.total, {
    message: "total does not equal the sum of days",
  });
const pageSchema = z.array(weekSchema).max(perPage);
type Week = z.infer<typeof weekSchema>;

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

async function fetchPage(repo: string, page: number): Promise<Week[]> {
  const url = `https://api.github.com/repos/${repo}/stargazers/history?per_page=${perPage}&page=${page}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": apiVersion,
    "User-Agent": "heatcheck-update-data",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  for (let attempt = 1; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await Bun.sleep(2 ** attempt * 1000);
      continue;
    }
    if (response.ok) {
      return pageSchema.parse(await response.json());
    }
    const body = (await response.text()).slice(0, 300);
    if (response.headers.get("x-ratelimit-remaining") === "0") {
      // The primary limit resets on the hour; stop instead of waiting that long.
      const reset = new Date(Number(response.headers.get("x-ratelimit-reset")) * 1000);
      throw new Error(
        `Rate limit exhausted at ${repo} page ${page}; resets at ${reset.toISOString()}.` +
          (token ? "" : " Set GH_TOKEN to raise the limit."),
      );
    }
    const waitSeconds = retryDelaySeconds(response, body, attempt);
    if (waitSeconds === undefined || attempt === maxAttempts) {
      throw new Error(`${repo} page ${page}: HTTP ${response.status} ${body}`);
    }
    await Bun.sleep(waitSeconds * 1000);
  }
}

/**
 * How long to wait before retrying, per GitHub's guidance on rate limit
 * errors: honor `retry-after`, otherwise wait at least a minute for a
 * secondary rate limit. Server errors back off briefly. Undefined means the
 * error will not go away by retrying.
 * https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api#handle-rate-limit-errors-appropriately
 */
function retryDelaySeconds(response: Response, body: string, attempt: number): number | undefined {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (retryAfter > 0) return retryAfter;
  if (response.status === 429 || (response.status === 403 && /rate limit/i.test(body))) return 60;
  if (response.status >= 500) return 2 ** attempt;
  return undefined;
}

/**
 * Newest-first weeks. Pages back until a page reaches `untilWeek` (the newest
 * stored week), or to the repository's creation when `untilWeek` is undefined.
 */
async function fetchWeeks(repo: string, untilWeek: number | undefined): Promise<Week[]> {
  const weeks: Week[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = await fetchPage(repo, page);
    weeks.push(...batch);
    const oldest = batch.at(-1)?.week;
    if (batch.length < perPage || (untilWeek !== undefined && oldest !== undefined && oldest <= untilWeek)) {
      return weeks;
    }
  }
  throw new Error(`${repo} has more than ${maxPages * perPage} weeks of history`);
}

export function mergeWeeks(stored: readonly WeekRow[], fetched: readonly Week[]): WeekRow[] {
  const byWeek = new Map<number, WeekRow>(stored.map((row) => [row[0], row]));
  for (const { week, days } of fetched) {
    byWeek.set(week, [week, ...days] as unknown as WeekRow);
  }
  return [...byWeek.values()].sort((a, b) => a[0] - b[0]);
}

async function updateRepo(repo: string, full: boolean): Promise<string> {
  const stored = full ? undefined : readStarsFile(repo);
  const fetched = await fetchWeeks(repo, stored?.weeks.at(-1)?.[0]);
  const weeks = mergeWeeks(stored?.weeks ?? [], fetched);
  writeStarsFile({ repo, weeks });
  const total = weeks.reduce((sum, row) => sum + row.slice(1).reduce((a, b) => a + b, 0), 0);
  return `${repo}: fetched ${fetched.length} weeks${stored ? "" : " (full history)"}, ${total} stars stored`;
}

async function main() {
  const full = process.argv.includes("--full");
  const repos = frameworks.flatMap((framework) => framework.repos);
  console.log(
    `Updating ${repos.length} repositories${full ? " (full history)" : ""}${token ? "" : " without a token"}`,
  );

  // One request at a time: GitHub asks clients to "make requests serially
  // instead of concurrently" to stay clear of secondary rate limits.
  const failures: string[] = [];
  for (const repo of repos) {
    try {
      console.log(`  ${await updateRepo(repo, full)}`);
    } catch (error) {
      failures.push(`${repo}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length) {
    throw new Error(`Failed to update ${failures.length} repositories:\n${failures.join("\n")}`);
  }
  writeFetchedAt(new Date());
  for (const path of orphanedStarsFiles(repos)) {
    console.warn(`Not in data/frameworks.ts, delete if no longer needed: ${path}`);
  }
}

if (import.meta.main) {
  await main();
}
