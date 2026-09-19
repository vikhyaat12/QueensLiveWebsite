import { json, requireUser, safeText } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { store } from "@/lib/commerce/store";

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  try {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, createdAt: true },
    });
    if (fullUser) return json({ user: fullUser });
  } catch {}

  const localUser = await store.users.byId(user.id);
  if (localUser) {
    const { passwordHash, ...safeUser } = localUser as unknown as Record<string, unknown>;
    return json({ user: safeUser });
  }
  return json({ user });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = safeText(body.name, 80);
  if (body.phone !== undefined) data.phone = safeText(String(body.phone || ""), 20);

  if (Object.keys(data).length) {
    try {
      await prisma.user.update({ where: { id: user.id }, data });
    } catch {}
    await store.users.update(user.id, data);
  }
  const updatedUser = await store.users.byId(user.id);
  const { passwordHash, ...safeUser } = (updatedUser || {}) as unknown as Record<string, unknown>;
  return json({ ok: true, user: safeUser });
}

