"use client";

import React, { useState, useEffect, useCallback } from "react";
import UniversalPromoRenderer from "../components/promotions/UniversalPromoRenderer";
import type {
  PromoComponent,
  PromotionSettings,
  PromoSlot,
  PromoComponentType,
  PromoStatus,
  DeviceTarget,
  AffiliateCampaign,
} from "@/lib/commerce/promotions-types";

const ALL_SLOTS: Array<{ slot: PromoSlot; label: string; group: string }> = [
  // GLOBAL
  { slot: "global_top", label: "Very Top of Website (Global)", group: "Global" },
  { slot: "global_above_header", label: "Above Header", group: "Global" },
  { slot: "global_below_header", label: "Below Header", group: "Global" },
  { slot: "global_announcement", label: "Announcement Bar", group: "Global" },
  { slot: "global_above_footer", label: "Above Footer", group: "Global" },
  { slot: "global_footer", label: "Inside Footer", group: "Global" },
  // HOME
  { slot: "home_hero_top", label: "Hero Top (Home)", group: "Homepage" },
  { slot: "home_hero_bottom", label: "Hero Bottom / Marquee", group: "Homepage" },
  { slot: "home_between_sections", label: "Between Sections", group: "Homepage" },
  { slot: "home_before_products", label: "Before Featured Products", group: "Homepage" },
  { slot: "home_after_products", label: "After Featured Products", group: "Homepage" },
  { slot: "home_before_testimonials", label: "Before Testimonials", group: "Homepage" },
  { slot: "home_after_testimonials", label: "After Testimonials", group: "Homepage" },
  { slot: "home_cms_section", label: "Custom CMS Section", group: "Homepage" },
  // CATEGORY & SEARCH
  { slot: "category_top", label: "Category Page Top", group: "Category & Shop" },
  { slot: "category_before_grid", label: "Before Products Grid", group: "Category & Shop" },
  { slot: "category_after_grid", label: "After Products Grid", group: "Category & Shop" },
  { slot: "search_top", label: "Search Results Top", group: "Category & Shop" },
  { slot: "search_bottom", label: "Search Results Bottom", group: "Category & Shop" },
  // PRODUCT PDP
  { slot: "product_above_info", label: "Above Product Details", group: "Product PDP" },
  { slot: "product_below_title", label: "Below Product Title", group: "Product PDP" },
  { slot: "product_below_price", label: "Below Price Tag", group: "Product PDP" },
  { slot: "product_below_atc", label: "Below Add to Cart Button", group: "Product PDP" },
  { slot: "product_above_aplus", label: "Above A+ Clinical Content", group: "Product PDP" },
  { slot: "product_below_aplus", label: "Below A+ Content", group: "Product PDP" },
  { slot: "product_before_related", label: "Before Related Products", group: "Product PDP" },
  // CART & CHECKOUT
  { slot: "cart_top", label: "Cart Top / Free Shipping Progress", group: "Cart & Checkout" },
  { slot: "cart_inside", label: "Inside Cart Drawer", group: "Cart & Checkout" },
  { slot: "cart_below_items", label: "Below Cart Line Items", group: "Cart & Checkout" },
  { slot: "checkout_top", label: "Checkout Notice Top (Non-obstructive)", group: "Cart & Checkout" },
  // AFFILIATE
  { slot: "affiliate_landing", label: "Affiliate Landing Hero / Top", group: "Affiliate" },
  { slot: "affiliate_campaign", label: "Affiliate Campaign Banner / Strip", group: "Affiliate" },
  { slot: "affiliate_dashboard", label: "Affiliate Partner Dashboard", group: "Affiliate" },
];

