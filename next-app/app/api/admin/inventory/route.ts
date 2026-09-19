import { json, requireUser } from "@/lib/http";
import { inventoryService } from "@/lib/commerce/inventory";

export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const category = url.searchParams.get("category") || undefined;

  const overview = await inventoryService.getInventoryOverview();
  const items = await inventoryService.listInventoryItems({ search, status, category });

  return json({
    overview,
    items,
  });
}
