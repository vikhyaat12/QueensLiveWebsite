import { json, requireUser, safeText } from "@/lib/http";
import { redirectStore } from "@/lib/commerce/store-extensions";

export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const contentType = searchParams.get("contentType") || undefined;
  const activeParam = searchParams.get("active");
  const active = activeParam !== null ? activeParam === "true" : undefined;

  const redirects = await redirectStore.list({ search, contentType, active });
  return json({ redirects });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const source = safeText(body.source, 500);
  const destination = safeText(body.destination, 500);
  const contentType = (body.contentType || "custom") as
    | "product"
    | "page"
    | "category"
    | "blog"
    | "custom";
  const contentId = body.contentId ? String(body.contentId) : undefined;

  if (!source || !destination) {
    return json({ error: "Source and destination paths are required." }, 400);
  }

  if (
    destination.startsWith("//") ||
    destination.includes("://") ||
    destination.startsWith("\\\\") ||
    !destination.startsWith("/")
  ) {
    return json({ error: "Destination must be an internal path starting with '/'." }, 400);
  }

  if (
    source.startsWith("//") ||
    source.includes("://") ||
    source.startsWith("\\\\") ||
    !source.startsWith("/")
  ) {
    return json({ error: "Source must be an internal path starting with '/'." }, 400);
  }

  const result = await redirectStore.createOrUpdate(
    source,
    destination,
    contentType,
    contentId,
    false
  );

  if (!result.ok) {
    return json({ error: result.error || "Failed to create redirect." }, 400);
  }

  return json({ redirect: result.rule }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const id = body.id ? String(body.id) : undefined;
  if (!id) return json({ error: "Redirect ID is required." }, 400);

  if (body.action === "toggle") {
    const updated = await redirectStore.toggleActive(id);
    if (!updated) return json({ error: "Redirect not found." }, 404);
    return json({ redirect: updated });
  }

  const patch: Record<string, unknown> = {};
  if (body.source) {
    const s = safeText(body.source, 500);
    if (s.startsWith("//") || s.includes("://") || s.startsWith("\\\\") || !s.startsWith("/")) {
      return json({ error: "Source must be an internal path starting with '/'." }, 400);
    }
    patch.source = s;
  }
  if (body.destination) {
    const d = safeText(body.destination, 500);
    if (d.startsWith("//") || d.includes("://") || d.startsWith("\\\\") || !d.startsWith("/")) {
      return json({ error: "Destination must be an internal path starting with '/'." }, 400);
    }
    patch.destination = d;
  }
  if (typeof body.active === "boolean") patch.active = body.active;

  const updated = await redirectStore.update(id, patch);
  if (!updated) return json({ error: "Redirect not found or update failed." }, 400);
  return json({ redirect: updated });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "Redirect ID is required." }, 400);

  const success = await redirectStore.delete(id);
  if (!success) return json({ error: "Redirect not found." }, 404);
  return json({ ok: true });
}
