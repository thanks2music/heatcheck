// Serves dist/ under /heatcheck/, the same path GitHub Pages uses, to check a
// production build before it ships.
//
// Usage: bun run build && bun run preview  (then open http://localhost:4173/heatcheck/)

import { join, normalize } from "node:path";

const base = "/heatcheck/";
const distDir = join(import.meta.dir, "../dist");
const port = Number(process.env.PORT ?? 4173);

const server = Bun.serve({
  port,
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith(base)) return Response.redirect(base, 302);
    const relative = normalize(decodeURIComponent(pathname.slice(base.length)) || "index.html");
    if (relative.startsWith("..")) return new Response("Not found", { status: 404 });
    const file = Bun.file(join(distDir, relative));
    return (await file.exists()) ? new Response(file) : new Response("Not found", { status: 404 });
  },
});

console.log(`Previewing dist/ at http://localhost:${server.port}${base}`);
