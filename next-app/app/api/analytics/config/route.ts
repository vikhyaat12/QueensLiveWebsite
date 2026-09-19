import { NextResponse } from "next/server";
import { getAnalyticsConfig, publicAnalyticsSubset } from "@/lib/analytics/config";

export const dynamic = "force-dynamic";

/**
 * Public: returns the safe client subset of the analytics config.
 * Contains vendor IDs only (public-by-nature). No credentials.
 * The layout server component inlines this; this endpoint exists for
 * debugging and for client re-sync after admin changes.
 */
export async function GET() {
  const cfg = await getAnalyticsConfig();
  return NextResponse.json({ config: publicAnalyticsSubset(cfg) });
}