export default function UniversalMerchandisingPanel() {
  const [promotions, setPromotions] = useState<PromoComponent[]>([]);
  const [campaigns, setCampaigns] = useState<AffiliateCampaign[]>([]);
  const [settings, setSettings] = useState<PromotionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matrix" | "editor" | "affiliate" | "preview" | "audit">("matrix");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [slotFilter, setSlotFilter] = useState<string>("all");
  const [notice, setNotice] = useState<{ msg: string; error?: boolean } | null>(null);

  // Active item for editor
  const [editingItem, setEditingItem] = useState<Partial<PromoComponent> | null>(null);

  // Device simulation for Live Preview
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, cRes] = await Promise.all([
        fetch("/api/admin/promotions"),
        fetch("/api/admin/promotions/settings"),
        fetch("/api/admin/affiliates/campaigns"),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();

      setPromotions(pData.promotions || []);
      setSettings(sData.settings || null);
      setCampaigns(cData.campaigns || []);
    } catch {
      setNotice({ msg: "Failed to load merchandising components.", error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kill Switch Toggle Handler
  const handleToggleKillSwitch = async (key: keyof PromotionSettings, val: boolean) => {
    try {
      const res = await fetch("/api/admin/promotions/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: val }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        setNotice({ msg: `Global emergency switch "${key}" updated.` });
      } else {
        setNotice({ msg: "Failed to update kill switch.", error: true });
      }
    } catch {
      setNotice({ msg: "Network error updating kill switch.", error: true });
    }
  };

  // Duplicate component
  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id }),
      });
      const data = await res.json();
      if (res.ok && data.promotion) {
        setNotice({ msg: `Cloned into new draft "${data.promotion.name}".` });
        loadData();
      } else {
        setNotice({ msg: data.error || "Failed to clone", error: true });
      }
    } catch {
      setNotice({ msg: "Network error during duplicate", error: true });
    }
  };

  // Delete component
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this promotional component?")) return;
    try {
      const res = await fetch(`/api/admin/promotions?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotice({ msg: "Component deleted." });
        loadData();
      } else {
        setNotice({ msg: "Failed to delete component", error: true });
      }
    } catch {
      setNotice({ msg: "Network error during delete", error: true });
    }
  };

  // Save Component
  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const isNew = !editingItem.id;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch("/api/admin/promotions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });
      const data = await res.json();
      if (res.ok && data.promotion) {
        setNotice({ msg: `Promotional component "${data.promotion.name}" saved successfully.` });
        setEditingItem(null);
        setActiveTab("matrix");
        loadData();
      } else {
        setNotice({ msg: data.error || "Failed to save", error: true });
      }
    } catch {
      setNotice({ msg: "Network error during save", error: true });
    }
  };

  // Create new blank component
  const handleCreateNew = (type: PromoComponentType) => {
    const blank: Partial<PromoComponent> = {
      name: `New ${type.replace("_", " ").toUpperCase()}`,
      type,
      status: "published",
      enabled: true,
      placement: {
        slot: type === "gamification" ? "cart_top" : type === "ticker" ? "global_announcement" : "home_hero_bottom",
        priority: 100,
      },
      targeting: {
        pageType: ["all"],
        devices: ["desktop", "tablet", "mobile"],
        userAudience: "all",
      },
      content: {
        headline: type === "gamification" ? "Free Shipping Milestone" : "Clinical Rigor & Formulations",
        items: type === "ticker" ? [
          { id: "1", text: "✦ Free Express Shipping on Orders Above ₹1,500" },
          { id: "2", text: "✦ 100% Original Direct From Certified Laboratories" },
          { id: "3", text: "✦ Formulated with Practicing Physicians & Dermatologists" },
        ] : undefined,
        tickerSpeed: 24,
        tickerSeparator: "✦",
        gamification: type === "gamification" ? {
          gameType: "free_shipping_progress",
          thresholdType: "server_free_shipping",
          progressLabelFormat: "Add {remaining} more for Free Express Delivery",
          successTitle: "🎉 Free Express Shipping Unlocked!",
          barHeight: 8,
          barFillColor: "linear-gradient(90deg, #D4AF37 0%, #10B981 100%)",
          animated: true,
        } : undefined,
        styling: {
          backgroundColor: type === "ticker" ? "#1A0D28" : "#FFFFFF",
          textColor: type === "ticker" ? "#F7F1EB" : "#2A0F3A",
          accentColor: "#D4AF37",
          fontSize: "12px",
          padding: "10px 16px",
          borderRadius: "8px",
        },
      },
    };
    setEditingItem(blank);
    setActiveTab("editor");
  };

  const filteredPromotions = promotions.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (slotFilter !== "all" && p.placement?.slot !== slotFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: "24px 28px", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Panel Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#2A0F3A" }}>
              Universal Merchandising CMS
            </h2>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "3px 8px",
                borderRadius: "4px",
                background: "#D4AF37",
                color: "#180524",
              }}
            >
              Zero Hardcode Engine
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>
            Unlimited Tickers, Media Strips, Server-Authoritative Gamification &amp; Affiliate CMS placed anywhere across storefront.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => handleCreateNew("ticker")}
            style={{
              padding: "8px 14px",
              background: "#2A0F3A",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New Ticker
          </button>
          <button
            type="button"
            onClick={() => handleCreateNew("gamification")}
            style={{
              padding: "8px 14px",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New Gamification
          </button>
          <button
            type="button"
            onClick={() => handleCreateNew("media_block")}
            style={{
              padding: "8px 14px",
              background: "#D4AF37",
              color: "#180524",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + New Media Strip
          </button>
        </div>
      </div>

      {/* Global Notification Toast */}
      {notice && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: "16px",
            borderRadius: "6px",
            fontSize: "12.5px",
            fontWeight: 600,
            background: notice.error ? "#FEF2F2" : "#F0FDF4",
            color: notice.error ? "#991B1B" : "#166534",
            border: notice.error ? "1px solid #FCA5A5" : "1px solid #86EFAC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{notice.msg}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── GLOBAL EMERGENCY KILL SWITCHES ─── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #EAE6DF",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(42, 15, 58, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 700, color: "#2A0F3A" }}>
              🚨 Global Emergency Kill Switches
            </h4>
            <span style={{ fontSize: "11.5px", color: "#6B7280" }}>
              Turning OFF immediately removes rendering on storefront while preserving all database configurations.
            </span>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: settings?.globalEnabled ? "#166534" : "#991B1B",
            }}
          >
            System Status: {settings?.globalEnabled ? "LIVE & OPERATIONAL" : "ALL PROMOTIONS DISABLED"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {[
            { key: "globalEnabled", label: "Master Promotions Engine", active: settings?.globalEnabled },
            { key: "tickersEnabled", label: "All Tickers & Marquees", active: settings?.tickersEnabled },
            { key: "gamificationEnabled", label: "Gamification & Progress", active: settings?.gamificationEnabled },
            { key: "mediaEnabled", label: "Media Blocks & Strips", active: settings?.mediaEnabled },
            { key: "affiliatePromosEnabled", label: "Affiliate Promotions", active: settings?.affiliatePromosEnabled },
          ].map((sw) => (
            <div
              key={sw.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#F9FAFB",
                borderRadius: "6px",
                border: "1px solid #E5E7EB",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{sw.label}</span>
              <button
                type="button"
                onClick={() => handleToggleKillSwitch(sw.key as keyof PromotionSettings, !sw.active)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: sw.active ? "#10B981" : "#EF4444",
                  color: "#FFFFFF",
                }}
              >
                {sw.active ? "ON" : "OFF"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid #EAE6DF", marginBottom: "20px" }}>
        {[
          { id: "matrix", label: "All Components & Slots", icon: "📋" },
          { id: "editor", label: editingItem ? "Visual Component Editor" : "Editor", icon: "✏️" },
          { id: "affiliate", label: "Affiliate Campaigns CMS", icon: "🤝" },
          { id: "preview", label: "Live Multi-Device Preview", icon: "👁️" },
          { id: "audit", label: "Audit Log & Analytics", icon: "📈" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: activeTab === t.id ? "2.5px solid #2A0F3A" : "2.5px solid transparent",
              background: "none",
              color: activeTab === t.id ? "#2A0F3A" : "#6B7280",
              fontWeight: activeTab === t.id ? 700 : 500,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── TAB 1: ALL COMPONENTS MATRIX ─── */}
      {activeTab === "matrix" && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: "flex", gap: "14px", marginBottom: "16px", alignItems: "center" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#4B5563", display: "block" }}>
                Filter by Slot:
              </label>
              <select
                value={slotFilter}
                onChange={(e) => setSlotFilter(e.target.value)}
                style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "4px", border: "1px solid #D1D5DB" }}
              >
                <option value="all">All Slots ({promotions.length})</option>
                {ALL_SLOTS.map((s) => (
                  <option key={s.slot} value={s.slot}>
                    {s.label} ({s.slot})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#4B5563", display: "block" }}>
                Filter by Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "4px", border: "1px solid #D1D5DB" }}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Components Table */}
          <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #EAE6DF", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563" }}>
                  <th style={{ padding: "12px 16px" }}>Component</th>
                  <th style={{ padding: "12px 16px" }}>Type</th>
                  <th style={{ padding: "12px 16px" }}>Slot / Placement</th>
                  <th style={{ padding: "12px 16px" }}>Priority</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Performance</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromotions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
                      No promotional components found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredPromotions.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#2A0F3A" }}>{p.name}</div>
                        <div style={{ fontSize: "11px", color: "#6B7280" }}>ID: {p.id}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background:
                              p.type === "ticker"
                                ? "#F3E8FF"
                                : p.type === "gamification"
                                ? "#ECFDF5"
                                : p.type === "media_block"
                                ? "#FEF3C7"
                                : "#E0E7FF",
                            color:
                              p.type === "ticker"
                                ? "#6B21A8"
                                : p.type === "gamification"
                                ? "#065F46"
                                : p.type === "media_block"
                                ? "#92400E"
                                : "#3730A3",
                          }}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                        <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: "3px" }}>
                          {p.placement?.slot}
                        </code>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        {p.placement?.priority ?? 50}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background:
                              p.status === "published"
                                ? "#DCFCE7"
                                : p.status === "paused"
                                ? "#FEF9C3"
                                : p.status === "draft"
                                ? "#F3F4F6"
                                : "#FEE2E2",
                            color:
                              p.status === "published"
                                ? "#15803D"
                                : p.status === "paused"
                                ? "#A16207"
                                : p.status === "draft"
                                ? "#4B5563"
                                : "#B91C1C",
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "11.5px", color: "#4B5563" }}>
                        <div>👁️ {p.analytics?.impressions || 0} views</div>
                        <div>🖱️ {p.analytics?.clicks || 0} clicks</div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(p);
                              setActiveTab("editor");
                            }}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              border: "1px solid #D1D5DB",
                              borderRadius: "4px",
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(p);
                              setActiveTab("preview");
                            }}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              border: "1px solid #D1D5DB",
                              borderRadius: "4px",
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              border: "1px solid #D1D5DB",
                              borderRadius: "4px",
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Clone
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              border: "1px solid #FCA5A5",
                              borderRadius: "4px",
                              background: "#FEF2F2",
                              color: "#B91C1C",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: VISUAL COMPONENT EDITOR ─── */}
      {activeTab === "editor" && (
        <div>
          {!editingItem ? (
            <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "8px" }}>
              <p>No component selected. Choose an item from the matrix or create a new one.</p>
              <button
                type="button"
                onClick={() => handleCreateNew("ticker")}
                style={{ padding: "8px 16px", background: "#2A0F3A", color: "#fff", border: "none", borderRadius: "6px" }}
              >
                + Create Ticker
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveComponent} style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
              {/* Left Column: Form Fields */}
              <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #EAE6DF" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#2A0F3A" }}>
                  Edit {editingItem.type?.toUpperCase()} Component
                </h3>

                {/* Name & Type */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Component Name (Internal)
                    </label>
                    <input
                      type="text"
                      value={editingItem.name || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Component Type
                    </label>
                    <select
                      value={editingItem.type || "ticker"}
                      onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                    >
                      <option value="ticker">Ticker / Marquee</option>
                      <option value="gamification">Gamification / Progress</option>
                      <option value="media_block">Media Block / Strip</option>
                      <option value="affiliate_block">Affiliate Block</option>
                    </select>
                  </div>
                </div>

                {/* Slot Placement & Priority */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Target Slot Placement
                    </label>
                    <select
                      value={editingItem.placement?.slot || "global_announcement"}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          placement: { ...editingItem.placement!, slot: e.target.value as any },
                        })
                      }
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                    >
                      {ALL_SLOTS.map((s) => (
                        <option key={s.slot} value={s.slot}>
                          [{s.group}] {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Priority Score (0-200)
                    </label>
                    <input
                      type="number"
                      value={editingItem.placement?.priority ?? 100}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          placement: { ...editingItem.placement!, priority: Number(e.target.value) },
                        })
                      }
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                    />
                  </div>
                </div>

                {/* Headline & Copy */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Headline / Title Text
                  </label>
                  <input
                    type="text"
                    value={editingItem.content?.headline || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        content: { ...editingItem.content!, headline: e.target.value },
                      })
                    }
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                  />
                </div>

                {/* Ticker Items Editor (if ticker) */}
                {editingItem.type === "ticker" && (
                  <div style={{ marginBottom: "16px", padding: "14px", background: "#F9FAFB", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 700 }}>Marquee Text Items</label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentItems = editingItem.content?.items || [];
                          setEditingItem({
                            ...editingItem,
                            content: {
                              ...editingItem.content!,
                              items: [
                                ...currentItems,
                                { id: String(Date.now()), text: "✦ New Announcement Item" },
                              ],
                            },
                          });
                        }}
                        style={{ fontSize: "11px", padding: "2px 8px", cursor: "pointer" }}
                      >
                        + Add Item
                      </button>
                    </div>

                    {(editingItem.content?.items || []).map((item, idx) => (
                      <div key={item.id || idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const updated = [...(editingItem.content?.items || [])];
                            updated[idx] = { ...updated[idx], text: e.target.value };
                            setEditingItem({
                              ...editingItem,
                              content: { ...editingItem.content!, items: updated },
                            });
                          }}
                          placeholder="Item text..."
                          style={{ flex: 1, padding: "6px 10px", fontSize: "12px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                        />
                        <input
                          type="text"
                          value={item.link || ""}
                          onChange={(e) => {
                            const updated = [...(editingItem.content?.items || [])];
                            updated[idx] = { ...updated[idx], link: e.target.value };
                            setEditingItem({
                              ...editingItem,
                              content: { ...editingItem.content!, items: updated },
                            });
                          }}
                          placeholder="Optional link (/shop)..."
                          style={{ width: "160px", padding: "6px 10px", fontSize: "12px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingItem.content?.items || []).filter((_, i) => i !== idx);
                            setEditingItem({
                              ...editingItem,
                              content: { ...editingItem.content!, items: updated },
                            });
                          }}
                          style={{ background: "#FEE2E2", color: "#B91C1C", border: "none", borderRadius: "4px", padding: "0 8px", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gamification Settings (if gamification) */}
                {editingItem.type === "gamification" && (
                  <div style={{ marginBottom: "16px", padding: "14px", background: "#F0FDF4", borderRadius: "8px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#166534", display: "block", marginBottom: "8px" }}>
                      Server Authoritative Gamification Rules
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 600 }}>Threshold Calculation Source</label>
                        <select
                          value={editingItem.content?.gamification?.thresholdType || "server_free_shipping"}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              content: {
                                ...editingItem.content!,
                                gamification: {
                                  ...editingItem.content?.gamification!,
                                  thresholdType: e.target.value as any,
                                },
                              },
                            })
                          }
                          style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                        >
                          <option value="server_free_shipping">Authoritative Server Shipping Rules (₹1,500)</option>
                          <option value="custom_amount">Custom Fixed Amount (₹)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 600 }}>Progress Label Pattern</label>
                        <input
                          type="text"
                          value={editingItem.content?.gamification?.progressLabelFormat || "Add {remaining} more for Free Shipping"}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              content: {
                                ...editingItem.content!,
                                gamification: {
                                  ...editingItem.content?.gamification!,
                                  progressLabelFormat: e.target.value,
                                },
                              },
                            })
                          }
                          style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600 }}>Celebratory Unlocked Message</label>
                      <input
                        type="text"
                        value={editingItem.content?.gamification?.successTitle || "🎉 Free Express Shipping Unlocked!"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            content: {
                              ...editingItem.content!,
                              gamification: {
                                ...editingItem.content?.gamification!,
                                successTitle: e.target.value,
                              },
                            },
                          })
                        }
                        style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                      />
                    </div>
                  </div>
                )}

                {/* Styling Controls */}
                <div style={{ marginBottom: "16px", padding: "14px", background: "#F9FAFB", borderRadius: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                    Visual Styling &amp; Colors
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "11px" }}>Background Color / Gradient</label>
                      <input
                        type="text"
                        value={editingItem.content?.styling?.backgroundColor || "#1A0D28"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            content: {
                              ...editingItem.content!,
                              styling: { ...editingItem.content?.styling!, backgroundColor: e.target.value },
                            },
                          })
                        }
                        style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px" }}>Text Color</label>
                      <input
                        type="text"
                        value={editingItem.content?.styling?.textColor || "#F7F1EB"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            content: {
                              ...editingItem.content!,
                              styling: { ...editingItem.content?.styling!, textColor: e.target.value },
                            },
                          })
                        }
                        style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px" }}>Accent Color (Gold)</label>
                      <input
                        type="text"
                        value={editingItem.content?.styling?.accentColor || "#D4AF37"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            content: {
                              ...editingItem.content!,
                              styling: { ...editingItem.content?.styling!, accentColor: e.target.value },
                            },
                          })
                        }
                        style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      background: "#2A0F3A",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Save Component
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setActiveTab("matrix");
                    }}
                    style={{
                      padding: "10px 18px",
                      background: "#F3F4F6",
                      color: "#4B5563",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Right Column: Status, Scheduling, Targeting */}
              <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #EAE6DF" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "#2A0F3A" }}>
                  Status &amp; Publishing
                </h4>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Publication State
                  </label>
                  <select
                    value={editingItem.status || "published"}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as PromoStatus })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "12px" }}
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={editingItem.enabled !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, enabled: e.target.checked })}
                    />
                    <span>Component Enabled</span>
                  </label>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "16px 0" }} />

                <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "#2A0F3A" }}>
                  Targeting &amp; Devices
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                  {["desktop", "tablet", "mobile"].map((dev) => {
                    const checked = editingItem.targeting?.devices?.includes(dev as DeviceTarget) !== false;
                    return (
                      <label key={dev} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const current = new Set<DeviceTarget>(editingItem.targeting?.devices || ["desktop", "tablet", "mobile"]);
                            if (e.target.checked) current.add(dev as DeviceTarget);
                            else current.delete(dev as DeviceTarget);
                            setEditingItem({
                              ...editingItem,
                              targeting: { ...editingItem.targeting!, devices: Array.from(current) },
                            });
                          }}
                        />
                        <span style={{ textTransform: "capitalize" }}>{dev}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ─── TAB 3: AFFILIATE CAMPAIGNS CMS ─── */}
      {activeTab === "affiliate" && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #EAE6DF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2A0F3A" }}>
                Affiliate Campaigns &amp; Co-Branded Landing Pages
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
                Reusable campaign configurations driving custom hero banners, exclusive discount codes, and curated formulation sets.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const name = prompt("Enter new Campaign Name (e.g. Dr. Verma Integrative Health):");
                if (!name) return;
                const res = await fetch("/api/admin/affiliates/campaigns", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                });
                if (res.ok) {
                  setNotice({ msg: "Affiliate campaign created." });
                  loadData();
                }
              }}
              style={{
                padding: "8px 14px",
                background: "#2A0F3A",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Create Campaign
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Campaign Name</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Slug &amp; Tracking Key</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Partner</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Commission</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Coupon</th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>
                    No affiliate campaigns created yet.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#2A0F3A" }}>{c.name}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: "4px" }}>{c.slug}</code>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#4B5563" }}>{c.partnerName || "General Partner"}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{c.commissionRate || 10}%</td>
                    <td style={{ padding: "10px 14px" }}>
                      {c.couponCode ? (
                        <span style={{ background: "#ECFDF5", color: "#065F46", padding: "2px 6px", borderRadius: "4px" }}>
                          {c.couponCode}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          background: c.status === "active" ? "#DCFCE7" : "#F3F4F6",
                          color: c.status === "active" ? "#166534" : "#4B5563",
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <a
                        href={`/affiliate/campaign/${c.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginRight: "8px",
                          fontSize: "11.5px",
                          color: "#2A0F3A",
                          textDecoration: "underline",
                        }}
                      >
                        View Page ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 4: LIVE MULTI-DEVICE PREVIEW ─── */}
      {activeTab === "preview" && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #EAE6DF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2A0F3A" }}>
                Production Universal Component Preview
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
                Simulating actual storefront render across Desktop, Tablet, and Mobile viewports.
              </p>
            </div>

            {/* Viewport Width Controls */}
            <div style={{ display: "inline-flex", background: "#F3F4F6", padding: "3px", borderRadius: "6px" }}>
              {[
                { id: "desktop", label: "Desktop (100%)", icon: "💻" },
                { id: "tablet", label: "Tablet (768px)", icon: "📱" },
                { id: "mobile", label: "Mobile (375px)", icon: "📲" },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setPreviewDevice(v.id as any)}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "4px",
                    background: previewDevice === v.id ? "#FFFFFF" : "transparent",
                    boxShadow: previewDevice === v.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    fontSize: "12px",
                    fontWeight: previewDevice === v.id ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Viewport Container Frame */}
          <div
            style={{
              padding: "24px",
              background: "#F3F4F6",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "center",
              overflowX: "auto",
            }}
          >
            <div
              style={{
                width: previewDevice === "mobile" ? "375px" : previewDevice === "tablet" ? "768px" : "100%",
                maxWidth: "100%",
                background: "#FFFFFF",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                borderRadius: previewDevice !== "desktop" ? "16px" : "4px",
                overflow: "hidden",
                border: "1px solid #E5E7EB",
                transition: "width 0.25s ease",
              }}
            >
              {editingItem ? (
                <UniversalPromoRenderer
                  slot={editingItem.placement?.slot || "global_announcement"}
                  previewPromo={editingItem as PromoComponent}
                />
              ) : promotions.length > 0 ? (
                <UniversalPromoRenderer
                  slot={promotions[0].placement?.slot || "global_announcement"}
                  previewPromo={promotions[0]}
                />
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                  No active component to preview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: AUDIT LOG & ANALYTICS ─── */}
      {activeTab === "audit" && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #EAE6DF" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700, color: "#2A0F3A" }}>
            Audit Trail &amp; Switch Events
          </h3>

          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Timestamp</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Action</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Admin User</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(settings?.auditLog || []).map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "8px 12px", color: "#6B7280" }}>
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{log.action}</td>
                    <td style={{ padding: "8px 12px" }}>{log.performedBy}</td>
                    <td style={{ padding: "8px 12px", color: "#4B5563" }}>{log.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
