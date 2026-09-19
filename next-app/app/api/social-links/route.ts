import { NextRequest, NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placement = searchParams.get("placement")?.toLowerCase();
  const device = searchParams.get("device")?.toLowerCase(); // "desktop" | "mobile"

  const links = fileDb
    .findMany("socialMediaLinks", (s: Record<string, unknown>) => {
      // Must be explicitly visible and have a valid non-empty URL
      if (s.visible === false) return false;
      const url = String(s.url || "").trim();
      if (!url || url === "#") return false;

      // Filter by device if provided
      if (device === "desktop" && s.desktopVisible === false) return false;
      if (device === "mobile" && s.mobileVisible === false) return false;

      // Filter by placement if specified
      if (placement && placement !== "all") {
        const placements = Array.isArray(s.placements)
          ? s.placements.map((p) => String(p).toLowerCase())
          : ["footer", "all"];
        const matches = placements.includes(placement) || placements.includes("all");
        if (!matches) return false;
      }

      return true;
    })
    .sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
    );

  return NextResponse.json({ links });
}
