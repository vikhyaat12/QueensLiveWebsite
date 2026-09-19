import "server-only";
import { fileDb } from "./file-db";

export interface SearchSynonymRule {
  id: string;
  source: string;
  targets: string[];
  active: boolean;
  createdAt: string;
}

export interface SearchBoostRule {
  id: string;
  productId: string;
  queryKeyword?: string;
  boostScore: number; // e.g. 10 to 50
  active: boolean;
  notes?: string;
}

export interface SearchAnalyticsRecord {
  id: string;
  query: string;
  resultCount: number;
  hasResults: boolean;
  clickedProductId?: string;
  convertedToCart?: boolean;
  createdAt: string;
}

const DEFAULT_SYNONYMS: Record<string, string[]> = {
  paracitamol: ["paracetamol", "antipyretic", "fever", "pain", "analgesic"],
  paracetamol: ["paracetamol", "fever", "pain", "relief", "analgesic"],
  pcm: ["paracetamol", "fever", "pain"],
  magnezium: ["magnesium", "glycinate", "sleep", "nocturne"],
  magnesium: ["nocturne", "sleep", "recovery", "glycinate", "bisglycinate", "relaxation"],
  vitamine: ["vitamin", "lumine", "ascorbic", "glow"],
  vitaminc: ["vitamin c", "lumine", "ascorbic", "radiance", "antioxidant"],
  suncreen: ["sunscreen", "sculpture", "spf", "uv"],
  sunscreen: ["sculpture", "spf 50", "uv protection", "sunblock", "pa++++"],
  gut: ["biome", "digestive", "microbiome", "synbiotic", "probiotic", "probiotics", "stomach", "bloating", "acidity"],
  stomach: ["biome", "digestive", "microbiome", "gut", "acidity", "bloating"],
  acidity: ["gut", "digestive", "stomach", "bloating", "biome"],
  sleep: ["nocturne", "magnesium", "glycinate", "calm", "insomnia", "relaxation", "rest"],
  insomnia: ["sleep", "nocturne", "magnesium", "rest"],
  glow: ["lumine", "vitamin c", "radiance", "serum", "dermal", "skin", "brightening"],
  skin: ["dermal", "radiance", "lumine", "sculpture", "spf", "sunscreen", "serum"],
  energy: ["vitality", "fatigue", "tired", "stamina", "lycopene", "suspension", "multivitamin"],
  vitality: ["energy", "fatigue", "stamina", "lycopene"],
  hair: ["skin", "biotin", "collagen", "keratin"],
  immunity: ["defense", "infection", "cold", "flu", "cough", "immune", "zinc"],
  cough: ["respiratory", "pulmonary", "bronchial", "breathe", "cold"],
  breathe: ["respiratory", "bronchial", "pulmonary", "lungs", "airway"],
  joint: ["bone", "mobility", "cartilage", "calcium", "stiffness", "d3"],
  bone: ["joint", "calcium", "mobility", "knee", "arthritis", "d3"],
  kids: ["children", "pediatric", "child"],
  child: ["kids", "children", "pediatric"],
  dawa: ["medicine", "formulation", "capsule", "tablet", "serum"],
  neend: ["sleep", "nocturne", "magnesium"],
  pet: ["gut", "stomach", "digestive", "biome"],
};

