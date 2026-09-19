import "server-only";
import { store } from "./store";
import { inventoryService } from "./inventory";
import { searchStore } from "./search-store";
import type {
  Product,
  SearchProductResult,
  SearchQueryOptions,
  SearchResponse,
  SearchFacetItem,
} from "./types";

/**
 * Standard Levenshtein distance implementation for typo tolerance.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val =
        a[i - 1] === b[j - 1]
          ? row[j - 1]
          : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Normalizes a word for singular/plural matching.
 */
export function stemWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("sses") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
}

/**
 * Sanitizes input query string, strips dangerous tags, caps length.
 */
export function sanitizeSearchQuery(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>"';{}[\]\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export const searchEngine = {
  /**
   * Executes a full production search or lightweight autosuggest.
   */
  async search(options: SearchQueryOptions): Promise<SearchResponse> {
    const rawQuery = sanitizeSearchQuery(options.q);
    const lowerQuery = rawQuery.toLowerCase();
    const queryTokens = lowerQuery
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const products = await store.products.all();
    const synonymsMap = await searchStore.getSynonyms();
    const boosts = await searchStore.getBoosts();

    // If empty query, return default popular/in-stock products
    if (queryTokens.length === 0) {
      return this.buildDefaultResponse(products, options);
    }

    // Expand tokens with synonyms
    const expandedTokens = new Set<string>();
    for (const token of queryTokens) {
      expandedTokens.add(token);
      expandedTokens.add(stemWord(token));

      for (const [key, targets] of Object.entries(synonymsMap)) {
        if (token === key || stemWord(token) === stemWord(key) || token.includes(key)) {
          targets.forEach((t) => {
            expandedTokens.add(t.toLowerCase());
            expandedTokens.add(stemWord(t));
          });
        }
      }
    }

    // Build dictionary of all known terms in catalog for typo suggestions
    const catalogVocab = new Set<string>();
    products.forEach((p) => {
      [
        p.name,
        p.brand,
        p.category,
        p.ingredients,
        p.tags,
        ...(Array.isArray(p.variants) ? p.variants.map((v) => v.name) : []),
      ].forEach((val) => {
        if (typeof val === "string") {
          val
            .toLowerCase()
            .split(/[\s,·\-/]+/)
            .forEach((w) => {
              if (w.length > 3) catalogVocab.add(w);
            });
        }
      });
    });
    // Add all canonical target terms into catalogVocab
    Object.values(synonymsMap).forEach((targets) => {
      targets.forEach((t) => {
        t.toLowerCase().split(/\s+/).forEach((w) => {
          if (w.length > 3) catalogVocab.add(w);
        });
      });
    });

    // Detect typo correction suggestion ("Did you mean: X?")
    let correctedQuery: string | undefined;
    const typoCorrections: string[] = [];
    let hasAnyTypoFix = false;

    for (const token of queryTokens) {
      // Check if token has a direct synonym mapping that corrects a typo (e.g. "paracitamol" -> ["paracetamol", ...])
      const directTargets = synonymsMap[token];
      if (directTargets && directTargets.length > 0 && !directTargets.includes(token)) {
        const canonical = directTargets[0];
        typoCorrections.push(canonical);
        hasAnyTypoFix = true;
        expandedTokens.add(canonical);
        expandedTokens.add(stemWord(canonical));
        continue;
      }

      if (token.length >= 4 && !catalogVocab.has(token)) {
        let bestMatch = token;
        let lowestDist = 999;
        const maxAllowedDist = token.length >= 7 ? 2 : 1;

        for (const vocabWord of catalogVocab) {
          const dist = levenshtein(token, vocabWord);
          if (dist <= maxAllowedDist && dist < lowestDist) {
            lowestDist = dist;
            bestMatch = vocabWord;
          }
        }

        if (bestMatch !== token) {
          typoCorrections.push(bestMatch);
          hasAnyTypoFix = true;
          // Add best match to expanded tokens
          expandedTokens.add(bestMatch);
          expandedTokens.add(stemWord(bestMatch));
        } else {
          typoCorrections.push(token);
        }
      } else {
        typoCorrections.push(token);
      }
    }

    if (hasAnyTypoFix) {
      correctedQuery = typoCorrections.join(" ");
    }

    // Score all catalog products
    const scoredList: Array<{ product: Product; score: number }> = [];

    for (const p of products) {
      if (p.active === false || p.visible === false) continue;

      const pName = (p.name || "").toLowerCase();
      const pBrand = (p.brand || "queens care").toLowerCase();
      const pCategory = (p.category || "").toLowerCase();
      const pSku = (p.sku || p.slug || "").toLowerCase();
      const pIngredients = (p.ingredients || "").toLowerCase();
      const pDescription = (p.description || "").toLowerCase();
      const pBenefits = Array.isArray(p.benefits) ? p.benefits.join(" ").toLowerCase() : "";
      const pTags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : String(p.tags || "").toLowerCase();
      const pSpecs = Array.isArray(p.specifications)
        ? (p.specifications as Array<{ name?: string; value?: string }>)
            .map((s) => `${s.name || ""} ${s.value || ""}`.toLowerCase())
            .join(" ")
        : "";

      // Variants extraction
      const variantTexts: string[] = [];
      const variantSkus: string[] = [];
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          if (v.name) variantTexts.push(v.name.toLowerCase());
          if (v.sku) variantSkus.push(v.sku.toLowerCase());
        });
      }

      let score = 0;
      const cleanLowerQuery = lowerQuery.replace(/[^a-z0-9]/g, "");
      const cleanName = pName.replace(/[^a-z0-9]/g, "");
      const cleanSlug = (p.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanSku = pSku.replace(/[^a-z0-9]/g, "");

      // 1. EXACT PRODUCT NAME OR SLUG / IDENTIFIER MATCH
      if (
        pName === lowerQuery ||
        (cleanLowerQuery.length >= 3 && (cleanName === cleanLowerQuery || cleanSlug === cleanLowerQuery || cleanSku === cleanLowerQuery))
      ) {
        score += 100;
      } else if (pName.startsWith(lowerQuery) || (cleanSlug && cleanSlug.startsWith(cleanLowerQuery))) {
        score += 60;
      } else if (pName.includes(lowerQuery) || (p.slug && p.slug.toLowerCase().includes(lowerQuery))) {
        score += 45;
      }

      // 2. EXACT SKU MATCH (PRODUCT OR VARIANT)
      if (pSku === lowerQuery || variantSkus.includes(lowerQuery)) {
        score += 85;
      } else if (pSku.includes(lowerQuery)) {
        score += 40;
      }

      // 3. BRAND MATCH
      if (pBrand.includes(lowerQuery)) {
        score += 25;
      }

      // 4. CATEGORY MATCH
      if (pCategory.includes(lowerQuery)) {
        score += 30;
      }

      // 5. INGREDIENTS / FORMULATION MATCH
      if (pIngredients.includes(lowerQuery)) {
        score += 35;
      }

      // 6. TOKEN-LEVEL SCORING
      for (const token of queryTokens) {
        const stemmed = stemWord(token);

        // Name match
        if (pName.includes(token) || pName.includes(stemmed)) {
          score += 25;
        }

        // SKU match
        if (pSku.includes(token) || variantSkus.some((vs) => vs.includes(token))) {
          score += 20;
        }

        // Category match
        if (pCategory.includes(token) || pCategory.includes(stemmed)) {
          score += 15;
        }

        // Ingredient match
        if (pIngredients.includes(token) || pIngredients.includes(stemmed)) {
          score += 18;
        }

        // Variant name (e.g. "50ml", "60 capsules")
        if (variantTexts.some((vt) => vt.includes(token))) {
          score += 15;
        }

        // Benefits & Highlights
        if (pBenefits.includes(token) || pBenefits.includes(stemmed)) {
          score += 12;
        }

        // Specifications
        if (pSpecs.includes(token) || pSpecs.includes(stemmed)) {
          score += 10;
        }

        // Tags
        if (pTags.includes(token) || pTags.includes(stemmed)) {
          score += 8;
        }

        // Description
        if (pDescription.includes(token)) {
          score += 4;
        }

        // Typo check against product name tokens if no direct token match yet
        if (!pName.includes(token) && token.length >= 5) {
          const nameWords = pName.split(/\s+/);
          for (const nw of nameWords) {
            if (nw.length >= 4 && levenshtein(token, nw) <= (token.length >= 7 ? 2 : 1)) {
              score += 12;
              break;
            }
          }
        }
      }

      // 7. EXPANDED SYNONYM TOKENS
      for (const syn of expandedTokens) {
        if (!queryTokens.includes(syn)) {
          if (pName.includes(syn)) score += 12;
          if (pCategory.includes(syn)) score += 10;
          if (pIngredients.includes(syn)) score += 10;
          if (pBenefits.includes(syn)) score += 8;
          if (pTags.includes(syn)) score += 6;
          if (pDescription.includes(syn)) score += 3;
        }
      }

      // 8. ADMIN RANKING BOOST
      const matchingBoost = boosts.find(
        (b) =>
          b.productId === p.id ||
          b.productId === p.slug ||
          (b.queryKeyword && lowerQuery.includes(b.queryKeyword.toLowerCase()))
      );
      if (matchingBoost) {
        score += matchingBoost.boostScore;
      }

      if (score > 0) {
        scoredList.push({ product: p, score });
      }
    }

    // Sort by relevance score descending
    scoredList.sort((a, b) => b.score - a.score);

    // Filter by Category if specified
    let filtered = scoredList;
    if (options.category && options.category !== "all") {
      const catLower = options.category.toLowerCase();
      filtered = filtered.filter((item) => (item.product.category || "").toLowerCase() === catLower);
    }

    // Filter by In-Stock if specified
    if (options.inStockOnly) {
      filtered = filtered.filter((item) => {
        const stock = Number(item.product.stock || 0);
        return stock > 0 || Boolean(item.product.preorderEnabled);
      });
    }

    // Filter by Price range if specified
    if (options.minPrice !== undefined) {
      filtered = filtered.filter((item) => Number(item.product.price || 0) >= options.minPrice!);
    }
    if (options.maxPrice !== undefined) {
      filtered = filtered.filter((item) => Number(item.product.price || 0) <= options.maxPrice!);
    }

    // Compute Category Facets
    const categoryCountMap: Record<string, number> = {};
    scoredList.forEach(({ product }) => {
      const cat = product.category || "General";
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
    });
    const categoryFacets: SearchFacetItem[] = Object.entries(categoryCountMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Compute Price Bounds
    const allMatchingPrices = scoredList.map((i) => Number(i.product.price || 0)).filter((p) => p > 0);
    const priceBounds = {
      min: allMatchingPrices.length > 0 ? Math.min(...allMatchingPrices) : 0,
      max: allMatchingPrices.length > 0 ? Math.max(...allMatchingPrices) : 5000,
    };

    // Apply Sorting
    const sort = options.sort || "relevance";
    if (sort === "price_asc") {
      filtered.sort((a, b) => Number(a.product.price || 0) - Number(b.product.price || 0));
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => Number(b.product.price || 0) - Number(a.product.price || 0));
    } else if (sort === "rating_desc") {
      filtered.sort((a, b) => Number(b.product.rating || 0) - Number(a.product.rating || 0));
    } else if (sort === "newest") {
      filtered.sort((a, b) => new Date(b.product.createdAt || 0).getTime() - new Date(a.product.createdAt || 0).getTime());
    }

    // Generate query autocomplete suggestions (up to 5)
    const suggestionsSet = new Set<string>();
    filtered.slice(0, 5).forEach(({ product }) => {
      suggestionsSet.add(product.name);
      if (product.category) suggestionsSet.add(product.category);
    });
    if (correctedQuery && correctedQuery !== rawQuery) {
      suggestionsSet.add(correctedQuery);
    }
    const suggestions = Array.from(suggestionsSet).slice(0, 6);

    // Pagination
    const totalCount = filtered.length;
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.max(1, Math.min(50, Number(options.limit || (options.type === "suggest" ? 6 : 12))));
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const hasMore = page < totalPages;

    // Transform products into secure, client-safe SearchProductResult
    const results: SearchProductResult[] = paginatedItems.map(({ product: p, score }) => {
      const stock = Number(p.stock || 0);
      const isPreorder = stock <= 0 && Boolean(p.preorderEnabled);
      const inStock = stock > 0 || isPreorder;
      const scarcityMessage = inventoryService.getScarcityMessage(p);
      const discount =
        p.mrp && p.mrp > p.price
          ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
          : p.discount;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.image || (Array.isArray(p.images) && p.images[0]) || "",
        price: p.price,
        mrp: p.mrp,
        discount,
        category: p.category || "General",
        stock,
        description: p.shortDescription || p.description,
        scarcityMessage,
        inStock,
        isPreorder,
        rating: p.rating,
        reviewCount: p.reviewCount,
        score,
        variantCount: Array.isArray(p.variants) ? p.variants.length : 0,
        highlights: Array.isArray(p.benefits) ? p.benefits : undefined,
      };
    });

    // Record privacy-safe analytics
    if (options.type !== "suggest") {
      void searchStore.recordSearch({
        query: rawQuery,
        resultCount: totalCount,
      });
    }

    return {
      query: rawQuery,
      correctedQuery,
      results,
      totalCount,
      suggestions,
      categoryFacets,
      priceBounds,
      page,
      totalPages,
      hasMore,
    };
  },

  /**
   * Builds fallback response when search query is empty.
   */
  buildDefaultResponse(products: Product[], options: SearchQueryOptions): SearchResponse {
    const activeProducts = products.filter((p) => p.active !== false && p.visible !== false);
    let filtered = [...activeProducts];

    if (options.inStockOnly) {
      filtered = filtered.filter((p) => Number(p.stock || 0) > 0 || Boolean(p.preorderEnabled));
    }
    if (options.category && options.category !== "all") {
      filtered = filtered.filter((p) => (p.category || "").toLowerCase() === options.category!.toLowerCase());
    }

    const sort = options.sort || "relevance";
    if (sort === "price_asc") {
      filtered.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sort === "rating_desc") {
      filtered.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sort === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    const limit = Math.max(1, Math.min(50, Number(options.limit || 12)));
    const page = Math.max(1, Number(options.page || 1));
    const startIndex = (page - 1) * limit;

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const results: SearchProductResult[] = filtered.slice(startIndex, startIndex + limit).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image || (Array.isArray(p.images) && p.images[0]) || "",
      price: p.price,
      mrp: p.mrp,
      discount: p.discount,
      category: p.category || "General",
      stock: Number(p.stock || 0),
      description: p.shortDescription || p.description,
      scarcityMessage: inventoryService.getScarcityMessage(p),
      inStock: Number(p.stock || 0) > 0 || Boolean(p.preorderEnabled),
      isPreorder: Number(p.stock || 0) <= 0 && Boolean(p.preorderEnabled),
      rating: p.rating,
      reviewCount: p.reviewCount,
      score: 1,
      variantCount: Array.isArray(p.variants) ? p.variants.length : 0,
    }));

    const categoryCountMap: Record<string, number> = {};
    activeProducts.forEach((p) => {
      const cat = p.category || "General";
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
    });

    const prices = activeProducts.map((p) => p.price).filter(Boolean);

    return {
      query: "",
      results,
      totalCount,
      suggestions: ["Lumine-C Radiance", "Biome Balance", "Nocturne Magnesium", "Sculpture SPF 50"],
      categoryFacets: Object.entries(categoryCountMap).map(([name, count]) => ({ name, count })),
      priceBounds: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 5000,
      },
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },
};
