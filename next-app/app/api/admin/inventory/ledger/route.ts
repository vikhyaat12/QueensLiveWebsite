import { json, requireUser } from "@/lib/http";
import { inventoryService } from "@/lib/commerce/inventory";

export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const limit = Number(url.searchParams.get("limit") || 100);

  const ledger = await inventoryService.getLedger({ productId, type, limit });

  return json({ ledger });
}
