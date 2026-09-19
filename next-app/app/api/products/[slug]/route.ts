import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { redirectStore, slugValidator } from "@/lib/commerce/store-extensions";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  let product = await store.products.bySlug(slug);
  if (!product && slug === "lumine-c") {
    product = await store.products.bySlug("lumine-c-serum");
  }
  return product ? json({ product }) : json({ error: "Not found" }, 404);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const identifier = (await params).slug;
  const body = await request.json().catch(() => ({}));

  let existing = await store.products.bySlug(identifier);
  if (!existing && body.id) {
    existing = await store.products.bySlug(String(body.id));
  }
  if (!existing && !body.id && !body.slug) {
    return json({ error: "Product not found" }, 404);
  }

  const existingId = existing ? existing.id : (body.id || identifier);
  const oldSlug = existing ? existing.slug : identifier;
  let newSlug = oldSlug;

  if (body.slug && typeof body.slug === "string") {
    const valResult = await slugValidator.validate(body.slug, "product", existingId);
    if (!valResult.valid) {
      return json({ error: valResult.error || "This URL is already in use." }, 400);
    }
    newSlug = valResult.normalizedSlug;
  }

  try {
    const updated = await store.products.save({
      ...body,
      id: existingId,
      slug: newSlug,
    });

    // If slug changed, create 301 permanent redirect from old PDP to new PDP
    if (oldSlug && newSlug && oldSlug !== newSlug) {
      await redirectStore.createOrUpdate(
        `/products/${oldSlug}`,
        `/products/${newSlug}`,
        "product",
        existingId,
        true
      );
    }

    return json({ product: updated });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Update failed" }, 400);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ slug: string }> }) {
  return PATCH(request, context);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const identifier = (await params).slug;
  const success = await store.products.delete(identifier);
  if (success) {
    return json({ ok: true });
  }
  return json({ error: "Delete failed or product not found" }, 400);
}
