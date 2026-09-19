import "server-only";
import { settingStore } from "@/lib/commerce/store-extensions";

/**
 * Queens Care — Analytics & Tracking configuration (server-side source of truth).
 * Stored via settingStore under key `analytics_config`, group `analytics`.
 * All IDs are admin-managed — never hardcoded in components.
 *
 * Secret-handling: measurement IDs (G-…, GTM-…, pixel IDs) and Search Console
 * verification tokens are public-by-nature (injected into the page HTML anyway),
 * so they are safe to expose to the client bundle. No private credentials are
 * stored here — those live in env vars (see Admin → Integrations).
 */

export type AnalyticsEnvironment = "development" | "staging" | "production";
export type TrackingMode = "all_visitors" | "consent_based" | "privacy_mode";

export interface AnalyticsConfig {
  enabled: boolean;              // master switch — when false, NO tracking fires anywhere
  environment: AnalyticsEnvironment;
  trackingMode: TrackingMode;    // consent_based requires acceptance before any vendor script loads

  ga4: {
    enabled: boolean;
    measurementId: string;       // G-XXXXXXXXXX
  };

  meta: {
    enabled: boolean;
    pixelId: string;
  };

  gtm: {
    enabled: boolean;
    containerId: string;         // GTM-XXXXXXX
  };

  searchConsole: {
    verificationToken: string;   // <meta name="google-site-verification" content="…">
  };

  clarity: {
    enabled: boolean;
    projectId: string;
  };

  updatedAt?: string;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: false,
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
  trackingMode: "consent_based",
  ga4: { enabled: false, measurementId: "" },
  meta: { enabled: false, pixelId: "" },
  gtm: { enabled: false, containerId: "" },
  searchConsole: { verificationToken: "" },
  clarity: { enabled: false, projectId: "" },
};

const CONFIG_KEY = "analytics_config";
const CONFIG_GROUP = "analytics";

function mergeDefaults(raw: Partial<AnalyticsConfig> | null | undefined): AnalyticsConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ANALYTICS_CONFIG };
  return {
    enabled: Boolean(raw.enabled),
    environment: (["development", "staging", "production"] as const).includes(raw.environment as never)
      ? (raw.environment as AnalyticsEnvironment)
      : DEFAULT_ANALYTICS_CONFIG.environment,
    trackingMode: (["all_visitors", "consent_based", "privacy_mode"] as const).includes(raw.trackingMode as never)
      ? (raw.trackingMode as TrackingMode)
      : DEFAULT_ANALYTICS_CONFIG.trackingMode,
    ga4: {
      enabled: Boolean(raw.ga4?.enabled),
      measurementId: typeof raw.ga4?.measurementId === "string" ? raw.ga4.measurementId.trim() : "",
    },
    meta: {
      enabled: Boolean(raw.meta?.enabled),
      pixelId: typeof raw.meta?.pixelId === "string" ? raw.meta.pixelId.trim() : "",
    },
    gtm: {
      enabled: Boolean(raw.gtm?.enabled),
      containerId: typeof raw.gtm?.containerId === "string" ? raw.gtm.containerId.trim() : "",
    },
    searchConsole: {
      verificationToken: typeof raw.searchConsole?.verificationToken === "string" ? raw.searchConsole.verificationToken.trim() : "",
    },
    clarity: {
      enabled: Boolean(raw.clarity?.enabled),
      projectId: typeof raw.clarity?.projectId === "string" ? raw.clarity.projectId.trim() : "",
    },
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

/** Validate a measurement ID shape loosely (vendors allow variant prefixes). */
export function isValidMeasurementId(id: string): boolean {
  return /^G-[A-Z0-9]{6,12}$/.test(id);
}
export function isValidPixelId(id: string): boolean {
  return /^\d{10,20}$/.test(id);
}
export function isValidGtmId(id: string): boolean {
  return /^GTM-[A-Z0-9]{4,10}$/.test(id);
}

export async function getAnalyticsConfig(): Promise<AnalyticsConfig> {
  try {
    const s = await settingStore.get(CONFIG_KEY);
    const raw = s?.value
      ? (typeof s.value === "string" ? JSON.parse(s.value) : s.value)
      : null;
    return mergeDefaults(raw as Partial<AnalyticsConfig>);
  } catch {
    return { ...DEFAULT_ANALYTICS_CONFIG };
  }
}

export async function saveAnalyticsConfig(patch: Partial<AnalyticsConfig>, updatedBy: string): Promise<AnalyticsConfig> {
  const current = await getAnalyticsConfig();
  const next = mergeDefaults({ ...current, ...patch, updatedAt: new Date().toISOString() });

  // Only persist valid-shaped IDs; an invalid ID is stored as empty (and
  // flagged by the API validation) so a typo can never inject arbitrary JS
  // into the page via a "measurement ID".
  if (next.ga4.measurementId && !isValidMeasurementId(next.ga4.measurementId)) next.ga4.measurementId = "";
  if (next.meta.pixelId && !isValidPixelId(next.meta.pixelId)) next.meta.pixelId = "";
  if (next.gtm.containerId && !isValidGtmId(next.gtm.containerId)) next.gtm.containerId = "";

  await settingStore.set(CONFIG_KEY, next, CONFIG_GROUP);

  // Audit log (no secrets involved — vendor IDs are not credentials)
  try {
    const { logAccessAuditEvent } = await import("@/lib/audit");
    await logAccessAuditEvent({
      action: "analytics_config_updated",
      actorId: updatedBy,
      actorName: updatedBy,
      actorEmail: updatedBy,
      targetId: "analytics_config",
      targetName: "Analytics & Tracking Settings",
      targetEmail: "",
      status: "success",
      details: `Analytics config updated: enabled=${next.enabled} ga4=${next.ga4.enabled} meta=${next.meta.enabled} gtm=${next.gtm.enabled} mode=${next.trackingMode}`,
    });
  } catch {
    // audit logging must never break config saves
  }

  return next;
}

/**
 * Public subset safe for the client bundle (layout injects it into the page).
 * Contains only vendor IDs — never credentials.
 */
export function publicAnalyticsSubset(cfg: AnalyticsConfig) {
  return {
    enabled: cfg.enabled,
    environment: cfg.environment,
    trackingMode: cfg.trackingMode,
    ga4: { enabled: cfg.ga4.enabled && Boolean(cfg.ga4.measurementId), measurementId: cfg.ga4.measurementId },
    meta: { enabled: cfg.meta.enabled && Boolean(cfg.meta.pixelId), pixelId: cfg.meta.pixelId },
    gtm: { enabled: cfg.gtm.enabled && Boolean(cfg.gtm.containerId), containerId: cfg.gtm.containerId },
    clarity: { enabled: cfg.clarity.enabled && Boolean(cfg.clarity.projectId), projectId: cfg.clarity.projectId },
  };
}
