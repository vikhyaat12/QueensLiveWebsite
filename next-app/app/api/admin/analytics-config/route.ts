import { json, requireUser } from "@/lib/http";
import {
  getAnalyticsConfig,
  saveAnalyticsConfig,
  isValidMeasurementId,
  isValidPixelId,
  isValidGtmId,
  type AnalyticsConfig,
} from "@/lib/analytics/config";
import { extractClientMeta } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GET — full admin view of analytics & tracking configuration */
export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const cfg = await getAnalyticsConfig();
  return json({ config: cfg });
}

const asBool = (v: unknown) => v === true || v === "true";
const asStr = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** PUT — update analytics & tracking configuration (admin-only) */
export async function PUT(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const patch: Partial<AnalyticsConfig> = {};

  if (body.enabled !== undefined) patch.enabled = asBool(body.enabled);
  if (typeof body.environment === "string" && ["development", "staging", "production"].includes(body.environment)) {
    patch.environment = body.environment as AnalyticsConfig["environment"];
  }
  if (typeof body.trackingMode === "string" && ["all_visitors", "consent_based", "privacy_mode"].includes(body.trackingMode)) {
    patch.trackingMode = body.trackingMode as AnalyticsConfig["trackingMode"];
  }

  if (body.ga4 && typeof body.ga4 === "object") {
    const g = body.ga4 as Record<string, unknown>;
    patch.ga4 = { enabled: asBool(g.enabled), measurementId: asStr(g.measurementId, 20) };
  }
  if (body.meta && typeof body.meta === "object") {
    const m = body.meta as Record<string, unknown>;
    patch.meta = { enabled: asBool(m.enabled), pixelId: asStr(m.pixelId, 24) };
  }
  if (body.gtm && typeof body.gtm === "object") {
    const g = body.gtm as Record<string, unknown>;
    patch.gtm = { enabled: asBool(g.enabled), containerId: asStr(g.containerId, 20) };
  }
  if (body.searchConsole && typeof body.searchConsole === "object") {
    const s = body.searchConsole as Record<string, unknown>;
    patch.searchConsole = { verificationToken: asStr(s.verificationToken, 120) };
  }
  if (body.clarity && typeof body.clarity === "object") {
    const c = body.clarity as Record<string, unknown>;
    patch.clarity = { enabled: asBool(c.enabled), projectId: asStr(c.projectId, 24) };
  }

  // Pre-validation with actionable errors (saveAnalyticsConfig also sanitizes)
  const errs: string[] = [];
  if (patch.ga4?.enabled && patch.ga4.measurementId && !isValidMeasurementId(patch.ga4.measurementId)) {
    errs.push("GA4 Measurement ID must look like G-XXXXXXXXXX (G- followed by 6–12 letters/digits).");
  }
  if (patch.meta?.enabled && patch.meta.pixelId && !isValidPixelId(patch.meta.pixelId)) {
    errs.push("Meta Pixel ID must be 10–20 digits.");
  }
  if (patch.gtm?.enabled && patch.gtm.containerId && !isValidGtmId(patch.gtm.containerId)) {
    errs.push("GTM Container ID must look like GTM-XXXXXXX.");
  }

  const saved = await saveAnalyticsConfig(patch, user.email || user.id || "admin");
  return json({ config: saved, warnings: errs }, errs.length ? 200 : 200);
}

// Wrapper for audit meta extraction compatibility (ip/ua not stored for config saves)
export const runtime = "nodejs";
void extractClientMeta;
