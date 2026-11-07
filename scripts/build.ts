// Builds the site into dist/. Asset URLs in the output HTML are relative, so the
// same build works at the GitHub Pages path /heatcheck/ and locally.
//
// Usage: bun run build (runs derive first)

import { rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const outdir = join(root, "dist");

rmSync(outdir, { recursive: true, force: true });
const result = await Bun.build({
  entrypoints: [join(root, "index.html")],
  outdir,
  minify: true,
});
for (const output of result.outputs) {
  console.log(`  ${output.path.replace(`${root}/`, "")}  ${(output.size / 1024).toFixed(1)} KB`);
}
