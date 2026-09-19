import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { slugValidator, redirectStore, normalizeSlug } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const posts = await store.posts.list(true);
  return json({ posts });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const b = await request.json().catch(() => null);
  const title = safeText(b?.title, 180);
  const rawSlug = safeText(b?.slug, 160) || title;
  if (!title || !rawSlug) return json({ error: "Title and slug are required." }, 422);

  const valResult = await slugValidator.validate(rawSlug, "blog");
  if (!valResult.valid) {
    return json({ error: valResult.error || "This URL is already in use." }, 400);
  }
  const slug = valResult.normalizedSlug;

  const post = await store.posts.save({
    title,
    slug,
    excerpt: safeText(b?.excerpt, 500),
    body: safeText(b?.body, 50000),
    content: b?.content || b?.body,
    category: b?.category || undefined,
    tags: b?.tags || undefined,
    author: b?.author || undefined,
    readTime: b?.readTime || undefined,
    image: b?.image || undefined,
    images: b?.images || undefined,
    videoUrl: b?.videoUrl || undefined,
    videoTitle: b?.videoTitle || undefined,
    featured: Boolean(b?.featured),
    seoTitle: b?.seoTitle || undefined,
    seoDescription: b?.seoDescription || undefined,
    ogImage: b?.ogImage || undefined,
    published: Boolean(b?.published),
    visible: b?.visible !== false,
  });
  return json({ post }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id && !body.slug) return json({ error: "id or slug required" }, 422);

  const allPosts = await store.posts.list(true);
  const existing = allPosts.find((p) => p.id === body.id || p.slug === body.slug);
  const oldSlug = existing ? normalizeSlug(existing.slug) : "";
  const postId = existing ? existing.id : body.id;

  const data: Record<string, unknown> = {};
  const fields = [
    "title", "slug", "excerpt", "body", "content", "category", "tags",
    "author", "readTime", "image", "images", "videoUrl", "videoTitle",
    "featured", "published", "visible", "seoTitle", "seoDescription", "ogImage",
  ];
  for (const k of fields) {
    if (k in body) data[k] = body[k];
  }

  if (body.slug) {
    const valResult = await slugValidator.validate(String(body.slug), "blog", postId);
    if (!valResult.valid) {
      return json({ error: valResult.error || "This URL is already in use." }, 400);
    }
    data.slug = valResult.normalizedSlug;

    if (oldSlug && oldSlug !== valResult.normalizedSlug) {
      await redirectStore.createOrUpdate(
        `/blog/${oldSlug}`,
        `/blog/${valResult.normalizedSlug}`,
        "blog",
        postId,
        true
      );
    }
  }

  const post = await store.posts.save({ id: postId, slug: (data.slug as string) || oldSlug, ...data });
  return json({ post });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || searchParams.get("slug");
  if (!id) return json({ error: "id required" }, 422);
  await store.posts.delete(id);
  return json({ ok: true });
}
