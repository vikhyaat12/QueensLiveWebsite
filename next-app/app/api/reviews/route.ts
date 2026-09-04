import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("productId");
  return id ? json({ reviews: await store.reviews.list(id) }) : json({ error: "productId is required" }, 422);
}

export async function POST(request: Request) {
  const u = await requireUser();
  const b = await request.json().catch(() => null);
  const rating = Number(b?.rating);
  const productId = String(b?.productId || "");

  const productsAll = await store.products.all();
  const matchedProd = productsAll.find((p) => p.id === productId || p.slug === productId);
  if (!matchedProd || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "Invalid product or rating (1-5 required)." }, 422);
  }

  const review = await store.reviews.create({
    userId: u?.id,
    customerEmail: u?.email,
    customerName: safeText(b?.customerName || u?.name || "Customer", 80),
    productId: matchedProd.id,
    productSlug: matchedProd.slug,
    rating,
    title: safeText(b?.title || "", 120),
    body: safeText(b?.body || "", 1000),
  });

  return json({ review }, 201);
}
