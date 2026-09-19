import { json, requireUser, safeText } from "@/lib/http";
import { promotionsStore } from "@/lib/commerce/promotions-store";
import type { PromoComponent } from "@/lib/commerce/promotions-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const slot = searchParams.get("slot") || undefined;
  const status = (searchParams.get("status") as any) || "all";

  const promotions = await promotionsStore.listPromotions({
    slot,
    status,
    admin: true,
  });

  const settings = await promotionsStore.getGlobalSettings();

  return json({
    promotions,
    settings,
  });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const action = safeText(body.action);

  if (action === "duplicate") {
    const id = safeText(body.id);
    if (!id) return json({ error: "Component ID is required to duplicate" }, 400);

    try {
      const cloned = await promotionsStore.duplicatePromotion(id);
      return json({ success: true, promotion: cloned });
    } catch (err: any) {
      return json({ error: err.message || "Failed to duplicate promotion" }, 400);
    }
  }

  // Create new component
  const promotionData = (body.promotion || body) as Partial<PromoComponent>;
  if (!promotionData.name || !promotionData.type) {
    return json({ error: "Component name and type are required" }, 422);
  }

  const saved = await promotionsStore.savePromotion(promotionData);
  return json({ success: true, promotion: saved });
}

export async function PUT(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const promotionData = (body.promotion || body) as Partial<PromoComponent>;

  if (!promotionData.id) {
    return json({ error: "Component ID is required for updates" }, 400);
  }

  const saved = await promotionsStore.savePromotion(promotionData);
  return json({ success: true, promotion: saved });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return json({ error: "ID query parameter required" }, 400);

  const deleted = await promotionsStore.deletePromotion(id);
  if (!deleted) return json({ error: "Component not found or could not be deleted" }, 404);

  return json({ success: true });
}
