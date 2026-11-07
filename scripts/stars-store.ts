// Reads and writes the weekly star history kept in data/stars/.
// One file per repository: {"repo": "owner/name", "weeks": [[weekStart, sun, mon, ..., sat], ...]}
// with weeks in ascending order. Rows stay on one line each so monthly diffs are small.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

export const starsDir = join(import.meta.dir, "../data/stars");
const metaPath = join(starsDir, "_meta.json");

const count = z.number().int().nonnegative();
/** Same shape as WeekRow in src/lib/series.ts: [weekStart, sun, mon, ..., sat]. */
const weekRowSchema = z.tuple([z.number().int(), count, count, count, count, count, count, count]).readonly();

const starsFileSchema = z.object({
  repo: z.string(),
  weeks: z.array(weekRowSchema),
});

const metaSchema = z.object({ fetchedAt: z.iso.datetime() });

export type StarsFile = z.infer<typeof starsFileSchema>;

export function starsPath(repo: string): string {
  return join(starsDir, `${repo.toLowerCase().replace("/", "__")}.json`);
}

export function readStarsFile(repo: string): StarsFile | undefined {
  const path = starsPath(repo);
  if (!existsSync(path)) return undefined;
  return starsFileSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

export function writeStarsFile(file: StarsFile): void {
  mkdirSync(starsDir, { recursive: true });
  const rows = file.weeks.map((row) => `    ${JSON.stringify(row)}`).join(",\n");
  const body = `{\n  "repo": ${JSON.stringify(file.repo)},\n  "weeks": [\n${rows}\n  ]\n}\n`;
  writeFileSync(starsPath(file.repo), body);
}

/** Files in data/stars/ that no listed repository owns (for example after a removal). */
export function orphanedStarsFiles(repos: string[]): string[] {
  if (!existsSync(starsDir)) return [];
  const owned = new Set(repos.map((repo) => starsPath(repo)));
  return readdirSync(starsDir)
    .filter((name) => name.endsWith(".json") && name !== "_meta.json")
    .map((name) => join(starsDir, name))
    .filter((path) => !owned.has(path));
}

export function readFetchedAt(): Date {
  const meta = metaSchema.parse(JSON.parse(readFileSync(metaPath, "utf8")));
  return new Date(meta.fetchedAt);
}

export function writeFetchedAt(date: Date): void {
  mkdirSync(starsDir, { recursive: true });
  writeFileSync(metaPath, `${JSON.stringify({ fetchedAt: date.toISOString() }, null, 2)}\n`);
}
