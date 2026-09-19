import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET() {
  const u = await requireUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  const productIds = await store.wishlist.get(u.id);
  const items = await store.wishlist.getItemsWithProducts(u.id);
  return json({ productIds, items });
}

export async function POST(request: Request) {
  const u = await requireUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  const b = await request.json().catch(() => null);
  const id = String(b?.productId || "");
  const action = b?.action || "toggle";
  const productsAll = await store.products.all();
  const found = productsAll.find((p) => p.id === id || p.slug === id);
  if (!found) return json({ error: "Product not found" }, 404);

  let productIds: string[];
  if (action === "add") {
    productIds = await store.wishlist.add(u.id, found.id);
  } else if (action === "remove") {
    productIds = await store.wishlist.remove(u.id, found.id);
  } else {
    productIds = await store.wishlist.toggle(u.id, found.id);
  }

  const items = await store.wishlist.getItemsWithProducts(u.id);
  return json({ productIds, items });
}

export async function DELETE(request: Request) {
  const u = await requireUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  let productId = searchParams.get("productId");
  if (!productId) {
    const b = await request.json().catch(() => null);
    productId = b?.productId;
  }
  if (!productId) return json({ error: "Product ID required" }, 422);

  const productIds = await store.wishlist.remove(u.id, productId);
  const items = await store.wishlist.getItemsWithProducts(u.id);
  return json({ productIds, items, ok: true });
}


