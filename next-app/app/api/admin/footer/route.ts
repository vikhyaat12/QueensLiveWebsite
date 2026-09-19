import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";
import {
  DEFAULT_FOOTER_CONFIG,
  validateFooterConfig,
  FooterConfig,
  FooterSnapshot,
} from "@/lib/commerce/footer-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser(["admin"]);
    if (!user) {
      return json({ error: "Unauthorized: Admin access required" }, 401);
    }

    const db = fileDb.get();
    const config = (db.footerConfig || DEFAULT_FOOTER_CONFIG) as unknown as FooterConfig;
    const snapshots = (db.footerSnapshots || []) as unknown as FooterSnapshot[];
    const pages = (db.pageSettings || []).map((p: Record<string, unknown>) => ({
      id: p.id,
      title: p.title || p.label,
      slug: p.slug ? `/${String(p.slug).replace(/^\//, "")}` : "/",
    }));

    // Company info from business_info setting
    let companyInfo: Record<string, string> = {};
    const bizSetting = db.settings?.find((s: Record<string, unknown>) => s.key === "business_info");
    if (bizSetting && bizSetting.value) {
      try {
        companyInfo = typeof bizSetting.value === "string" ? JSON.parse(bizSetting.value as string) : bizSetting.value;
      } catch {}
    }

    return json({
      success: true,
      config,
      snapshots: snapshots.slice(-15).reverse(), // Latest 15 snapshots first
      pages,
      companyInfo,
    });
  } catch (error) {
    console.error("[GET /api/admin/footer] Error:", error);
    return json({ error: "Failed to retrieve footer settings" }, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authRes = await requireUser(req, ["admin"]);
    if (authRes instanceof Response) return authRes;
    if (!authRes) {
      return json({ error: "Unauthorized: Admin access required" }, 401);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON request body" }, 400);
    }

    const { action, config, snapshotId, summary } = body;
    const db = fileDb.get();
    const currentConfig = (db.footerConfig || DEFAULT_FOOTER_CONFIG) as unknown as FooterConfig;
    let snapshots = (((db.footerSnapshots as unknown) as FooterSnapshot[]) || []).slice();

    if (action === "rollback") {
      if (!snapshotId) {
        return json({ error: "snapshotId is required for rollback" }, 400);
      }
      const targetSnapshot = snapshots.find((s) => s.id === snapshotId);
      if (!targetSnapshot) {
        return json({ error: "Snapshot not found" }, 404);
      }

      // Create a safety snapshot of current state before rollback
      const safetySnapshot: FooterSnapshot = {
        id: `snap-safety-${Date.now()}`,
        version: currentConfig.version || 1,
        timestamp: new Date().toISOString(),
        publishedBy: authRes.email || authRes.name || "Admin",
        summary: `Pre-rollback snapshot before restoring v${targetSnapshot.version}`,
        config: currentConfig,
      };
      snapshots.push(safetySnapshot);
      if (snapshots.length > 20) snapshots = snapshots.slice(-20);

      const restoredConfig: FooterConfig = {
        ...targetSnapshot.config,
        isPublished: true,
        updatedAt: new Date().toISOString(),
        updatedBy: authRes.email || authRes.name || "Admin",
      };

      fileDb.save({
        footerConfig: restoredConfig as unknown as Record<string, unknown>,
        footerSnapshots: snapshots as unknown as Array<Record<string, unknown>>,
      });

      return json({
        success: true,
        message: `Successfully rolled back to snapshot v${targetSnapshot.version}`,
        config: restoredConfig,
        snapshots: snapshots.slice(-15).reverse(),
      });
    }

    if (action === "reset_defaults") {
      // Create safety snapshot
      const safetySnapshot: FooterSnapshot = {
        id: `snap-reset-${Date.now()}`,
        version: currentConfig.version || 1,
        timestamp: new Date().toISOString(),
        publishedBy: authRes.email || authRes.name || "Admin",
        summary: "Pre-reset snapshot before restoring factory defaults",
        config: currentConfig,
      };
      snapshots.push(safetySnapshot);
      if (snapshots.length > 20) snapshots = snapshots.slice(-20);

      const resetConfig: FooterConfig = {
        ...DEFAULT_FOOTER_CONFIG,
        version: (currentConfig.version || 1) + 1,
        isPublished: true,
        updatedAt: new Date().toISOString(),
        updatedBy: authRes.email || authRes.name || "Admin",
      };

      fileDb.save({
        footerConfig: resetConfig as unknown as Record<string, unknown>,
        footerSnapshots: snapshots as unknown as Array<Record<string, unknown>>,
      });

      return json({
        success: true,
        message: "Successfully reset footer to brand default configuration",
        config: resetConfig,
        snapshots: snapshots.slice(-15).reverse(),
      });
    }

    if (action === "save_draft" || action === "publish") {
      if (!config) {
        return json({ error: "config object is required" }, 400);
      }

      const validation = validateFooterConfig(config);
      if (!validation.valid) {
        return json({ error: "Validation failed", details: validation.errors }, 422);
      }

      const isPublishing = action === "publish";
      const newVersion = isPublishing ? (currentConfig.version || 1) + 1 : currentConfig.version || 1;

      if (isPublishing) {
        // Snapshot the previously active state
        const newSnapshot: FooterSnapshot = {
          id: `snap-${Date.now()}`,
          version: currentConfig.version || 1,
          timestamp: new Date().toISOString(),
          publishedBy: authRes.email || authRes.name || "Admin",
          summary: summary || `Published version ${newVersion}`,
          config: currentConfig,
        };
        snapshots.push(newSnapshot);
        if (snapshots.length > 20) snapshots = snapshots.slice(-20);
      }

      const updatedConfig: FooterConfig = {
        ...config,
        version: newVersion,
        isPublished: isPublishing,
        updatedAt: new Date().toISOString(),
        updatedBy: authRes.email || authRes.name || "Admin",
      };

      fileDb.save({
        footerConfig: updatedConfig as unknown as Record<string, unknown>,
        footerSnapshots: snapshots as unknown as Array<Record<string, unknown>>,
      });

      return json({
        success: true,
        message: isPublishing ? `Footer v${newVersion} published successfully` : "Footer draft saved successfully",
        config: updatedConfig,
        snapshots: snapshots.slice(-15).reverse(),
      });
    }

    return json({ error: `Unsupported action '${action}'. Expected save_draft, publish, rollback, or reset_defaults.` }, 400);
  } catch (error) {
    console.error("[PUT /api/admin/footer] Error:", error);
    return json({ error: "Failed to update footer configuration" }, 500);
  }
}
