import { json, requireUser } from "@/lib/http";
import { promotionsStore } from "@/lib/commerce/promotions-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const settings = await promotionsStore.getGlobalSettings();
  return json({ settings });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const patch: Record<string, any> = {};

  if (typeof body.globalEnabled === "boolean") patch.globalEnabled = body.globalEnabled;
  if (typeof body.tickersEnabled === "boolean") patch.tickersEnabled = body.tickersEnabled;
  if (typeof body.mediaEnabled === "boolean") patch.mediaEnabled = body.mediaEnabled;
  if (typeof body.gamificationEnabled === "boolean") patch.gamificationEnabled = body.gamificationEnabled;
  if (typeof body.affiliatePromosEnabled === "boolean") patch.affiliatePromosEnabled = body.affiliatePromosEnabled;

  const updated = await promotionsStore.updateGlobalSettings(patch, user.email || user.name || "admin");
  return json({ success: true, settings: updated });
}
