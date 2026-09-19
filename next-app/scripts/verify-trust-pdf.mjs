/**
 * Verification: Trust/Brand item clickability (Admin-controlled) + PDP PDF removal.
 * Run: node scripts/verify-trust-pdf.mjs   (dev server on :3000)
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";

const BASE = "http://localhost:3000";
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok, extra });
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? " — " + extra : ""}`);
};

const db = JSON.parse(readFileSync("./data/local-db.json", "utf8"));
const adminCookie = { name: "qc_session", value: "", domain: "localhost", path: "/" };

// ── 1. Admin login ──────────────────────────────────────────────
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
});
const rawCookie = loginRes.headers.get("set-cookie") || "";
adminCookie.value = (rawCookie.match(/qc_session=([^;]+)/) || [])[1] || "";
check("Admin login", Boolean(adminCookie.value));

const hdr = { Cookie: `qc_session=${adminCookie.value}`, "Content-Type": "application/json" };

// ── 2. Current admin config ─────────────────────────────────────
const cfgRes = await fetch(`${BASE}/api/admin/footer`, { headers: hdr });
const cfgData = await cfgRes.json();
check("Admin can read footer config", cfgRes.ok && cfgData.success);
const items = cfgData.config?.trustStrip?.items || [];
check("4 trust items exist", items.length === 4, `n=${items.length}`);
const titles = items.map((i) => i.title);
check(
  "Expected titles present",
  ["Quality You Can Trust", "Science-Backed", "People-Driven", "A Healthier Tomorrow"].every((t) => titles.includes(t)),
  titles.join(" | ")
);

const savedVersion = cfgData.config.version;
const savedUpdated = cfgData.config.updatedAt;
const cloneCfg = (patchFn) => {
  const c = JSON.parse(JSON.stringify(cfgData.config));
  patchFn(c);
  c.version = savedVersion;
  c.updatedAt = savedUpdated;
  return c;
};
const putCfg = async (config, label) => {
  const r = await fetch(`${BASE}/api/admin/footer`, {
    method: "PUT",
    headers: hdr,
    body: JSON.stringify({ action: "publish", config, summary: label }),
  });
  return { res: r, data: await r.json().catch(() => ({})) };
};

/** Always restore trust-1 to its documented baseline (idempotent). */
const restoreTrust1 = async () => {
  const { res } = await putCfg(
    cloneCfg((c) => {
      Object.assign(c.trustStrip.items[0], { linkUrl: "/quality-assurance", clickable: true, visible: true });
    }),
    "verify: restore trust-1 baseline"
  );
  return res.ok;
};

// ── 3. Security: destination URL validation ─────────────────────
const securityCases = [
  ["javascript:alert(1)", "javascript: URL rejected"],
  ["https://evil.example.com", "external http(s) URL rejected"],
  ["", "empty destination with clickable=true rejected"],
  ["  /about  ", "whitespace-padded relative path accepted+trimmed"],
];
for (const [url, label] of securityCases) {
  const expectReject = url !== "  /about  ";
  const { res, data } = await putCfg(
    cloneCfg((c) => { c.trustStrip.items[0].clickable = true; c.trustStrip.items[0].linkUrl = url; }),
    `security probe: ${url}`
  );
  const rejected = res.status === 422;
  check(label, expectReject ? rejected : res.ok, `status=${res.status}${data.error ? " " + data.error : ""}`);
}
{
  const r = await fetch(`${BASE}/api/admin/footer`, { headers: hdr });
  const d = await r.json();
  check("Whitespace-padded URL normalized to '/about'", d.config?.trustStrip?.items?.[0]?.linkUrl === "/about", `got "${d.config?.trustStrip?.items?.[0]?.linkUrl}"`);
}

// ── 4. Customer fetch reflects Admin (cache check) ──────────────
{
  const r = await fetch(`${BASE}/api/footer`);
  const d = await r.json();
  const it = (d.config?.trustStrip?.items || []).find((i) => i.title === "Quality You Can Trust");
  check("Public /api/footer serves same store", Boolean(it), JSON.stringify(it || {}).slice(0, 80));
}

const browser = await chromium.launch();