export const searchStore = {
  /**
   * Retrieves merged map of built-in + admin custom synonyms.
   */
  async getSynonyms(): Promise<Record<string, string[]>> {
    const merged: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(DEFAULT_SYNONYMS)) {
      merged[k.toLowerCase()] = [...v];
    }

    try {
      const customRules = fileDb.findMany("settings", (s) => s.key === "search_custom_synonyms");
      if (customRules.length > 0 && Array.isArray(customRules[0].value)) {
        for (const rule of customRules[0].value as SearchSynonymRule[]) {
          if (rule.active && rule.source && Array.isArray(rule.targets)) {
            const key = rule.source.toLowerCase().trim();
            if (!merged[key]) merged[key] = [];
            for (const t of rule.targets) {
              const lowerT = t.toLowerCase().trim();
              if (!merged[key].includes(lowerT)) {
                merged[key].push(lowerT);
              }
            }
          }
        }
      }
    } catch {
      // Fallback to defaults
    }

    return merged;
  },

  /**
   * Retrieves active ranking boosts configured by admin.
   */
  async getBoosts(): Promise<SearchBoostRule[]> {
    try {
      const saved = fileDb.findMany("settings", (s) => s.key === "search_ranking_boosts");
      if (saved.length > 0 && Array.isArray(saved[0].value)) {
        return (saved[0].value as SearchBoostRule[]).filter((b) => b.active);
      }
    } catch {
      // Fallback
    }
    return [];
  },

  /**
   * Adds or updates a custom synonym mapping.
   */
  async addSynonym(source: string, targets: string[]): Promise<void> {
    const s = source.toLowerCase().trim();
    const cleanTargets = targets.map((t) => t.toLowerCase().trim()).filter(Boolean);
    const existing = fileDb.findMany("settings", (item) => item.key === "search_custom_synonyms");
    const list = existing.length > 0 && Array.isArray(existing[0].value) ? (existing[0].value as any[]) : [];
    const updated = list.filter((r: any) => r.source !== s);
    updated.push({
      id: `syn-${Date.now()}`,
      source: s,
      targets: cleanTargets,
      active: true,
      createdAt: new Date().toISOString(),
    });
    fileDb.update("settings", { key: "search_custom_synonyms" }, { key: "search_custom_synonyms", value: updated });
  },

  /**
   * Adds or updates a ranking boost rule.
   */
  async setBoost(boost: SearchBoostRule): Promise<void> {
    const existing = fileDb.findMany("settings", (item) => item.key === "search_ranking_boosts");
    const list = existing.length > 0 && Array.isArray(existing[0].value) ? (existing[0].value as any[]) : [];
    const updated = list.filter((b: any) => b.productId !== boost.productId || b.queryKeyword !== boost.queryKeyword);
    updated.push(boost);
    fileDb.update("settings", { key: "search_ranking_boosts" }, { key: "search_ranking_boosts", value: updated });
  },

  /**
   * Records privacy-safe search analytics event.
   */
  async recordSearch(params: {
    query: string;
    resultCount: number;
    clickedProductId?: string;
  }): Promise<void> {
    const q = params.query.trim().slice(0, 100).toLowerCase();
    if (!q) return;

    try {
      fileDb.insert("analyticsEvents", {
        id: `srch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        event: "search_query",
        query: q,
        resultCount: params.resultCount,
        hasResults: params.resultCount > 0,
        clickedProductId: params.clickedProductId || null,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-blocking analytics
    }
  },

  /**
   * Aggregates search volume, top queries, and zero-result queries for Admin insights.
   */
  async getAnalyticsSummary(): Promise<{
    totalSearches: number;
    topQueries: Array<{ query: string; count: number; avgResults: number }>;
    zeroResultQueries: Array<{ query: string; count: number; lastSearched: string }>;
  }> {
    try {
      const events = fileDb.findMany("analyticsEvents", (e) => e.event === "search_query");
      const queryMap: Record<string, { count: number; totalResults: number; lastSearched: string }> = {};

      for (const ev of events) {
        const q = String(ev.query || "").trim();
        if (!q) continue;
        if (!queryMap[q]) {
          queryMap[q] = { count: 0, totalResults: 0, lastSearched: String(ev.timestamp || "") };
        }
        queryMap[q].count++;
        queryMap[q].totalResults += Number(ev.resultCount || 0);
        queryMap[q].lastSearched = String(ev.timestamp || queryMap[q].lastSearched);
      }

      const topQueries = Object.entries(queryMap)
        .map(([query, data]) => ({
          query,
          count: data.count,
          avgResults: Math.round(data.totalResults / data.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      const zeroResultQueries = Object.entries(queryMap)
        .filter(([, data]) => data.totalResults === 0)
        .map(([query, data]) => ({
          query,
          count: data.count,
          lastSearched: data.lastSearched,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return {
        totalSearches: events.length,
        topQueries,
        zeroResultQueries,
      };
    } catch {
      return { totalSearches: 0, topQueries: [], zeroResultQueries: [] };
    }
  },
};
