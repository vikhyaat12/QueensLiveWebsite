import { json, requireUser, safeText } from "@/lib/http";
import { searchStore } from "@/lib/commerce/search-store";
import { fileDb } from "@/lib/commerce/file-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const analytics = await searchStore.getAnalyticsSummary();
  const synonyms = await searchStore.getSynonyms();
  const boosts = await searchStore.getBoosts();

  return json({
    analytics,
    synonyms,
    boosts,
  });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const action = safeText(body.action);

  if (action === "add_synonym") {
    const source = safeText(body.source).toLowerCase();
    const targets = Array.isArray(body.targets)
      ? (body.targets as string[]).map((t) => safeText(t).toLowerCase()).filter(Boolean)
      : [];

    if (!source || targets.length === 0) {
      return json({ error: "Source term and at least one target required." }, 422);
    }

    const settings = fileDb.findMany("settings", (s) => s.key === "search_custom_synonyms");
    const list = settings.length > 0 && Array.isArray(settings[0].value) ? (settings[0].value as Array<Record<string, unknown>>) : [];

    const existingIdx = list.findIndex((r) => r.source === source);
    if (existingIdx >= 0) {
      list[existingIdx] = {
        id: list[existingIdx].id || `syn-${Date.now()}`,
        source,
        targets,
        active: true,
        updatedAt: new Date().toISOString(),
      };
    } else {
      list.push({
        id: `syn-${Date.now()}`,
        source,
        targets,
        active: true,
        createdAt: new Date().toISOString(),
      });
    }

    if (settings.length > 0) {
      fileDb.update("settings", { key: "search_custom_synonyms" }, { key: "search_custom_synonyms", value: list });
    } else {
      fileDb.insert("settings", { key: "search_custom_synonyms", value: list });
    }

    return json({ success: true, list });
  }

  if (action === "add_boost") {
    const productId = safeText(body.productId);
    const boostScore = Math.max(1, Math.min(100, Number(body.boostScore || 20)));
    const queryKeyword = safeText(body.queryKeyword) || undefined;
    const notes = safeText(body.notes) || undefined;

    if (!productId) {
      return json({ error: "ProductId is required for ranking boost." }, 422);
    }

    const settings = fileDb.findMany("settings", (s) => s.key === "search_ranking_boosts");
    const list = settings.length > 0 && Array.isArray(settings[0].value) ? (settings[0].value as Array<Record<string, unknown>>) : [];

    const existingIdx = list.findIndex((b) => b.productId === productId && b.queryKeyword === queryKeyword);
    if (existingIdx >= 0) {
      list[existingIdx] = {
        id: list[existingIdx].id || `bst-${Date.now()}`,
        productId,
        boostScore,
        queryKeyword,
        notes,
        active: true,
        updatedAt: new Date().toISOString(),
      };
    } else {
      list.push({
        id: `bst-${Date.now()}`,
        productId,
        boostScore,
        queryKeyword,
        notes,
        active: true,
        createdAt: new Date().toISOString(),
      });
    }

    if (settings.length > 0) {
      fileDb.update("settings", { key: "search_ranking_boosts" }, { key: "search_ranking_boosts", value: list });
    } else {
      fileDb.insert("settings", { key: "search_ranking_boosts", value: list });
    }

    return json({ success: true, list });
  }

  return json({ error: "Invalid action." }, 400);
}
