import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const reviews = await store.reviews.all();
  return json({ reviews });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const rating = Number(body.rating || 5);
  const productId = String(body.productId || "");

  if (!productId || rating < 1 || rating > 5) {
    return json({ error: "productId and rating (1-5) required" }, 422);
  }

  const review = await store.reviews.create({
    productId,
    customerName: body.customerName || body.author || body.name || "Customer",
    rating,
    title: safeText(body.title || "", 120),
    body: safeText(body.body || body.text || "", 2000),
    verified: Boolean(body.verified),
    visible: body.visible !== false,
    image: body.image || "",
    response: safeText(body.response || body.pharmacistResponse || "", 2000),
  });

  return json({ review }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const id = body.reviewId || body.id;
  if (!id) return json({ error: "reviewId or id required" }, 422);

  const updates: Record<string, unknown> = {};
  if (body.visible !== undefined) updates.visible = Boolean(body.visible);
  if (body.verified !== undefined) updates.verified = Boolean(body.verified);
  if (body.response !== undefined || body.pharmacistResponse !== undefined) {
    updates.response = safeText(body.response ?? body.pharmacistResponse, 2000);
  }
  if (body.rating !== undefined) updates.rating = Number(body.rating);
  if (body.title !== undefined) updates.title = safeText(body.title, 120);
  if (body.body !== undefined) updates.body = safeText(body.body, 2000);

  const review = await store.reviews.update(id, updates);
  return json({ review });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("reviewId") || searchParams.get("id");
  if (!reviewId) return json({ error: "reviewId required" }, 422);
  await store.reviews.delete(reviewId);
  return json({ ok: true });
}
