import { json, requireUser } from "@/lib/http";
import { addressStore } from "@/lib/commerce/store-extensions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { id } = await params;
  const existing = await addressStore.byId(id, user.id);
  if (!existing) return json({ error: "Address not found." }, 404);

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["label", "fullName", "phone", "address", "city", "state", "pincode", "isDefault"]) {
    if (k in body) data[k] = body[k];
  }
  const addr = await addressStore.update(id, user.id, data);
  return json({ address: addr });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { id } = await params;
  const existing = await addressStore.byId(id, user.id);
  if (!existing) return json({ error: "Address not found." }, 404);

  const deleted = await addressStore.delete(id, user.id);
  return json({ ok: deleted });
}

