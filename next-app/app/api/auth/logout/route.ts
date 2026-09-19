import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function POST() {
  const user = await requireUser().catch(() => null);
  if (user) {
    await store.users.update(user.id, { tokenVersion: (user.tokenVersion || 1) + 1 }).catch(() => null);
  }
  const response = json({ ok: true });
  response.cookies.set("qc_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
