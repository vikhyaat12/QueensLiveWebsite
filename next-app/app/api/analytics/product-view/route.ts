import { NextRequest, NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";

export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/product-view
 *
 * Records a product_view event server-side. The PDP calls this from its
 * server component render (fire-and-forget), because the previous inline
 * client script raced React hydration and silently dropped every
 * product_view event (0 recorded out of 3,137 events — funnel stage empty).
 *
 * Dedup: one event per product+session per minute, so navigating back and
 * forth doesn't inflate the funnel. No PII recorded.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { productSlug?: string; productName?: string; category?: string; sessionKey?: string };
    const slug = typeof body.productSlug === "string" ? body.productSlug.slice(0, 120) : "";
    if (!slug) return NextResponse.json({ error: "productSlug required" }, { status: 400 });

    const name = typeof body.productName === "string" ? body.productName.replace(/[<>"']/g, "").slice(0, 200) : "";
    const category = typeof body.category === "string" ? body.category.replace(/[<>"']/g, "").slice(0, 100) : "";
    const sessionKey = typeof body.sessionKey === "string" ? body.sessionKey.slice(0, 80) : "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

    // Rate/dedup guard: same product + same visitor within 60s is not a new view
    const now = Date.now();
    const recent = fileDb.findMany("analyticsEvents", (e: Record<string, unknown>) =>
      e.event === "product_view" && e.productSlug === slug && String(e.visitorId || "") === sessionKey &&
      now - new Date(String(e.timestamp)).getTime() < 60_000
    );
    if (recent.length > 0) return NextResponse.json({ ok: true, deduped: true });

    const ua = req.headers.get("user-agent") || "";
    const device = /Mobi|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";

    fileDb.insert("analyticsEvents", {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventId: `pv-${sessionKey}-${slug}-${now}`,
      event: "product_view",
      page: `/products/${slug}`,
      product: name,
      productSlug: slug,
      category,
      sessionId: sessionKey,
      visitorId: sessionKey,
      device,
      browser: ua.slice(0, 100),
      source: req.headers.get("referer") || "",
      ip,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("product-view analytics error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
