#!/usr/bin/env node
/**
 * QUEENS CARE — Admin API Security Regression Suite
 *
 * Discovers all /api/admin/** route handlers and tests:
 *   A. Anonymous → 401/403
 *   B. Customer → 401/403
 *   C. Admin → 200/201/404/400
 *   D. No sensitive data leakage
 *   E. CSRF hostile-origin behavior
 *
 * Run: node scripts/verify-admin-security.mjs
 * Requires the dev server to be running.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import http from "node:http";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const TIMEOUT = Number(process.env.TIMEOUT_MS || 60000);
const ROUTE_DIR = join(process.cwd(), "app", "api", "admin");

const ADMIN_CREDS = { email: "admin@queenscare.in", password: "admin12345" };
const CUSTOMER_CREDS = { email: "customer@queenscare.in", password: "customer12345" };

// ── Route Discovery ────────────────────────────────────────────────────────────
function discoverRoutes(dir) {
  const routes = [];
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (entry.name !== "route.ts" && entry.name !== "route.js") continue;
      const content = readFileSync(full, "utf8");
      let apiPath = full.replace(/\\/g, "/").replace(/.*\/app\/api/, "/api").replace(/\/route\.(ts|js)$/, "")
        .replace(/\[id\]/g, "test-id-001").replace(/\[\.\.\..*?\]/g, "test.txt");
      const methods = [];
      for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
        if (new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(content)) methods.push(m);
      }
      if (methods.length) routes.push({ apiPath, methods, file: relative(process.cwd(), full), hasAuth: content.includes("requireUser") });
    }
  }
  walk(dir);
  return routes;
}

// ── HTTP Request Helper ─────────────────────────────────────────────────────────
function req(method, path, { cookies = "", body = null, headers: extra = {} } = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const hdrs = { ...extra };
    if (cookies) hdrs["Cookie"] = cookies;
    if (body !== null) hdrs["Content-Type"] = "application/json";
    hdrs["Origin"] = BASE;
    hdrs["Referer"] = BASE + "/admin";
    const r = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: hdrs, timeout: TIMEOUT }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try { json = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: raw, json, size: raw.length });
      });
    });
    r.on("timeout", () => { r.destroy(); resolve({ status: "TIMEOUT", headers: {}, body: "", json: null, size: 0 }); });
    r.on("error", (e) => resolve({ status: "ERR:" + e.code, headers: {}, body: "", json: null, size: 0 }));
    if (body !== null) r.write(JSON.stringify(body));
    r.end();
  });
}

// ── Auth Helpers ────────────────────────────────────────────────────────────────
async function login(creds) {
  const res = await req("POST", "/api/auth/login", { body: creds });
  if (res.json && res.json.user) {
    const sc = res.headers["set-cookie"];
    if (sc) {
      return (Array.isArray(sc) ? sc : [sc]).map((c) => c.split(";")[0]).join("; ");
    }
  }
  return "";
}

// ── Sensitive Data Patterns ─────────────────────────────────────────────────────
const SENSITIVE_PATTERNS = [
  /password\s*[:=]/i, /secret\s*[:=]/i, /api[_-]?key\s*[:=]/i,
  /webhook[_-]?secret\s*[:=]/i, /private[_-]?key/i, /access[_-]?key/i,
  /connection[_-]?string/i, /database[_-]?url/i, /smtp[_-]?pass/i,
];

function checkLeak(res) {
  const findings = [];
  for (const pat of SENSITIVE_PATTERNS) {
    const m = res.body.match(pat);
    if (m) {
      const ctx = res.body.substring(Math.max(0, res.body.indexOf(m[0]) - 30), res.body.indexOf(m[0]) + m[0].length + 60);
      if (!/unauthorized|invalid|missing|required|error/i.test(ctx)) {
        findings.push({ pattern: pat.source, ctx: ctx.trim().substring(0, 80) });
      }
    }
  }
  return findings;
}

// ── Counters ────────────────────────────────────────────────────────────────────
let total = 0, pass = 0, fail = 0;
const failures = [];
const leaks = [];

function check(cond, label, detail = "") {
  total++;
  if (cond) { pass++; } else { fail++; failures.push({ label, detail }); }
}

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  QUEENS CARE — Admin API Security Regression Suite      ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // 1. Discover
  const routes = discoverRoutes(ROUTE_DIR);
  console.log(`Discovered ${routes.length} admin route files\n`);

  // 2. Auth
  console.log("Authenticating...");
  const adminCookie = await login(ADMIN_CREDS);
  const customerCookie = await login(CUSTOMER_CREDS);
  console.log(`  Admin: ${adminCookie ? "✅" : "❌ FAILED"}`);
  console.log(`  Customer: ${customerCookie ? "✅" : "❌ FAILED"}\n`);
  if (!adminCookie) { console.error("FATAL: Cannot authenticate as admin."); process.exit(1); }

  // 3. Pre-warm all GET routes in parallel (first compile)
  const getRoutes = routes.filter(r => r.methods.includes("GET"));
  console.log(`Pre-warming ${getRoutes.length} GET routes (first compile)...`);
  const warmBatch = 5;
  for (let i = 0; i < getRoutes.length; i += warmBatch) {
    const batch = getRoutes.slice(i, i + warmBatch);
    await Promise.all(batch.map(r => req("GET", r.apiPath)));
    process.stdout.write(`\r  ${Math.min(i + warmBatch, getRoutes.length)}/${getRoutes.length}`);
  }
  console.log(" done\n");

  // 4. Test matrix
  const stats = {
    GET: { anon: { b: 0, t: 0 }, cust: { b: 0, t: 0 }, admin: { ok: 0, t: 0 } },
    POST: { anon: { b: 0, t: 0 }, cust: { b: 0, t: 0 } },
    PUT: { anon: { b: 0, t: 0 }, cust: { b: 0, t: 0 } },
    PATCH: { anon: { b: 0, t: 0 }, cust: { b: 0, t: 0 } },
    DELETE: { anon: { b: 0, t: 0 }, cust: { b: 0, t: 0 } },
  };
  let csrfFlags = [];

  for (const route of routes) {
    for (const method of route.methods) {
      const label = `${method} ${route.apiPath}`;
      const st = stats[method] || (stats[method] = { anon: { b: 0, t: 0 }, cust: { b: 0, t: 0 } });

      if (method === "GET") {
        // A. Anonymous
        const a = await req("GET", route.apiPath);
        const aBlock = a.status === 401 || a.status === 403;
        check(aBlock, `${label} anon`, `got ${a.status}`);
        stats.GET.anon.t++; if (aBlock) stats.GET.anon.b++;
        if (!aBlock) { const lk = checkLeak(a); if (lk.length) leaks.push({ ep: label, lk }); }

        // B. Customer
        const c = await req("GET", route.apiPath, { cookies: customerCookie });
        const cBlock = c.status === 401 || c.status === 403;
        check(cBlock, `${label} customer`, `got ${c.status}`);
        stats.GET.cust.t++; if (cBlock) stats.GET.cust.b++;

        // D. Admin
        const ad = await req("GET", route.apiPath, { cookies: adminCookie });
        const adOk = [200, 201, 404, 400].includes(ad.status);
        check(adOk, `${label} admin`, `got ${ad.status}`);
        stats.GET.admin.t++; if (adOk) stats.GET.admin.ok++;
        if (ad.status === 200 || ad.status === 201) {
          const lk = checkLeak(ad); if (lk.length) leaks.push({ ep: label + " (admin)", lk });
        }
      } else {
        // Mutation: anonymous must be blocked
        const a = await req(method, route.apiPath, { body: {} });
        const aBlock = [401, 403, 405].includes(a.status);
        check(aBlock, `${label} anon`, `got ${a.status}`);
        st.anon.t++; if (aBlock) st.anon.b++;
        if (!aBlock) { const lk = checkLeak(a); if (lk.length) leaks.push({ ep: label, lk }); }

        // Mutation: customer must be blocked
        const c = await req(method, route.apiPath, { body: {}, cookies: customerCookie });
        const cBlock = [401, 403, 405].includes(c.status);
        check(cBlock, `${label} customer`, `got ${c.status}`);
        st.cust.t++; if (cBlock) st.cust.b++;

        // CSRF: hostile origin
        const cs = await req(method, route.apiPath, { body: {}, cookies: adminCookie, headers: { Origin: "https://evil.example.com", Referer: "https://evil.example.com/" } });
        if (cs.status === 200) csrfFlags.push(label);
      }
    }
  }

  // 5. Check routes without requireUser
  let noAuth = [];
  for (const route of routes) {
    if (!route.hasAuth) noAuth.push(route.file);
  }

  // 6. Report
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║              SECURITY REGRESSION REPORT                 ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  console.log(`Admin route files discovered: ${routes.length}\n`);

  console.log("GET");
  console.log(`  ${stats.GET.anon.b}/${stats.GET.anon.t} anonymous blocked`);
  console.log(`  ${stats.GET.cust.b}/${stats.GET.cust.t} customer blocked`);
  console.log(`  ${stats.GET.admin.ok}/${stats.GET.admin.t} admin authorized`);

  for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
    const s = stats[m];
    if (s && s.anon.t > 0) {
      console.log(`\n${m}`);
      console.log(`  ${s.anon.b}/${s.anon.t} anonymous blocked`);
      console.log(`  ${s.cust.b}/${s.cust.t} customer blocked`);
    }
  }

  console.log(`\nCSRF hostile-origin accepted: ${csrfFlags.length}`);
  if (csrfFlags.length) csrfFlags.forEach(f => console.log(`  ⚠️  ${f}`));

  console.log(`\nSensitive data leakage: ${leaks.length}`);
  if (leaks.length) leaks.forEach(l => console.log(`  ⚠️  ${l.ep}`));

  console.log(`\nRoutes without requireUser: ${noAuth.length === 0 ? "0 ✅" : noAuth.join(", ")}`);

  console.log(`\n${"─".repeat(58)}`);
  console.log(`TOTAL: ${pass}/${total} passed, ${fail} failed\n`);

  if (failures.length) {
    console.log("FAILURES:");
    for (const f of failures) { console.log(`  ❌ ${f.label}`); if (f.detail) console.log(`     ${f.detail}`); }
  }

  const ok = fail === 0 && noAuth.length === 0;
  console.log(ok ? "✅ PASS" : "❌ FAIL");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(2); });
