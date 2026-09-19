import assert from "node:assert";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const NEXT_APP_DIR = "c:\\Project\\QueensCareWebsite\\next-app";

// Stub server-only so Node.js can import server-side modules outside Next.js runtime
try {
  const serverOnlyPath = require.resolve("server-only", { paths: [NEXT_APP_DIR] });
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  };
} catch (e) {
  // Ignore
}

const { createJiti } = require(path.join(NEXT_APP_DIR, "node_modules/jiti/lib/jiti.cjs"));
const jiti = createJiti(__filename, {
  alias: {
    "@": NEXT_APP_DIR,
    "server-only": path.join(__dirname, "server-only-stub.js"),
  },
  interopDefault: true,
});

async function runSearchTestSuite() {
  console.log("================================================================");
  console.log("QUEENS CARE — 13-TEST PRODUCTION SEARCH & VOICE SEARCH SUITE");
  console.log("================================================================");

  const { searchEngine, levenshtein, stemWord, sanitizeSearchQuery } = jiti(
    path.join(NEXT_APP_DIR, "lib/commerce/search-engine.ts")
  );
  const { searchStore } = jiti(path.join(NEXT_APP_DIR, "lib/commerce/search-store.ts"));
  const { store } = jiti(path.join(NEXT_APP_DIR, "lib/commerce/store.ts"));

  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error("  ", err?.message || err);
      failedCount++;
    }
  }

  // TEST 1: Levenshtein distance calculation
  await test("1. Levenshtein edit distance logic & edge cases", () => {
    assert.strictEqual(levenshtein("", ""), 0);
    assert.strictEqual(levenshtein("paracetamol", "paracetamol"), 0);
    assert.strictEqual(levenshtein("paracitamol", "paracetamol"), 1); // 'i' vs 'e'
    assert.strictEqual(levenshtein("magnezium", "magnesium"), 1); // 'z' vs 's'
    assert.strictEqual(levenshtein("vitamine", "vitamin"), 1); // trailing 'e'
    assert.strictEqual(levenshtein("cat", "hat"), 1);
    assert.strictEqual(levenshtein("abc", "xyz"), 3);
  });

  // TEST 2: StemWord singular / plural normalizer
  await test("2. StemWord singular/plural normalization rules", () => {
    assert.strictEqual(stemWord("capsules"), "capsule");
    assert.strictEqual(stemWord("syrups"), "syrup");
    assert.strictEqual(stemWord("tablets"), "tablet");
    assert.strictEqual(stemWord("batteries"), "battery");
    assert.strictEqual(stemWord("glass"), "glass"); // preserves double s
    assert.strictEqual(stemWord("capsule"), "capsule");
  });

  // TEST 3: Security & Query Sanitization
  await test("3. Security: SanitizeSearchQuery strips XSS/SQL injections and enforces limits", () => {
    const malicious = '<script>alert("xss")</script> SELECT * FROM products;';
    const clean = sanitizeSearchQuery(malicious);
    assert.ok(!clean.includes("<"), "Must not contain <");
    assert.ok(!clean.includes(">"), "Must not contain >");
    assert.ok(!clean.includes('"'), 'Must not contain "');
    assert.ok(!clean.includes(";"), "Must not contain ;");

    // Overlength cap test
    const longString = "paracetamol ".repeat(20);
    const capped = sanitizeSearchQuery(longString);
    assert.ok(capped.length <= 100, `Length must be <= 100, got ${capped.length}`);
  });

  // TEST 4: Exact Product Name Match & Highest Relevance
  await test("4. Exact product name match yields top ranking score", async () => {
    const res = await searchEngine.search({ q: "Lumine-C Serum", type: "full" });
    assert.ok(res.results.length > 0, "Should find Lumine-C Serum");
    const topResult = res.results[0];
    assert.ok(topResult.name.includes("Lumine-C"), `Expected name to contain Lumine-C, got ${topResult.name}`);
    assert.strictEqual(topResult.slug, "lumine-c-serum");
    assert.ok(topResult.score >= 100, `Top result score should be >= 100, got ${topResult.score}`);
  });

  // TEST 5: Partial Token Match
  await test("5. Multi-token partial match finds relevant formulations", async () => {
    const res = await searchEngine.search({ q: "radiance serum", type: "full" });
    assert.ok(res.results.length > 0, "Should return matching formulations");
    const found = res.results.some((r) => r.slug === "lumine-c-serum");
    assert.ok(found, "Lumine-C Serum should be included in radiance serum results");
  });

  // TEST 6: Active Pharmaceutical Ingredient (API) Search
  await test("6. Active Pharmaceutical Ingredient (API) search", async () => {
    // Lumine-C ingredients contains "L-Ascorbic Acid"
    const res = await searchEngine.search({ q: "Ascorbic Acid", type: "full" });
    assert.ok(res.results.length > 0, "Should match Lumine-C by active ingredient");
    assert.strictEqual(res.results[0].slug, "lumine-c-serum");
  });

  // TEST 7: Therapeutic Category & Brand Matching
  await test("7. Category and Brand matching", async () => {
    const resCat = await searchEngine.search({ q: "Digestive care", type: "full" });
    assert.ok(resCat.results.length > 0, "Should find Biome Balance in digestive care");
    assert.ok(resCat.results.some((r) => r.category.toLowerCase().includes("digestive")));

    const resBrand = await searchEngine.search({ q: "Queens Care", type: "full" });
    assert.ok(resBrand.results.length > 0, "Should find brand products");
  });

  // TEST 8: Typo Tolerance & Suggestion ("Did you mean?")
  await test("8. Typo tolerance: handles misspellings like 'magnezium' and 'paracitamol'", async () => {
    // "magnezium" has Levenshtein distance 1 to "magnesium" and synonym mapping
    const resMag = await searchEngine.search({ q: "magnezium", type: "full" });
    assert.ok(resMag.results.length > 0, "Should find Nocturne Magnesium despite typo 'magnezium'");
    assert.ok(
      resMag.results.some((r) => r.name.toLowerCase().includes("magnesium")),
      "Results must include Magnesium"
    );

    // Typo suggestion for 'paracitamol'
    const resPara = await searchEngine.search({ q: "paracitamol", type: "full" });
    assert.ok(
      resPara.correctedQuery === "paracetamol" || resPara.suggestions.includes("paracetamol"),
      `Expected correctedQuery or suggestion to reference paracetamol, got: ${resPara.correctedQuery}`
    );
  });

  // TEST 9: Health & Symptom Synonym Expansion
  await test("9. Health & Symptom synonyms ('gut', 'sleep', 'glow')", async () => {
    const resGut = await searchEngine.search({ q: "gut", type: "full" });
    assert.ok(resGut.results.length > 0, "Should expand 'gut' to Biome Balance");
    assert.ok(resGut.results.some((r) => r.slug === "biome-balance"));

    const resSleep = await searchEngine.search({ q: "sleep", type: "full" });
    assert.ok(resSleep.results.length > 0, "Should expand 'sleep' to Nocturne Magnesium");
    assert.ok(resSleep.results.some((r) => r.slug === "nocturne-magnesium"));
  });

  // TEST 10: Strict Privacy & Sensitive Data Leak Prevention
  await test("10. Strict Security: Zero internal/sensitive data leaks in search results", async () => {
    const res = await searchEngine.search({ q: "serum", type: "full" });
    assert.ok(res.results.length > 0, "Should return results");

    res.results.forEach((item) => {
      // Internal financial / supplier fields must NEVER exist on client search result
      assert.strictEqual(item["costPrice"], undefined, "costPrice must never be exposed");
      assert.strictEqual(item["supplier"], undefined, "supplier must never be exposed");
      assert.strictEqual(item["adminNotes"], undefined, "adminNotes must never be exposed");
      assert.strictEqual(item["margin"], undefined, "margin must never be exposed");
      assert.strictEqual(item["batchDetails"], undefined, "batchDetails must never be exposed");
    });
  });

  // TEST 11: Faceted Filtering & Sorting
  await test("11. Faceted Category Filtering and Numeric Price Sorting", async () => {
    // 11.1 Category Facet check
    const resAll = await searchEngine.search({ q: "", type: "full" });
    assert.ok(resAll.categoryFacets.length > 0, "Should return category facets");

    // 11.2 In-stock filtering
    const resInStock = await searchEngine.search({ q: "", inStockOnly: true, type: "full" });
    resInStock.results.forEach((r) => {
      assert.ok(r.inStock || r.isPreorder, "All filtered items must be in stock or preorder");
    });

    // 11.3 Sort price_asc
    const resAsc = await searchEngine.search({ q: "", sort: "price_asc", type: "full" });
    for (let i = 1; i < resAsc.results.length; i++) {
      assert.ok(
        resAsc.results[i].price >= resAsc.results[i - 1].price,
        `Expected ascending price: ${resAsc.results[i].price} >= ${resAsc.results[i - 1].price}`
      );
    }

    // 11.4 Sort price_desc
    const resDesc = await searchEngine.search({ q: "", sort: "price_desc", type: "full" });
    for (let i = 1; i < resDesc.results.length; i++) {
      assert.ok(
        resDesc.results[i].price <= resDesc.results[i - 1].price,
        `Expected descending price: ${resDesc.results[i].price} <= ${resDesc.results[i - 1].price}`
      );
    }
  });

  // TEST 12: Lightweight Autosuggest vs Full Search Mode
  await test("12. Suggest mode enforces lightweight pagination and limit constraints", async () => {
    const suggestRes = await searchEngine.search({ q: "care", type: "suggest", limit: 3 });
    assert.ok(suggestRes.results.length <= 3, `Expected at most 3 items, got ${suggestRes.results.length}`);
    assert.ok(Array.isArray(suggestRes.suggestions), "Must provide autocomplete suggestions array");
  });

  // TEST 13: Search Store Analytics, Custom Synonyms, & Boosts
  await test("13. Search Admin: analytics logging, custom synonyms, and ranking boost integration", async () => {
    // 13.1 Record search event
    await searchStore.recordSearch({
      query: "test formulation query",
      resultCount: 5,
    });

    // 13.2 Retrieve analytics summary
    const summary = await searchStore.getAnalyticsSummary();
    assert.ok(summary.totalSearches >= 1, "Total searches count should be >= 1");
    assert.ok(Array.isArray(summary.topQueries), "Top queries must be an array");

    // 13.3 Add custom synonym
    await searchStore.addSynonym("energyboost", ["vitality", "stamina"]);
    const synonyms = await searchStore.getSynonyms();
    assert.ok(Array.isArray(synonyms["energyboost"]), "New synonym must be registered");
    assert.ok(synonyms["energyboost"].includes("vitality"));

    // 13.4 Boost ranking rule
    await searchStore.setBoost({
      productId: "p-biome",
      queryKeyword: "balance",
      boostScore: 50,
      active: true,
    });
    const boosts = await searchStore.getBoosts();
    assert.ok(boosts.some((b) => b.productId === "p-biome" && b.boostScore === 50));
  });

  console.log("================================================================");
  console.log(`TEST RUN COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSearchTestSuite().catch((err) => {
  console.error("Fatal test runner crash:", err);
  process.exit(1);
});
