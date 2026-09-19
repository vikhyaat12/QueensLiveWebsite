import { json, requireUser, safeText } from "@/lib/http";
import { promotionsStore } from "@/lib/commerce/promotions-store";
import type { AffiliateCampaign } from "@/lib/commerce/promotions-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const campaigns = await promotionsStore.listAffiliateCampaigns({ activeOnly: false });
  return json({ campaigns });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const campaignData = (body.campaign || body) as Partial<AffiliateCampaign>;

  if (!campaignData.name) {
    return json({ error: "Campaign name is required" }, 422);
  }

  const saved = await promotionsStore.saveAffiliateCampaign(campaignData);
  return json({ success: true, campaign: saved });
}

export async function PUT(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const campaignData = (body.campaign || body) as Partial<AffiliateCampaign>;

  if (!campaignData.id) {
    return json({ error: "Campaign ID is required for updates" }, 400);
  }

  const saved = await promotionsStore.saveAffiliateCampaign(campaignData);
  return json({ success: true, campaign: saved });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return json({ error: "Campaign ID parameter required" }, 400);

  const deleted = await promotionsStore.deleteAffiliateCampaign(id);
  if (!deleted) return json({ error: "Campaign not found" }, 404);

  return json({ success: true });
}
