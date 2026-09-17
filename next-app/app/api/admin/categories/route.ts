import { json, requireUser, safeText } from "@/lib/http";
import { categoryStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  // Admin/employee only — the public shop derives categories from product data,
  // and /api/products already exposes what customers need.
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const categories = await categoryStore.list();
  return json({ categories });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const name = safeText(body.name, 80);
  if (!name) return json({ error: "Name required" }, 422);
  const slug = safeText(body.slug, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  try {
    const category = await categoryStore.create({
      name,
      slug,
      description: body.description || null,
      image: body.image || null,
      sort: Number(body.sort || 0),
      active: body.active !== false,
      visible: body.visible !== false,
    });
    return json({ category }, 201);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed" }, 400);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["name", "slug", "description", "image", "sort", "active", "visible"]) {
    if (k in body) data[k] = body[k];
  }
  const category = await categoryStore.update(body.id, data);
  return json({ category });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await categoryStore.delete(id);
  return json({ ok: true });
}
