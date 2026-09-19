"use client";

import React, { useState, useEffect } from "react";
import {
  DEFAULT_FOOTER_CONFIG,
  FooterConfig,
  FooterSnapshot,
  FooterTrustItem,
  FooterNavColumn,
  FooterNavLink,
  FooterBadgePill,
  FooterCopyrightLink,
} from "@/lib/commerce/footer-schema";
import QueensCareFooter from "@/app/components/QueensCareFooter";

type SubTab =
  | "overview"
  | "trust"
  | "brand"
  | "columns"
  | "contact"
  | "regulatory"
  | "clinical"
  | "copyright"
  | "styling"
  | "history";

type DeviceMode = "desktop" | "tablet" | "mobile";

interface PageOption {
  id: string;
  title: string;
  slug: string;
}

export default function FooterBuilder() {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [snapshots, setSnapshots] = useState<FooterSnapshot[]>([]);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [activeTab, setActiveTab] = useState<SubTab>("overview");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Load footer data from Admin API
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/footer");
        const data = await res.json();
        if (!cancelled && data.success) {
          if (data.config) setConfig(data.config);
          if (data.snapshots) setSnapshots(data.snapshots);
          if (data.pages) setPages(data.pages);
        } else if (!cancelled) {
          setStatusMessage({ text: data.error || "Failed to load footer settings", isError: true });
        }
      } catch {
        if (!cancelled) setStatusMessage({ text: "Network error loading footer configuration", isError: true });
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save draft or publish live
  const handleSave = async (action: "save_draft" | "publish") => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          config,
          summary: action === "publish" ? `Published footer v${(config.version || 1) + 1}` : "Saved footer draft",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        if (data.snapshots) setSnapshots(data.snapshots);
        setStatusMessage({
          text: action === "publish" ? "Footer successfully published to live website!" : "Footer draft saved successfully!",
          isError: false,
        });
      } else {
        setStatusMessage({ text: data.error || "Save failed", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error saving footer settings", isError: true });
    } finally {
      setSaving(false);
    }
  };

  // Rollback to selected snapshot
  const handleRollback = async (snapshotId: string) => {
    if (!confirm("Are you sure you want to rollback to this previous footer version?")) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", snapshotId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        if (data.snapshots) setSnapshots(data.snapshots);
        setStatusMessage({ text: data.message || "Rollback successful", isError: false });
      } else {
        setStatusMessage({ text: data.error || "Rollback failed", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Error rolling back footer snapshot", isError: true });
    } finally {
      setSaving(false);
    }
  };

  // Reset to brand factory defaults
  const handleResetDefaults = async () => {
    if (!confirm("Reset footer to Queens Care factory brand defaults? Current settings will be backed up.")) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_defaults" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        if (data.snapshots) setSnapshots(data.snapshots);
        setStatusMessage({ text: "Footer reset to brand defaults successfully", isError: false });
      } else {
        setStatusMessage({ text: data.error || "Reset failed", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Error resetting footer", isError: true });
    } finally {
      setSaving(false);
    }
  };

  // ─── Trust Item Helpers ───
  const addTrustItem = () => {
    const newItem: FooterTrustItem = {
      id: `trust-${Date.now()}`,
      icon: "✨",
      title: "New Trust Benefit",
      subtitle: "Verified Guarantee",
      linkUrl: "",
      visible: true,
      sortOrder: (config.trustStrip?.items?.length || 0),
    };
    setConfig((prev) => ({
      ...prev,
      trustStrip: {
        ...prev.trustStrip,
        items: [...(prev.trustStrip?.items || []), newItem],
      },
    }));
  };

  const updateTrustItem = (index: number, patch: Partial<FooterTrustItem>) => {
    setConfig((prev) => {
      const items = [...(prev.trustStrip?.items || [])];
      items[index] = { ...items[index], ...patch };
      return {
        ...prev,
        trustStrip: { ...prev.trustStrip, items },
      };
    });
  };

  const removeTrustItem = (index: number) => {
    setConfig((prev) => {
      const items = (prev.trustStrip?.items || []).filter((_, i) => i !== index);
      return {
        ...prev,
        trustStrip: { ...prev.trustStrip, items },
      };
    });
  };

  const moveTrustItem = (index: number, direction: "up" | "down") => {
    setConfig((prev) => {
      const items = [...(prev.trustStrip?.items || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return {
        ...prev,
        trustStrip: { ...prev.trustStrip, items },
      };
    });
  };

  // ─── Column & Link Helpers ───
  const addColumn = () => {
    const newCol: FooterNavColumn = {
      id: `col-${Date.now()}`,
      title: "New Column",
      visible: true,
      sortOrder: (config.columns?.length || 0),
      links: [
        {
          id: `lnk-${Date.now()}-1`,
          label: "First Page",
          href: "/",
          visible: true,
          sortOrder: 0,
        },
      ],
    };
    setConfig((prev) => ({
      ...prev,
      columns: [...(prev.columns || []), newCol],
    }));
  };

  const removeColumn = (colIndex: number) => {
    setConfig((prev) => ({
      ...prev,
      columns: (prev.columns || []).filter((_, i) => i !== colIndex),
    }));
  };

  const updateColumnTitle = (colIndex: number, title: string) => {
    setConfig((prev) => {
      const columns = [...(prev.columns || [])];
      columns[colIndex] = { ...columns[colIndex], title };
      return { ...prev, columns };
    });
  };

  const toggleColumnVisible = (colIndex: number) => {
    setConfig((prev) => {
      const columns = [...(prev.columns || [])];
      columns[colIndex] = { ...columns[colIndex], visible: !columns[colIndex].visible };
      return { ...prev, columns };
    });
  };

  const addLinkToColumn = (colIndex: number) => {
    setConfig((prev) => {
      const columns = [...(prev.columns || [])];
      const links = [...(columns[colIndex].links || [])];
      links.push({
        id: `lnk-${Date.now()}`,
        label: "New Link",
        href: "/",
        visible: true,
        sortOrder: links.length,
      });
      columns[colIndex] = { ...columns[colIndex], links };
      return { ...prev, columns };
    });
  };

  const updateLinkInColumn = (colIndex: number, linkIndex: number, patch: Partial<FooterNavLink>) => {
    setConfig((prev) => {
      const columns = [...(prev.columns || [])];
      const links = [...(columns[colIndex].links || [])];
      links[linkIndex] = { ...links[linkIndex], ...patch };
      columns[colIndex] = { ...columns[colIndex], links };
      return { ...prev, columns };
    });
  };

  const removeLinkFromColumn = (colIndex: number, linkIndex: number) => {
    setConfig((prev) => {
      const columns = [...(prev.columns || [])];
      const links = (columns[colIndex].links || []).filter((_, i) => i !== linkIndex);
      columns[colIndex] = { ...columns[colIndex], links };
      return { ...prev, columns };
    });
  };

  // ─── Contact Badges Helpers ───
  const addContactBadge = () => {
    const newBadge: FooterBadgePill = {
      id: `badge-${Date.now()}`,
      label: "New Badge",
      styleVariant: "gold",
      visible: true,
    };
    setConfig((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        badges: [...(prev.contact?.badges || []), newBadge],
      },
    }));
  };

  const updateContactBadge = (index: number, patch: Partial<FooterBadgePill>) => {
    setConfig((prev) => {
      const badges = [...(prev.contact?.badges || [])];
      badges[index] = { ...badges[index], ...patch };
      return {
        ...prev,
        contact: { ...prev.contact, badges },
      };
    });
  };

  const removeContactBadge = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        badges: (prev.contact?.badges || []).filter((_, i) => i !== index),
      },
    }));
  };

  // ─── Copyright Links Helpers ───
  const addCopyrightLink = () => {
    const newLink: FooterCopyrightLink = {
      id: `cpl-${Date.now()}`,
      label: "Legal Page",
      href: "/terms",
      visible: true,
      sortOrder: (config.copyright?.links?.length || 0),
    };
    setConfig((prev) => ({
      ...prev,
      copyright: {
        ...prev.copyright,
        links: [...(prev.copyright?.links || []), newLink],
      },
    }));
  };

  const updateCopyrightLink = (index: number, patch: Partial<FooterCopyrightLink>) => {
    setConfig((prev) => {
      const links = [...(prev.copyright?.links || [])];
      links[index] = { ...links[index], ...patch };
      return {
        ...prev,
        copyright: { ...prev.copyright, links },
      };
    });
  };

  const removeCopyrightLink = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      copyright: {
        ...prev.copyright,
        links: (prev.copyright?.links || []).filter((_, i) => i !== index),
      },
    }));
  };

  // Reusable UI styles
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    fontSize: "13px",
    background: "#FFFFFF",
    color: "#111827",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#4B5563",
    marginBottom: "4px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "8px",
    border: "1px solid #E5E7EB",
    padding: "20px",
    marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const previewWidths: Record<DeviceMode, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: "14px" }}>
        Loading Global Footer CMS &amp; Builder...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* ─── BUILDER HEADER ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, #1C0A2E 0%, #2A0F3A 100%)",
          padding: "20px 24px",
          borderRadius: "10px",
          color: "#FFFFFF",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Global Footer CMS &amp; Builder
            </h2>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "12px",
                textTransform: "uppercase",
                background: config.isPublished ? "#10B981" : "#F59E0B",
                color: "#FFFFFF",
              }}
            >
              {config.isPublished ? `v${config.version} Live` : `v${config.version} Draft`}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
            Zero Hardcode • Live Multi-Device Preview • Snapshot Rollbacks • Full Admin Control
          </p>
        </div>

        {/* Action Buttons & Device Preview Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Device Preview Selectors */}
          <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.12)", borderRadius: "6px", padding: "2px" }}>
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              style={{
                background: deviceMode === "desktop" ? "#FFFFFF" : "transparent",
                color: deviceMode === "desktop" ? "#2A0F3A" : "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🖥️ Desktop
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("tablet")}
              style={{
                background: deviceMode === "tablet" ? "#FFFFFF" : "transparent",
                color: deviceMode === "tablet" ? "#2A0F3A" : "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📱 Tablet
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              style={{
                background: deviceMode === "mobile" ? "#FFFFFF" : "transparent",
                color: deviceMode === "mobile" ? "#2A0F3A" : "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📲 Mobile (375px)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            style={{
              padding: "8px 16px",
              background: showLivePreview ? "#D4AF37" : "rgba(255, 255, 255, 0.15)",
              color: showLivePreview ? "#150522" : "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {showLivePreview ? "Hide Preview" : "👁️ Live Preview"}
          </button>

          <button
            type="button"
            onClick={() => handleSave("save_draft")}
            disabled={saving}
            style={{
              padding: "8px 16px",
              background: "#374151",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave("publish")}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: "linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)",
              color: "#150522",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(212, 175, 55, 0.4)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Publishing..." : "🚀 Publish Live"}
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {statusMessage && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 500,
            background: statusMessage.isError ? "#FEE2E2" : "#D1FAE5",
            color: statusMessage.isError ? "#991B1B" : "#065F46",
            border: `1px solid ${statusMessage.isError ? "#FCA5A5" : "#6EE7B7"}`,
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* ─── LIVE DEVICE PREVIEW CONTAINER ─── */}
      {showLivePreview && (
        <div
          style={{
            marginBottom: "24px",
            padding: "20px",
            background: "#1F2937",
            borderRadius: "10px",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              color: "#9CA3AF",
              fontSize: "12px",
            }}
          >
            <span>
              Previewing: <strong>{deviceMode.toUpperCase()}</strong> ({previewWidths[deviceMode]})
            </span>
            <span>Real-time footer viewport simulator</span>
          </div>
          <div
            style={{
              width: previewWidths[deviceMode],
              maxWidth: "100%",
              margin: "0 auto",
              border: "2px solid #374151",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <QueensCareFooter />
          </div>
        </div>
      )}

      {/* ─── SUBTABS NAVIGATION ─── */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: "2px solid #E5E7EB",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "2px",
        }}
      >
        {[
          { id: "overview", label: "Overview" },
          { id: "trust", label: "Trust Strip" },
          { id: "brand", label: "Brand & Social" },
          { id: "columns", label: "Navigation Columns" },
          { id: "contact", label: "Patient Support" },
          { id: "regulatory", label: "Statutory & Legal" },
          { id: "clinical", label: "Clinical Notice" },
          { id: "copyright", label: "Copyright & Policies" },
          { id: "styling", label: "Theme & Styling" },
          { id: "history", label: `Version History (${snapshots.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as SubTab)}
            style={{
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: activeTab === t.id ? 700 : 500,
              background: activeTab === t.id ? "#2A0F3A" : "transparent",
              color: activeTab === t.id ? "#D4AF37" : "#4B5563",
              border: "none",
              borderRadius: "6px 6px 0 0",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#111827" }}>Footer Architecture Overview</h3>
          <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6, marginBottom: "20px" }}>
            The Queens Care Footer CMS provides 100% dynamic control over every single block, link, and compliance disclosure.
            Save your draft to test layouts in the device simulator, or publish live when ready.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ padding: "16px", background: "#F9FAFB", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
              <div style={labelStyle}>Live Version</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#1F2937" }}>v{config.version || 1}</div>
              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                Status: {config.isPublished ? "Live on site" : "Draft in progress"}
              </div>
            </div>

            <div style={{ padding: "16px", background: "#F9FAFB", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
              <div style={labelStyle}>Last Updated</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937" }}>
                {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : "Just now"}
              </div>
              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                By: {config.updatedBy || "Administrator"}
              </div>
            </div>

            <div style={{ padding: "16px", background: "#F9FAFB", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
              <div style={labelStyle}>Active Columns</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#1F2937" }}>
                {(config.columns || []).filter((c) => c.visible).length}
              </div>
              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                Total links: {(config.columns || []).reduce((acc, c) => acc + (c.links?.length || 0), 0)}
              </div>
            </div>

            <div style={{ padding: "16px", background: "#F9FAFB", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
              <div style={labelStyle}>Snapshots Stored</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#1F2937" }}>{snapshots.length}</div>
              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                Available for 1-click rollback
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TRUST STRIP ─── */}
      {activeTab === "trust" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>Trust Badges &amp; Value Propositions</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>
                Configure the high-trust bar displayed right above the footer.
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.trustStrip?.enabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    trustStrip: { ...prev.trustStrip, enabled: e.target.checked },
                  }))
                }
              />
              Enable Trust Bar
            </label>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Tagline / Script Text (Right-aligned brand signature)</label>
            <input
              style={inputStyle}
              value={config.trustStrip?.tagline || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  trustStrip: { ...prev.trustStrip, tagline: e.target.value },
                }))
              }
              placeholder="Together for a healthier tomorrow ♡"
            />
          </div>

          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#374151" }}>Trust Badges Items</h4>
              <button
                type="button"
                onClick={addTrustItem}
                style={{
                  padding: "6px 14px",
                  background: "#2A0F3A",
                  color: "#D4AF37",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add Trust Badge
              </button>
            </div>

            {(config.trustStrip?.items || []).map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1.2fr 1.2fr 1.5fr auto auto auto auto",
                  gap: "10px",
                  alignItems: "center",
                  padding: "12px",
                  background: item.visible ? "#F9FAFB" : "#FEF2F2",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <label style={labelStyle}>Icon</label>
                  <input
                    style={{ ...inputStyle, textAlign: "center", fontSize: "16px" }}
                    value={item.icon}
                    onChange={(e) => updateTrustItem(idx, { icon: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    style={inputStyle}
                    value={item.title}
                    onChange={(e) => updateTrustItem(idx, { title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Subtitle</label>
                  <input
                    style={inputStyle}
                    value={item.subtitle}
                    onChange={(e) => updateTrustItem(idx, { subtitle: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Link URL (Optional)</label>
                  <input
                    style={inputStyle}
                    value={item.linkUrl || ""}
                    onChange={(e) => updateTrustItem(idx, { linkUrl: e.target.value })}
                    placeholder="/about"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Visibility</label>
                  <button
                    type="button"
                    onClick={() => updateTrustItem(idx, { visible: !item.visible })}
                    style={{
                      padding: "8px 12px",
                      background: item.visible ? "#D1FAE5" : "#FEE2E2",
                      color: item.visible ? "#065F46" : "#991B1B",
                      border: "1px solid #D1D5DB",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {item.visible ? "VISIBLE" : "HIDDEN"}
                  </button>
                </div>
                <div>
                  <label style={labelStyle}>Clickable</label>
                  <button
                    type="button"
                    aria-pressed={item.clickable !== false}
                    onClick={() => updateTrustItem(idx, { clickable: item.clickable === false })}
                    title={item.clickable === false ? "Non-clickable: item renders as text (no navigation)" : "Clickable: item links to the configured destination"}
                    style={{
                      padding: "8px 12px",
                      background: item.clickable === false ? "#FEE2E2" : "#D1FAE5",
                      color: item.clickable === false ? "#991B1B" : "#065F46",
                      border: "1px solid #D1D5DB",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {item.clickable === false ? "CLICKABLE: OFF" : "CLICKABLE: ON"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: "4px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => moveTrustItem(idx, "up")}
                    disabled={idx === 0}
                    style={{ padding: "6px 8px", background: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "4px", cursor: "pointer" }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTrustItem(idx, "down")}
                    disabled={idx === (config.trustStrip?.items?.length || 0) - 1}
                    style={{ padding: "6px 8px", background: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "4px", cursor: "pointer" }}
                  >
                    ↓
                  </button>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => removeTrustItem(idx)}
                    style={{
                      padding: "6px 10px",
                      background: "#FEE2E2",
                      color: "#991B1B",
                      border: "1px solid #FCA5A5",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: BRAND & SOCIAL ─── */}
      {activeTab === "brand" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#111827" }}>Brand Identity &amp; Bio</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Logo Image URL</label>
              <input
                style={inputStyle}
                value={config.brand?.logoUrl || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, logoUrl: e.target.value },
                  }))
                }
                placeholder="/images/brand/queens-care-official-original.png"
              />
            </div>
            <div>
              <label style={labelStyle}>Logo Alt Text</label>
              <input
                style={inputStyle}
                value={config.brand?.logoAlt || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, logoAlt: e.target.value },
                  }))
                }
                placeholder="Queens Care Laboratories"
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Logo Height (px)</label>
            <input
              type="number"
              style={{ ...inputStyle, width: "120px" }}
              value={config.brand?.logoHeight || 54}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, logoHeight: Number(e.target.value) || 54 },
                }))
              }
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Brand About Paragraph</label>
            <textarea
              rows={3}
              style={inputStyle}
              value={config.brand?.aboutText || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, aboutText: e.target.value },
                }))
              }
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Certifications / Badges Text</label>
            <input
              style={inputStyle}
              value={config.brand?.certificationsText || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, certificationsText: e.target.value },
                }))
              }
              placeholder="✦ ISO 9001:2015 & WHO-GMP Certified"
            />
          </div>

          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <label style={labelStyle}>Footer Social Media Links</label>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
                  Renders the official social media channels configured in Admin → Social Media.
                </p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={config.brand?.showSocialMedia}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      brand: { ...prev.brand, showSocialMedia: e.target.checked },
                    }))
                  }
                />
                Show Social Media
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: NAVIGATION COLUMNS ─── */}
      {activeTab === "columns" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>Navigation Columns &amp; Links</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>
                Add, reorder, and configure footer columns. Select from CMS pages or enter custom links.
              </p>
            </div>
            <button
              type="button"
              onClick={addColumn}
              style={{
                padding: "8px 16px",
                background: "#2A0F3A",
                color: "#D4AF37",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add New Column
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {(config.columns || []).map((col, colIdx) => (
              <div
                key={col.id}
                style={{
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  background: "#F9FAFB",
                  padding: "16px",
                }}
              >
                {/* Column Header Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    borderBottom: "1px solid #E5E7EB",
                    paddingBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "400px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#6B7280" }}>Col #{colIdx + 1}</span>
                    <input
                      style={{ ...inputStyle, fontWeight: 700 }}
                      value={col.title}
                      onChange={(e) => updateColumnTitle(colIdx, e.target.value)}
                      placeholder="Column Title"
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => toggleColumnVisible(colIdx)}
                      style={{
                        padding: "6px 12px",
                        background: col.visible ? "#D1FAE5" : "#FEE2E2",
                        color: col.visible ? "#065F46" : "#991B1B",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {col.visible ? "VISIBLE" : "HIDDEN"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeColumn(colIdx)}
                      style={{
                        padding: "6px 12px",
                        background: "#FEE2E2",
                        color: "#991B1B",
                        border: "1px solid #FCA5A5",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Delete Column
                    </button>
                  </div>
                </div>

                {/* Column Links List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(col.links || []).map((link, linkIdx) => (
                    <div
                      key={link.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1.5fr 150px 100px auto auto",
                        gap: "8px",
                        alignItems: "center",
                        background: "#FFFFFF",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Label</label>
                        <input
                          style={inputStyle}
                          value={link.label}
                          onChange={(e) => updateLinkInColumn(colIdx, linkIdx, { label: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>
                          URL / Page Route
                        </label>
                        <input
                          style={inputStyle}
                          value={link.href}
                          onChange={(e) => updateLinkInColumn(colIdx, linkIdx, { href: e.target.value })}
                          placeholder="/about"
                        />
                      </div>

                      {/* Quick CMS Page Selector */}
                      <div>
                        <label style={labelStyle}>Pick Page</label>
                        <select
                          style={inputStyle}
                          value=""
                          onChange={(e) => {
                            const selectedPage = pages.find((p) => p.slug === e.target.value);
                            if (selectedPage) {
                              updateLinkInColumn(colIdx, linkIdx, {
                                label: selectedPage.title,
                                href: selectedPage.slug,
                              });
                            }
                          }}
                        >
                          <option value="">-- CMS Page --</option>
                          {pages.map((p) => (
                            <option key={p.id} value={p.slug}>
                              {p.title} ({p.slug})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Badge</label>
                        <input
                          style={inputStyle}
                          value={link.badge || ""}
                          onChange={(e) => updateLinkInColumn(colIdx, linkIdx, { badge: e.target.value })}
                          placeholder="New"
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Status</label>
                        <button
                          type="button"
                          onClick={() => updateLinkInColumn(colIdx, linkIdx, { visible: !link.visible })}
                          style={{
                            padding: "6px 8px",
                            background: link.visible ? "#D1FAE5" : "#FEE2E2",
                            color: link.visible ? "#065F46" : "#991B1B",
                            border: "1px solid #D1D5DB",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {link.visible ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div style={{ marginTop: "14px" }}>
                        <button
                          type="button"
                          onClick={() => removeLinkFromColumn(colIdx, linkIdx)}
                          style={{
                            padding: "6px 8px",
                            background: "transparent",
                            color: "#EF4444",
                            border: "none",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addLinkToColumn(colIdx)}
                    style={{
                      alignSelf: "flex-start",
                      padding: "6px 14px",
                      background: "#FFFFFF",
                      border: "1px dashed #D1D5DB",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#4B5563",
                      cursor: "pointer",
                      marginTop: "6px",
                    }}
                  >
                    + Add Link to {col.title || "Column"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 5: PATIENT SUPPORT ─── */}
      {activeTab === "contact" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>Patient Support &amp; Verification Block</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>
                Company contact helpline, headquarters, and verification credentials.
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.contact?.enabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, enabled: e.target.checked },
                  }))
                }
              />
              Enable Support Block
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Section Title</label>
              <input
                style={inputStyle}
                value={config.contact?.title || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, title: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Headquarters Label</label>
              <input
                style={inputStyle}
                value={config.contact?.headquartersLabel || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, headquartersLabel: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Headquarters Address / Formulation Hub</label>
            <input
              style={inputStyle}
              value={config.contact?.headquartersText || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, headquartersText: e.target.value },
                }))
              }
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Helpline Number</label>
              <input
                style={inputStyle}
                value={config.contact?.helplineText || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, helplineText: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Verification / Support Email</label>
              <input
                style={inputStyle}
                value={config.contact?.verificationText || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, verificationText: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          {/* Badges / Trust Pills */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#374151" }}>Trust Pills / Staff Badges</h4>
              <button
                type="button"
                onClick={addContactBadge}
                style={{
                  padding: "6px 12px",
                  background: "#2A0F3A",
                  color: "#D4AF37",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add Badge
              </button>
            </div>

            {(config.contact?.badges || []).map((badge, idx) => (
              <div
                key={badge.id}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "8px",
                  background: "#F9FAFB",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <input
                  style={{ ...inputStyle, width: "200px" }}
                  value={badge.label}
                  onChange={(e) => updateContactBadge(idx, { label: e.target.value })}
                />
                <select
                  style={{ ...inputStyle, width: "120px" }}
                  value={badge.styleVariant || "gold"}
                  onChange={(e) =>
                    updateContactBadge(idx, {
                      styleVariant: e.target.value as "gold" | "white" | "outline",
                    })
                  }
                >
                  <option value="gold">Gold Pill</option>
                  <option value="white">White Pill</option>
                  <option value="outline">Outline</option>
                </select>
                <button
                  type="button"
                  onClick={() => updateContactBadge(idx, { visible: !badge.visible })}
                  style={{
                    padding: "6px 10px",
                    background: badge.visible ? "#D1FAE5" : "#FEE2E2",
                    color: badge.visible ? "#065F46" : "#991B1B",
                    border: "1px solid #D1D5DB",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {badge.visible ? "VISIBLE" : "HIDDEN"}
                </button>
                <button
                  type="button"
                  onClick={() => removeContactBadge(idx)}
                  style={{
                    padding: "6px 10px",
                    background: "transparent",
                    color: "#EF4444",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 6: STATUTORY & LEGAL ─── */}
      {activeTab === "regulatory" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>Statutory &amp; Regulatory Compliance Panel</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>
                Legitimate pharmaceutical and tax registrations (Drug License, FSSAI, GSTIN, Pharmacist).
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.regulatory?.enabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regulatory: { ...prev.regulatory, enabled: e.target.checked },
                  }))
                }
              />
              Enable Compliance Panel
            </label>
          </div>

          <div
            style={{
              padding: "12px 16px",
              background: "#EEF2FF",
              borderRadius: "6px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#3730A3" }}>
                Auto-Sync with Company Business Settings
              </div>
              <div style={{ fontSize: "12px", color: "#4F46E5" }}>
                When enabled, licenses will automatically reflect values from Admin → Settings → Company Info.
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.regulatory?.useCompanyInfoSettings}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regulatory: { ...prev.regulatory, useCompanyInfoSettings: e.target.checked },
                  }))
                }
              />
              Auto-Sync
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Drug License Number</label>
              <input
                style={inputStyle}
                value={config.regulatory?.customDrugLicenseNo || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regulatory: { ...prev.regulatory, customDrugLicenseNo: e.target.value },
                  }))
                }
                placeholder="e.g. MH-MZ3-294819"
              />
            </div>
            <div>
              <label style={labelStyle}>FSSAI Central License Number</label>
              <input
                style={inputStyle}
                value={config.regulatory?.customFssaiNo || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regulatory: { ...prev.regulatory, customFssaiNo: e.target.value },
                  }))
                }
                placeholder="e.g. 10021022000123"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>GSTIN Number</label>
              <input
                style={inputStyle}
                value={config.regulatory?.customGstin || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regulatory: { ...prev.regulatory, customGstin: e.target.value },
                  }))
                }
                placeholder="e.g. 27AAAAQ1234F1Z5"
              />
            </div>
            <div>
              <label style={labelStyle}>In-House Registered Pharmacist</label>
              <input
                style={inputStyle}
                value={config.regulatory?.customPharmacistInfo || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regulatory: { ...prev.regulatory, customPharmacistInfo: e.target.value },
                  }))
                }
                placeholder="e.g. Dr. V. Singhania (Reg. #58492)"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Grievance Officer Email</label>
              <input
                style={inputStyle}
                value={config.regulatory?.customGrievanceEmail || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regulatory: { ...prev.regulatory, customGrievanceEmail: e.target.value },
                  }))
                }
                placeholder="grievance@queenscare.in"
              />
            </div>
            <div>
              <label style={labelStyle}>Dispatch Quality Protocol Text</label>
              <input
                style={inputStyle}
                value={config.regulatory?.dispatchProtocolText || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regulatory: { ...prev.regulatory, dispatchProtocolText: e.target.value },
                  }))
                }
                placeholder="100% Batch Inspection Protocol"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: CLINICAL NOTICE ─── */}
      {activeTab === "clinical" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>Clinical Notice &amp; Medical Disclaimers</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>
                Mandatory pharmaceutical disclaimers, dietary supplement notices, and medical warnings.
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.clinicalNotice?.enabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    clinicalNotice: { ...prev.clinicalNotice, enabled: e.target.checked },
                  }))
                }
              />
              Enable Clinical Notice
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Notice Title</label>
            <input
              style={inputStyle}
              value={config.clinicalNotice?.title || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  clinicalNotice: { ...prev.clinicalNotice, title: e.target.value },
                }))
              }
              placeholder="CLINICAL NOTICE"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Clinical Notice HTML Content (Safe tags allowed: b, i, a, span)</label>
            <textarea
              rows={4}
              style={inputStyle}
              value={config.clinicalNotice?.contentHtml || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  clinicalNotice: { ...prev.clinicalNotice, contentHtml: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label style={labelStyle}>Fallback Healthcare Disclaimer (Shown when regulatory block is unconfigured)</label>
            <textarea
              rows={3}
              style={inputStyle}
              value={config.clinicalNotice?.fallbackDisclaimer || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  clinicalNotice: { ...prev.clinicalNotice, fallbackDisclaimer: e.target.value },
                }))
              }
            />
          </div>
        </div>
      )}

      {/* ─── TAB 8: COPYRIGHT & POLICIES ─── */}
      {activeTab === "copyright" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#111827" }}>Copyright &amp; Bottom Legal Links</h3>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>
              Copyright Template (Supported Tokens: <code>{"{{YEAR}}"}</code>, <code>{"{{COMPANY_NAME}}"}</code>)
            </label>
            <input
              style={inputStyle}
              value={config.copyright?.template || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  copyright: { ...prev.copyright, template: e.target.value },
                }))
              }
              placeholder="© {{YEAR}} {{COMPANY_NAME}}. All rights reserved."
            />
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
              Dynamic preview: © {new Date().getFullYear()} Queens Care Laboratories Ltd. All rights reserved.
            </div>
          </div>

          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#374151" }}>Bottom Legal Policy Links</h4>
              <button
                type="button"
                onClick={addCopyrightLink}
                style={{
                  padding: "6px 12px",
                  background: "#2A0F3A",
                  color: "#D4AF37",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add Policy Link
              </button>
            </div>

            {(config.copyright?.links || []).map((link, idx) => (
              <div
                key={link.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.5fr 150px auto auto",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "8px",
                  background: "#F9FAFB",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div>
                  <label style={labelStyle}>Label</label>
                  <input
                    style={inputStyle}
                    value={link.label}
                    onChange={(e) => updateCopyrightLink(idx, { label: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>URL</label>
                  <input
                    style={inputStyle}
                    value={link.href}
                    onChange={(e) => updateCopyrightLink(idx, { href: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pick Page</label>
                  <select
                    style={inputStyle}
                    value=""
                    onChange={(e) => {
                      const sel = pages.find((p) => p.slug === e.target.value);
                      if (sel) {
                        updateCopyrightLink(idx, { label: sel.title, href: sel.slug });
                      }
                    }}
                  >
                    <option value="">-- CMS Page --</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Visibility</label>
                  <button
                    type="button"
                    onClick={() => updateCopyrightLink(idx, { visible: !link.visible })}
                    style={{
                      padding: "6px 10px",
                      background: link.visible ? "#D1FAE5" : "#FEE2E2",
                      color: link.visible ? "#065F46" : "#991B1B",
                      border: "1px solid #D1D5DB",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {link.visible ? "ON" : "OFF"}
                  </button>
                </div>
                <div style={{ marginTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => removeCopyrightLink(idx)}
                    style={{
                      padding: "6px 8px",
                      background: "transparent",
                      color: "#EF4444",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 9: THEME & STYLING ─── */}
      {activeTab === "styling" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#111827" }}>Visual Theme &amp; Palettes</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Main Footer Background Color</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="color"
                  value={config.styling?.backgroundColor || "#150522"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      styling: { ...prev.styling, backgroundColor: e.target.value },
                    }))
                  }
                  style={{ width: "40px", height: "36px", padding: 0, border: "none", cursor: "pointer" }}
                />
                <input
                  style={inputStyle}
                  value={config.styling?.backgroundColor || "#150522"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      styling: { ...prev.styling, backgroundColor: e.target.value },
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Gold Accent Color</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="color"
                  value={config.styling?.accentColor || "#D4AF37"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      styling: { ...prev.styling, accentColor: e.target.value },
                    }))
                  }
                  style={{ width: "40px", height: "36px", padding: 0, border: "none", cursor: "pointer" }}
                />
                <input
                  style={inputStyle}
                  value={config.styling?.accentColor || "#D4AF37"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      styling: { ...prev.styling, accentColor: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Trust Bar Background Gradient / Color</label>
            <input
              style={inputStyle}
              value={config.styling?.trustBarBg || ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  styling: { ...prev.styling, trustBarBg: e.target.value },
                }))
              }
              placeholder="linear-gradient(135deg, #1C0A2E 0%, #2A0F3A 50%, #180927 100%)"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Text Color</label>
              <input
                style={inputStyle}
                value={config.styling?.textColor || "#FAF8F5"}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    styling: { ...prev.styling, textColor: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Muted Text Color</label>
              <input
                style={inputStyle}
                value={config.styling?.mutedTextColor || "rgba(255, 255, 255, 0.7)"}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    styling: { ...prev.styling, mutedTextColor: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 10: VERSION HISTORY & ROLLBACK ─── */}
      {activeTab === "history" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>Snapshot History &amp; 1-Click Rollback</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>
                Every live publication automatically creates a version snapshot. Restore any previous version safely.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              style={{
                padding: "8px 16px",
                background: "#FEE2E2",
                color: "#991B1B",
                border: "1px solid #FCA5A5",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⚠️ Reset to Factory Defaults
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#9CA3AF", fontSize: "13px" }}>
              No snapshots created yet. Publishing the footer will create your first version snapshot.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                        Version {snap.version}
                      </span>
                      <span style={{ fontSize: "11px", color: "#6B7280" }}>
                        ({new Date(snap.timestamp).toLocaleString()})
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#4B5563", marginTop: "2px" }}>
                      {snap.summary} • Published by: <em>{snap.publishedBy}</em>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRollback(snap.id)}
                    disabled={saving}
                    style={{
                      padding: "6px 14px",
                      background: "#2A0F3A",
                      color: "#D4AF37",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Restore v{snap.version}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
