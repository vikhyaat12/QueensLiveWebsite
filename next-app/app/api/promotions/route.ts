import { NextRequest, NextResponse } from "next/server";
import { promotionsStore } from "@/lib/commerce/promotions-store";
import type { DeviceTarget } from "@/lib/commerce/promotions-types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slot = searchParams.get("slot") || undefined;
    const pageType = searchParams.get("pageType") || undefined;
    const route = searchParams.get("route") || undefined;
    const device = (searchParams.get("device") as DeviceTarget) || undefined;
    const cartSubtotal = Number(searchParams.get("cartSubtotal") || 0);

    const items = await promotionsStore.listPromotions({
      slot,
      pageType,
      route,
      device,
      admin: false,
    });

    // Compute dynamic server-authoritative values for gamification widgets
    const enriched = await Promise.all(
      items.map(async (item) => {
        if (item.type === "gamification" && item.content?.gamification) {
          const computed = await promotionsStore.calculateGamificationProgress(
            item.content.gamification,
            cartSubtotal
          );
          return {
            ...item,
            content: {
              ...item.content,
              gamification: computed,
            },
          };
        }
        return item;
      })
    );

    return NextResponse.json({ promotions: enriched });
  } catch (error: unknown) {
    console.error("Promotions fetch error:", error);
    // Return empty array gracefully so UI never breaks
    return NextResponse.json({ promotions: [] }, { status: 200 });
  }
}
