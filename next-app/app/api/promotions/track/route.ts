import { NextRequest, NextResponse } from "next/server";
import { promotionsStore } from "@/lib/commerce/promotions-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { promotionId, type } = body;

    if (!promotionId || (type !== "impression" && type !== "click")) {
      return NextResponse.json({ error: "Invalid tracking payload" }, { status: 400 });
    }

    await promotionsStore.recordAnalytics(String(promotionId), type);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Promotions tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}