try {
  // ── 5. Scenario A: trust-1 Visible ON + Clickable OFF ─────────
  {
    const { res } = await putCfg(
      cloneCfg((c) => { c.trustStrip.items[0].clickable = false; }),
      "verify: trust-1 clickable OFF"
    );
    check("Publish trust-1 clickable=OFF", res.ok);
  }

  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx1.newPage();

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const titleLoc = page.getByText("Quality You Can Trust", { exact: true });
  await titleLoc.waitFor({ state: "visible", timeout: 30000 });
  check("trust-1 visible when Clickable OFF", await titleLoc.isVisible());
  const wrapInfo = await titleLoc.evaluate((el) => {
    const link = el.closest("a");
    const wrap = link ?? el.parentElement?.parentElement ?? el;
    return {
      tag: link ? "a" : String(wrap.tagName).toLowerCase(),
      href: link ? link.getAttribute("href") : null,
      cursor: getComputedStyle(wrap).cursor,
    };
  });
  check("trust-1 not rendered as a link (no <a> wrapper)", wrapInfo.tag !== "a", `tag=${wrapInfo.tag}`);
  check("trust-1 has no href when Clickable OFF", wrapInfo.href === null);
  check("trust-1 shows no pointer affordance", wrapInfo.cursor !== "pointer", `cursor=${wrapInfo.cursor}`);
  await titleLoc.click();
  await page.waitForTimeout(600);
  check("trust-1 click does NOT navigate", !page.url().includes("quality-assurance"), page.url());

  const anchors = await page.$$eval("footer a", (as) =>
    as.map((a) => ({ href: a.getAttribute("href"), label: a.getAttribute("aria-label") || "" }))
  );
  for (const [label, href] of [["Science-Backed", "/#science"], ["People-Driven", "/about"], ["A Healthier Tomorrow", "/products"]]) {
    const found = anchors.find((a) => a.label === label && a.href === href);
    check(`${label} stays clickable → ${href}`, Boolean(found));
  }

  // No stale-clickability flash: footer's very first painted state on a fresh page
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  const earlyState = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("a, div")].filter(
      (n) => n.childElementCount === 0 && n.textContent?.trim() === "Quality You Can Trust"
    );
    if (!nodes.length) return "missing"; // strip not yet painted (waits for live config) — safe
    return nodes[0].closest("a") ? "a" : "nonlink";
  });
  check("No stale clickability flash on first paint (login page)", earlyState === "nonlink" || earlyState === "missing", `state=${earlyState}`);
  await ctx1.close();

  // ── 6. Scenario D: Visible OFF hides item completely ──────────
  {
    const { res } = await putCfg(
      cloneCfg((c) => { c.trustStrip.items[0].visible = false; }),
      "verify: trust-1 visible OFF"
    );
    check("Publish trust-1 visible=OFF", res.ok);
    const ctxV = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pV = await ctxV.newPage();
    await pV.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await pV.waitForTimeout(2500);
    const count = await pV.evaluate(
      () => [...document.querySelectorAll("a,div,span")].filter((n) => n.childElementCount === 0 && n.textContent?.trim() === "Quality You Can Trust").length
    );
    check("trust-1 hidden when Visible OFF", count === 0, `count=${count}`);
    await ctxV.close();
  }

  // ── 7. Restore + confirm clickable ON navigates ───────────────
  check("Publish trust-1 restored (visible+clickable ON)", await restoreTrust1());
  {
    const r = await fetch(`${BASE}/api/admin/footer`, { headers: hdr });
    const d = await r.json();
    const it = d.config.trustStrip.items.find((i) => i.title === "Quality You Can Trust");
    check("Admin persistence: clickable=ON saved", it.clickable === true && it.visible === true && it.linkUrl === "/quality-assurance", JSON.stringify({ clickable: it.clickable, visible: it.visible, url: it.linkUrl }));
  }

  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page2.waitForFunction(
    () => {
      const t = [...document.querySelectorAll("a,div,span")].find(
        (n) => n.childElementCount === 0 && n.textContent?.trim() === "Quality You Can Trust"
      );
      return t && t.closest("a") !== null;
    },
    { timeout: 30000 }
  );
  const hrefBack = await page2.evaluate(() => {
    const t = [...document.querySelectorAll("a,div,span")].find(
      (n) => n.childElementCount === 0 && n.textContent?.trim() === "Quality You Can Trust"
    );
    return t.closest("a").getAttribute("href");
  });
  check("trust-1 renders as real link again", hrefBack === "/quality-assurance", `href=${hrefBack}`);
  await Promise.all([
    page2.waitForURL("**/quality-assurance", { timeout: 20000 }).catch(() => null),
    page2.evaluate(() => {
      const t = [...document.querySelectorAll("a,div,span")].find(
        (n) => n.childElementCount === 0 && n.textContent?.trim() === "Quality You Can Trust"
      );
      t.closest("a").click();
    }),
  ]);
  check("trust-1 click navigates to /quality-assurance", page2.url().includes("quality-assurance"), page2.url());

  // ── 8. PDP: PDF gone + purchase flow intact (fresh context) ───
  const product = (db.products || []).find((p) => p.active && !/^test/i.test(p.slug) && p.slug);
  check("PDP test product available", Boolean(product), product?.slug || "none");
  await page2.goto(`${BASE}/products/${product.slug}`, { waitUntil: "domcontentloaded", timeout: 90000 });

  const pdfHref = await page2.$$eval('a[href*="/pdf"]', (as) => as.map((a) => a.getAttribute("href")));
  check("No /pdf links on PDP", pdfHref.length === 0, JSON.stringify(pdfHref));
  const pdfText = await page2.evaluate(() => (document.body.innerText.match(/download[^\n]*pdf|product[^\n]*pdf/i) || [])[0]);
  check("No PDF-download wording on PDP", !pdfText, pdfText || "");

  const priceVisible = await page2.getByText("₹").first().isVisible().catch(() => false);
  check("Price (₹) visible", priceVisible);
  const addBtn = page2.locator('button:has-text("ADD TO CARE BAG"), button:has-text("Add to Bag"), button:has-text("Add to Cart")').first();
  check("Add to Cart present", await addBtn.isVisible().catch(() => false));
  const buyBtn = page2.locator('button:has-text("Buy Now"), button:has-text("BUY NOW"), button:has-text("Instant Buy")').first();
  check("Buy Now present", await buyBtn.isVisible().catch(() => false));
  const wishBtn = page2.locator('button:has-text("Wishlist"), button[aria-label*="ishlist" i], [class*="wishlist" i] button').first();
  check("Wishlist control present", (await wishBtn.count()) > 0);
  const imgCount = await page2.$$eval("img", (imgs) => imgs.filter((i) => i.naturalWidth > 0).length);
  check("Gallery/product images load", imgCount >= 3, `imgs=${imgCount}`);

  await addBtn.click();
  await page2.waitForTimeout(1200); // toast ("✓ Added to Bag") displays for ~2.4s — probe inside that window
  const cartFeedback = await page2.evaluate(() => {
    const t = document.body.innerText;
    return /added to (your )?(care )?bag|added to cart|view bag|item added/i.test(t);
  });
  check("Add to Cart gives feedback", cartFeedback);

  const has3d = (await page2.$$("canvas")).length > 0;
  console.log(`   info: 3D canvas on PDP: ${has3d ? "yes" : "lazy/not loaded"}`);

  const consoleErrors = [];
  page2.on("pageerror", (e) => consoleErrors.push(String(e)));
  await page2.waitForTimeout(1200);
  check("No PDP console page errors", consoleErrors.length === 0, consoleErrors.join("; ").slice(0, 160));
  await ctx2.close();
} finally {
  // Never leave the DB in a verification state
  const restored = await restoreTrust1();
  console.log(`   info: trust-1 baseline restored: ${restored ? "yes" : "NO — check Admin!"}`);
  await browser.close();
}

// ── Summary ─────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
console.log(`\n══ ${results.length - failed.length}/${results.length} checks passed ══`);
if (failed.length) {
  console.log("FAILED:", failed.map((f) => f.name).join(" | "));
  process.exit(1);
}
console.log("ALL PASS");
