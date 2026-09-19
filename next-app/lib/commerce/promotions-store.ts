import "server-only";
import { fileDb } from "./file-db";
import type {
  PromoComponent,
  PromotionSettings,
  AffiliateCampaign,
  PromoGamificationConfig,
  DeviceTarget,
  PromoStatus,
} from "./promotions-types";

const now = () => new Date().toISOString();

export const promotionsStore = {
  /**
   * Retrieves global emergency kill switches and promotion settings.
   */
  async getGlobalSettings(): Promise<PromotionSettings> {
    const list = fileDb.findMany("promotionSettings") as unknown as PromotionSettings[];
    if (list && list.length > 0) {
      return list[0];
    }
    const defaultSettings: PromotionSettings = {
      id: "settings-promotions-global",
      globalEnabled: true,
      tickersEnabled: true,
      mediaEnabled: true,
      gamificationEnabled: true,
      affiliatePromosEnabled: true,
      auditLog: [
        {
          action: "INITIALIZE_PROMOTIONS_CMS",
          performedBy: "system",
          timestamp: now(),
          notes: "Default emergency kill switch settings created.",
        },
      ],
      updatedAt: now(),
    };
    fileDb.insert("promotionSettings", defaultSettings as unknown as Record<string, unknown>);
    return defaultSettings;
  },

  /**
   * Updates global emergency kill switches and writes to audit log.
   */
  async updateGlobalSettings(
    patch: Partial<PromotionSettings>,
    adminUser = "admin"
  ): Promise<PromotionSettings> {
    const current = await this.getGlobalSettings();
    const updatedAudit = [
      {
        action: "UPDATE_KILL_SWITCHES",
        performedBy: adminUser,
        timestamp: now(),
        notes: JSON.stringify(patch),
      },
      ...(current.auditLog || []),
    ].slice(0, 100);

    const updated = fileDb.update("promotionSettings", current.id, {
      ...patch,
      auditLog: updatedAudit,
      updatedAt: now(),
    }) as unknown as PromotionSettings;

    return updated;
  },

  /**
   * Lists promotion components with filtering for public or admin views.
   */
  async listPromotions(options: {
    slot?: string;
    pageType?: string;
    route?: string;
    device?: DeviceTarget;
    status?: PromoStatus | "all";
    admin?: boolean;
  } = {}): Promise<PromoComponent[]> {
    const settings = await this.getGlobalSettings();

    // If global kill switch is active and not admin view, return empty
    if (!options.admin && !settings.globalEnabled) {
      return [];
    }

    const all = (fileDb.findMany("promotions") || []) as unknown as PromoComponent[];
    const currentTime = new Date().getTime();

    const filtered = all.filter((item) => {
      if (!item) return false;

      // Admin can request all statuses
      if (options.admin) {
        if (options.slot && item.placement?.slot !== options.slot) return false;
        if (options.status && options.status !== "all" && item.status !== options.status) return false;
        return true;
      }

      // PUBLIC CUSTOMER FILTERING:
      // 1. Must be published & enabled
      if (!item.enabled || item.status !== "published") return false;

      // 2. Specific kill switch checks
      if (item.type === "ticker" && !settings.tickersEnabled) return false;
      if (item.type === "media_block" && !settings.mediaEnabled) return false;
      if (item.type === "gamification" && !settings.gamificationEnabled) return false;
      if (item.type === "affiliate_block" && !settings.affiliatePromosEnabled) return false;

      // 3. Slot match
      if (options.slot && item.placement?.slot !== options.slot) return false;

      // 4. Scheduling checks
      if (item.schedule?.startDate) {
        const start = new Date(item.schedule.startDate).getTime();
        if (currentTime < start) return false;
      }
      if (item.schedule?.endDate) {
        const end = new Date(item.schedule.endDate).getTime();
        if (currentTime > end) return false;
      }

      // 5. Device targeting
      if (options.device && item.targeting?.devices && item.targeting.devices.length > 0) {
        if (!item.targeting.devices.includes(options.device)) return false;
      }

      // 6. Page type targeting
      if (options.pageType && item.targeting?.pageType && item.targeting.pageType.length > 0) {
        const matchesPage =
          item.targeting.pageType.includes("all") ||
          item.targeting.pageType.includes(options.pageType);
        if (!matchesPage) return false;
      }

      // 7. Route inclusion/exclusion
      if (options.route) {
        if (item.targeting?.excludedRoutes?.includes(options.route)) return false;
        if (
          item.targeting?.specificRoutes &&
          item.targeting.specificRoutes.length > 0 &&
          !item.targeting.specificRoutes.includes(options.route)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort by priority descending (highest priority first)
    return filtered.sort((a, b) => {
      const pA = Number(a.placement?.priority ?? 50);
      const pB = Number(b.placement?.priority ?? 50);
      return pB - pA;
    });
  },

  /**
   * Retrieves single promotion component by ID.
   */
  async getPromotionById(id: string): Promise<PromoComponent | null> {
    const item = fileDb.findOne("promotions", (p) => p.id === id);
    return (item as unknown as PromoComponent) || null;
  },

  /**
   * Creates or updates a promotion component.
   */
  async savePromotion(data: Partial<PromoComponent>): Promise<PromoComponent> {
    const id = data.id || `promo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const cleanData: Record<string, unknown> = {
      ...data,
      id,
      updatedAt: now(),
      createdAt: data.createdAt || now(),
      status: data.status || "published",
      enabled: data.enabled !== undefined ? data.enabled : true,
      placement: {
        slot: data.placement?.slot || "global_top",
        priority: Number(data.placement?.priority ?? 50),
        stackOrder: data.placement?.stackOrder ?? 0,
      },
      targeting: {
        pageType: data.targeting?.pageType || ["all"],
        devices: data.targeting?.devices || ["desktop", "tablet", "mobile"],
        userAudience: data.targeting?.userAudience || "all",
        specificRoutes: data.targeting?.specificRoutes || [],
        excludedRoutes: data.targeting?.excludedRoutes || [],
        categories: data.targeting?.categories || [],
        productIds: data.targeting?.productIds || [],
        skus: data.targeting?.skus || [],
        affiliateCampaignIds: data.targeting?.affiliateCampaignIds || [],
      },
    };

    const existing = fileDb.findOne("promotions", (p) => p.id === id);
    if (existing) {
      fileDb.update("promotions", id, cleanData);
    } else {
      fileDb.insert("promotions", cleanData);
    }

    return cleanData as unknown as PromoComponent;
  },

  /**
   * Duplicates an existing promotion into a new draft.
   */
  async duplicatePromotion(id: string): Promise<PromoComponent> {
    const original = await this.getPromotionById(id);
    if (!original) throw new Error("Original promotion not found");

    const newId = `promo-${Date.now().toString(36)}-clone`;
    const clone: PromoComponent = {
      ...structuredClone(original),
      id: newId,
      name: `${original.name} (Copy)`,
      status: "draft",
      enabled: false,
      createdAt: now(),
      updatedAt: now(),
      analytics: { impressions: 0, clicks: 0 },
    };

    fileDb.insert("promotions", clone as unknown as Record<string, unknown>);
    return clone;
  },

  /**
   * Deletes or archives a promotion.
   */
  async deletePromotion(id: string): Promise<boolean> {
    const removed = fileDb.remove("promotions", id);
    return Boolean(removed);
  },

  /**
   * Computes server-authoritative gamification progress against current cart.
   * Free-shipping threshold is never hardcoded on the client.
   */
  async calculateGamificationProgress(
    gamification: PromoGamificationConfig,
    cartSubtotal = 0
  ): Promise<PromoGamificationConfig> {
    let threshold = 1500; // Default authoritative fallback

    if (gamification.thresholdType === "server_free_shipping") {
      const shippingRules = fileDb.findMany("shippingRules") as Array<{ freeShippingThreshold?: number }>;
      if (shippingRules && shippingRules.length > 0 && shippingRules[0]?.freeShippingThreshold) {
        threshold = Number(shippingRules[0].freeShippingThreshold);
      }
    } else if (gamification.thresholdType === "custom_amount" && gamification.customThreshold) {
      threshold = Number(gamification.customThreshold);
    }

    const subtotal = Math.max(0, Number(cartSubtotal || 0));
    const remaining = Math.max(0, threshold - subtotal);
    const progressPercent = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;
    const isUnlocked = subtotal >= threshold;

    return {
      ...gamification,
      computedThreshold: threshold,
      computedRemaining: remaining,
      computedProgressPercent: progressPercent,
      computedIsUnlocked: isUnlocked,
    };
  },

  /**
   * Lists all affiliate campaigns.
   */
  async listAffiliateCampaigns(options: { activeOnly?: boolean } = {}): Promise<AffiliateCampaign[]> {
    const all = (fileDb.findMany("affiliateCampaigns") || []) as unknown as AffiliateCampaign[];
    if (!options.activeOnly) return all;
    return all.filter((c) => c.enabled && c.status === "active");
  },

  /**
   * Retrieves single affiliate campaign by slug or ID.
   */
  async getAffiliateCampaignBySlug(slugOrId: string): Promise<AffiliateCampaign | null> {
    const item = fileDb.findOne(
      "affiliateCampaigns",
      (c) => c.slug === slugOrId || c.id === slugOrId || c.trackingKey === slugOrId
    );
    return (item as unknown as AffiliateCampaign) || null;
  },

  /**
   * Creates or updates an affiliate campaign.
   */
  async saveAffiliateCampaign(data: Partial<AffiliateCampaign>): Promise<AffiliateCampaign> {
    const id = data.id || `camp-${Date.now().toString(36)}`;
    const slug =
      data.slug ||
      (data.name || "campaign")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const record: Record<string, unknown> = {
      ...data,
      id,
      slug,
      trackingKey: data.trackingKey || slug,
      enabled: data.enabled !== undefined ? data.enabled : true,
      status: data.status || "active",
      updatedAt: now(),
      createdAt: data.createdAt || now(),
    };

    const existing = fileDb.findOne("affiliateCampaigns", (c) => c.id === id);
    if (existing) {
      fileDb.update("affiliateCampaigns", id, record);
    } else {
      fileDb.insert("affiliateCampaigns", record);
    }

    return record as unknown as AffiliateCampaign;
  },

  /**
   * Deletes an affiliate campaign.
   */
  async deleteAffiliateCampaign(id: string): Promise<boolean> {
    const removed = fileDb.remove("affiliateCampaigns", id);
    return Boolean(removed);
  },

  /**
   * Records privacy-safe analytics event (impression or click).
   */
  async recordAnalytics(promotionId: string, type: "impression" | "click"): Promise<void> {
    const promo = await this.getPromotionById(promotionId);
    if (!promo) return;

    const currentAnalytics = promo.analytics || { impressions: 0, clicks: 0 };
    const updated = {
      ...currentAnalytics,
      impressions: currentAnalytics.impressions + (type === "impression" ? 1 : 0),
      clicks: currentAnalytics.clicks + (type === "click" ? 1 : 0),
      lastImpressionAt: now(),
    };

    fileDb.update("promotions", promotionId, {
      analytics: updated,
    });
  },
};
