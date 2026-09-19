import { json } from "@/lib/http";
import { searchEngine } from "@/lib/commerce/search-engine";
import type { SearchQueryOptions } from "@/lib/commerce/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const type = (url.searchParams.get("type") as "suggest" | "full") || (url.searchParams.has("full") ? "full" : "suggest");
  const category = url.searchParams.get("category") || undefined;
  const inStockOnly = url.searchParams.get("inStock") === "true";
  const minPrice = url.searchParams.has("minPrice") ? Number(url.searchParams.get("minPrice")) : undefined;
  const maxPrice = url.searchParams.has("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined;
  const sort = (url.searchParams.get("sort") as SearchQueryOptions["sort"]) || "relevance";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || (type === "suggest" ? 6 : 12))));

  const response = await searchEngine.search({
    q,
    type,
    category,
    inStockOnly,
    minPrice,
    maxPrice,
    sort,
    page,
    limit,
  });

  return json(response);
}
