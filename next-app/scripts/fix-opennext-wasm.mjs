/**
 * fix-opennext-wasm.mjs — Windows path-mangling patch for the OpenNext bundle.
 *
 * Root cause: @prisma/client resolves its WASM query engine via a dynamic
 * `import('./query_engine_bg.wasm')` (subpath imports `#wasm-engine-loader`).
 * During the OpenNext Cloudflare adapter's bundling step on Windows, the chunk
 * loader inside handler.mjs emits the import target as a mangled ABSOLUTE
 * Windows path (backslashes destroyed: `C:\Project\...\node_modules\...`
 * becomes `C:Project...` where `\n` sequences turn into literal newlines).
 * Wrangler/esbuild then cannot resolve the specifier and `wrangler deploy
 * --dry-run` fails with "Could not resolve".
 *
 * Fix: rewrite ONLY the unresolvable mangled absolute-path import specifiers
 * to the real file. The adapter's NFT tracing already copies
 * `query_engine_bg.wasm` to `<serverFn>/node_modules/.prisma/client/`, so a
 * relative `./node_modules/...` specifier resolves deterministically at
 * wrangler bundle time. Nothing fake is introduced — the wasm binary is the
 * genuine Prisma engine artifact, and the switch-case is rewritten to match
 * so the branch remains reachable.
 *
 * Idempotent: safe to run multiple times; exits 0 with a no-op notice when
 * there is nothing to patch (e.g. correct behavior on POSIX or after a fix).
 *
 * Run AFTER `opennextjs-cloudflare build`, BEFORE `wrangler deploy`.
 * Wired into `npm run build:cf` so local and CI builds stay identical.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const HANDLER = join(process.cwd(), ".open-next", "server-functions", "default", "handler.mjs");
const WASM_REL = "./node_modules/.prisma/client/query_engine_bg.wasm";
const WASM_TOKEN = "query_engine_bg.wasm";

if (!existsSync(HANDLER)) {
  console.error(`[fix-opennext-wasm] handler not found: ${HANDLER}`);
  console.error("[fix-opennext-wasm] Run `opennextjs-cloudflare build` first.");
  process.exit(1);
}

const wasmPath = join(process.cwd(), ".open-next", "server-functions", "default", WASM_REL);
if (!existsSync(wasmPath)) {
  console.error(`[fix-opennext-wasm] traced wasm engine not found: ${wasmPath}`);
  console.error("[fix-opennext-wasm] Aborting rather than writing a dangling import.");
  process.exit(1);
}

let src = readFileSync(HANDLER, "utf8");

// --- next-env.mjs duplicate-export guard -------------------------------------
// Next 16 on Windows can emit `.open-next/cloudflare/next-env.mjs` with the
// production/development/test env objects exported twice (observed when both
// `.env` and `.env.local` exist). Duplicate `export const` names are a hard
// esbuild error in `wrangler deploy`. Dedupe keeping the FIRST export of each
// name; idempotent.
const ENV_FILE = join(process.cwd(), ".open-next", "cloudflare", "next-env.mjs");
if (existsSync(ENV_FILE)) {
  const envLines = readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  const seen = new Set();
  const deduped = [];
  let removed = 0;
  for (const line of envLines) {
    const m = line.match(/^export const (\w+)/);
    if (m) {
      if (seen.has(m[1])) { removed++; continue; }
      seen.add(m[1]);
    }
    deduped.push(line);
  }
  if (removed > 0) {
    writeFileSync(ENV_FILE, deduped.join("\n"));
    console.log(`[fix-opennext-wasm] next-env.mjs: removed ${removed} duplicate export(s).`);
  }
}

// Match any mangled absolute import of the wasm engine: a quoted specifier
// whose path ends in the wasm token and which is NOT already a relative
// import. The raw source contains real newline characters where `\n` appeared
// in the original Windows path, hence the [\s\S] span.
const mangledImport = new RegExp(
  "import\\(\"(?![.])[^\"]*" + WASM_TOKEN + "\"\\)",
  "g"
);

const before = (src.match(mangledImport) || []).length;
if (before === 0) {
  console.log("[fix-opennext-wasm] nothing to patch (no mangled wasm imports).");
  process.exit(0);
}

src = src.replace(mangledImport, `import("${WASM_REL}")`);

// The loader switch-case compares chunkPath against the same mangled string.
// Normalize every case label that ends with the wasm token to the relative
// specifier so the branch still matches at runtime.
const caseRe = new RegExp(
  "case`(?![.])[^`]*" + WASM_TOKEN + "`:",
  "g"
);
const cases = (src.match(caseRe) || []).length;
src = src.replace(caseRe, "case`" + WASM_REL + "`:");

writeFileSync(HANDLER, src);
console.log(`[fix-opennext-wasm] patched ${before} import(s), ${cases} case label(s) -> ${WASM_REL}`);
