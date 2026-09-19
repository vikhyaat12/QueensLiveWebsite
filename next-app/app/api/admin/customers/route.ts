import { json, requireUser } from "@/lib/http";
import { customerStore } from "@/lib/commerce/store-extensions";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  const [customers, total] = await Promise.all([
    customerStore.list({ search, status }),
    customerStore.count(),
  ]);
  return json({ customers, total });
}

