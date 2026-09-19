import { json, requireUser } from "@/lib/http";
import { pageSettingsStore, slugValidator, redirectStore, normalizeSlug, normalizePath } from "@/lib/commerce/store-extensions";
import { fileDb } from "@/lib/commerce/file-db";
import { revalidatePath } from "next/cache";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const [pages, publishStatus, liveNav] = await Promise.all([
    pageSettingsStore.list(),
    pageSettingsStore.getPublishStatus(),
    pageSettingsStore.getLiveHeaderNav(),
  ]);
  return json({ pages, publishStatus, liveNav });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));

  if (body.action === "publish") {
    // Detect slug changes between previously published and current draft
    const currentPublished = (fileDb.findMany("publishedHeaderNav") || []) as Array<Record<string, unknown>>;
    const currentDraft = (fileDb.findMany("pageSettings") || []) as Array<Record<string, unknown>>;
    for (const draft of currentDraft) {
      const prev = currentPublished.find((p) => String(p.id) === String(draft.id));
      if (prev && prev.slug && draft.slug) {
        const oldSlug = normalizeSlug(String(prev.slug));
        const newSlug = normalizeSlug(String(draft.slug));
        if (oldSlug && newSlug && oldSlug !== newSlug) {
          const oldPath = normalizePath(oldSlug.startsWith("/") ? oldSlug : `/${oldSlug}`);
          const newPath = normalizePath(newSlug.startsWith("/") ? newSlug : `/${newSlug}`);
          if (oldPath !== newPath && oldPath !== "/" && newPath !== "/") {
            await redirectStore.createOrUpdate(oldPath, newPath, "page", String(draft.id), true);
          }
        }
      }
    }

    const result = await pageSettingsStore.publish(user.email);
    try { revalidatePath("/", "layout"); } catch {}
    return json(result);
  }

  if (body.action === "discard_draft") {
    const result = await pageSettingsStore.discardDraft();
    try { revalidatePath("/", "layout"); } catch {}
    return json(result);
  }

  if (!body.title || !body.slug) return json({ error: "Title and slug are required" }, 400);

  const valResult = await slugValidator.validate(body.slug, "page");
  if (!valResult.valid) {
    return json({ error: valResult.error || "This URL is already in use." }, 400);
  }

  const item = await pageSettingsStore.create({
    title: body.title,
    slug: valResult.normalizedSlug,
    label: body.label || body.title,
    headerVisible: body.headerVisible !== false,
    footerVisible: body.footerVisible !== false,
    sortOrder: body.sortOrder ?? 0,
    active: body.active !== false,
    isAnchor: body.isAnchor || false,
  });
  return json({ item }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const { id, ...data } = body;

  if (data.slug) {
    const valResult = await slugValidator.validate(String(data.slug), "page", id);
    if (!valResult.valid) {
      return json({ error: valResult.error || "This URL is already in use." }, 400);
    }
    data.slug = valResult.normalizedSlug;
  }

  const item = await pageSettingsStore.update(id, data);
  return json({ item });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await pageSettingsStore.remove(id);
  return json({ ok: true });
}
