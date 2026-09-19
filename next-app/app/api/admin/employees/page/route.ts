import { json, requireUser } from "@/lib/http";
import { ourPeoplePageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const config = await ourPeoplePageStore.get();
  return json({ config });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload" }, 400);

  const updated = await ourPeoplePageStore.save(body);
  return json({ config: updated });
}
