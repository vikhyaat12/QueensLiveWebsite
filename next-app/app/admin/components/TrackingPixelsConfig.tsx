"use client";

import React, { useState, useEffect } from "react";
import { QueensCareAnalytics } from "@/lib/analytics/queenscare-analytics";

interface AnalyticsConfigState {
  enabled: boolean;
  environment: "development" | "staging" | "production";
  trackingMode: "all_visitors" | "consent_based" | "privacy_mode";
  ga4: { enabled: boolean; measurementId: string };
  meta: { enabled: boolean; pixelId: string };
  gtm: { enabled: boolean; containerId: string };
  searchConsole: { verificationToken: string };
  clarity: { enabled: boolean; projectId: string };
  updatedAt?: string;
}

const DEFAULT_CONFIG: AnalyticsConfigState = {
  enabled: false,
  environment: "development",
  trackingMode: "consent_based",
  ga4: { enabled: false, measurementId: "" },
  meta: { enabled: false, pixelId: "" },
  gtm: { enabled: false, containerId: "" },
  searchConsole: { verificationToken: "" },
  clarity: { enabled: false, projectId: "" },
};

export default function TrackingPixelsConfig() {
  const [config, setConfig] = useState<AnalyticsConfigState>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/analytics-config");
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setConfig({
              ...DEFAULT_CONFIG,
              ...data.config,
              ga4: { ...DEFAULT_CONFIG.ga4, ...data.config.ga4 },
              meta: { ...DEFAULT_CONFIG.meta, ...data.config.meta },
              gtm: { ...DEFAULT_CONFIG.gtm, ...data.config.gtm },
              searchConsole: { ...DEFAULT_CONFIG.searchConsole, ...data.config.searchConsole },
              clarity: { ...DEFAULT_CONFIG.clarity, ...data.config.clarity },
            });
          }
        }
      } catch (err) {
        console.error("Failed to load tracking configuration:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/analytics-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update configuration");
      }
      setConfig((prev) => ({
        ...prev,
        ...data.config,
      }));
      setMessage({ type: "success", text: "Tracking and pixel configurations saved successfully." });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error saving configuration";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setSaving(false);
    }
  };

  const runDiagnosticTest = () => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = `[${timestamp}] Dispatched diagnostic event 'qc_admin_test_diagnostic' across enabled pipelines (GA4, Meta, DataLayer).`;
    QueensCareAnalytics.track("qc_admin_test_diagnostic", {
      timestamp: Date.now(),
      environment: config.environment,
      source: "admin_control_center",
    });
    setDiagnosticLogs((prev) => [newLog, ...prev.slice(0, 4)]);
  };

  const isGa4Valid = !config.ga4.measurementId || /^G-[A-Za-z0-9]{4,14}$/i.test(config.ga4.measurementId.trim());
  const isMetaValid = !config.meta.pixelId || /^\d{8,20}$/.test(config.meta.pixelId.trim());
  const isGtmValid = !config.gtm.containerId || /^GTM-[A-Za-z0-9]{4,12}$/i.test(config.gtm.containerId.trim());

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
        <p>Loading tracking and pixels configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Header & Status Banner */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5DECF",
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 6px 0", color: "#2A0F3A", fontSize: 18, fontWeight: 700 }}>
            Analytics Control Center & Tracking Adapters
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
            Configure production analytics adapters, privacy consent modes, and vendor pixels.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: config.enabled ? "#DCFCE7" : "#FEE2E2",
              color: config.enabled ? "#166534" : "#991B1B",
            }}
          >
            {config.enabled ? "● Tracking ACTIVE" : "○ Tracking DISABLED"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "#2A0F3A",
              color: "#D4AF37",
              border: "none",
              padding: "9px 20px",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            background: message.type === "success" ? "#DEF7EC" : "#FDE8E8",
            color: message.type === "success" ? "#03543F" : "#9B1C1C",
            border: `1px solid ${message.type === "success" ? "#BCF0DA" : "#F8B4B4"}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Master Settings */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5DECF",
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h4 style={{ margin: "0 0 16px 0", color: "#2A0F3A", fontSize: 15, fontWeight: 700 }}>
          Global Governance & Privacy Rules
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#2A0F3A", marginBottom: 6 }}>
              Master Tracking Switch
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              Enable Global Tracking & Pixels
            </label>
            <span style={{ display: "block", fontSize: 11, color: "#888", marginTop: 4 }}>
              When disabled, no external tracking scripts or conversion beacons are injected.
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#2A0F3A", marginBottom: 6 }}>
              Environment
            </label>
            <select
              value={config.environment}
              onChange={(e) =>
                setConfig({ ...config, environment: e.target.value as AnalyticsConfigState["environment"] })
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                fontSize: 13,
                background: "#FAF8F5",
              }}
            >
              <option value="development">Development (Local Testing)</option>
              <option value="staging">Staging (Pre-launch Staging)</option>
              <option value="production">Production (Live Storefront)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#2A0F3A", marginBottom: 6 }}>
              Consent & Privacy Mode
            </label>
            <select
              value={config.trackingMode}
              onChange={(e) =>
                setConfig({ ...config, trackingMode: e.target.value as AnalyticsConfigState["trackingMode"] })
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                fontSize: 13,
                background: "#FAF8F5",
              }}
            >
              <option value="consent_based">Consent-Based (Cookie Banner Acceptance Required)</option>
              <option value="all_visitors">Standard (All Visitors Anonymized)</option>
              <option value="privacy_mode">Strict Privacy Mode (Zero External Pings)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tracking Providers Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* GA4 */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5DECF", borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: "#2A0F3A", fontSize: 14, fontWeight: 700 }}>
              📈 Google Analytics 4 (GA4)
            </h4>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.ga4.enabled}
                onChange={(e) => setConfig({ ...config, ga4: { ...config.ga4, enabled: e.target.checked } })}
              />
              Active
            </label>
          </div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 4 }}>
            MEASUREMENT ID
          </label>
          <input
            type="text"
            placeholder="G-XXXXXXXXXX"
            value={config.ga4.measurementId}
            onChange={(e) => setConfig({ ...config, ga4: { ...config.ga4, measurementId: e.target.value } })}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${isGa4Valid ? "#D1D5DB" : "#EF4444"}`,
              fontSize: 13,
            }}
          />
          {!isGa4Valid && (
            <span style={{ display: "block", fontSize: 11, color: "#EF4444", marginTop: 4 }}>
              Format must be G- followed by alphanumeric characters.
            </span>
          )}
        </div>

        {/* Meta Pixel */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5DECF", borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: "#2A0F3A", fontSize: 14, fontWeight: 700 }}>
              🎯 Meta (Facebook) Pixel
            </h4>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.meta.enabled}
                onChange={(e) => setConfig({ ...config, meta: { ...config.meta, enabled: e.target.checked } })}
              />
              Active
            </label>
          </div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 4 }}>
            PIXEL ID
          </label>
          <input
            type="text"
            placeholder="123456789012345"
            value={config.meta.pixelId}
            onChange={(e) => setConfig({ ...config, meta: { ...config.meta, pixelId: e.target.value } })}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${isMetaValid ? "#D1D5DB" : "#EF4444"}`,
              fontSize: 13,
            }}
          />
          {!isMetaValid && (
            <span style={{ display: "block", fontSize: 11, color: "#EF4444", marginTop: 4 }}>
              Pixel ID must contain only digits (8-20 characters).
            </span>
          )}
        </div>

        {/* Google Tag Manager */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5DECF", borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: "#2A0F3A", fontSize: 14, fontWeight: 700 }}>
              🏷️ Google Tag Manager (GTM)
            </h4>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.gtm.enabled}
                onChange={(e) => setConfig({ ...config, gtm: { ...config.gtm, enabled: e.target.checked } })}
              />
              Active
            </label>
          </div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 4 }}>
            CONTAINER ID
          </label>
          <input
            type="text"
            placeholder="GTM-XXXXXXX"
            value={config.gtm.containerId}
            onChange={(e) => setConfig({ ...config, gtm: { ...config.gtm, containerId: e.target.value } })}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${isGtmValid ? "#D1D5DB" : "#EF4444"}`,
              fontSize: 13,
            }}
          />
          {!isGtmValid && (
            <span style={{ display: "block", fontSize: 11, color: "#EF4444", marginTop: 4 }}>
              Format must be GTM- followed by letters or digits.
            </span>
          )}
        </div>

        {/* Microsoft Clarity */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5DECF", borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: "#2A0F3A", fontSize: 14, fontWeight: 700 }}>
              👁️ Microsoft Clarity Heatmaps
            </h4>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.clarity.enabled}
                onChange={(e) => setConfig({ ...config, clarity: { ...config.clarity, enabled: e.target.checked } })}
              />
              Active
            </label>
          </div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 4 }}>
            PROJECT ID
          </label>
          <input
            type="text"
            placeholder="e.g. k49f82kd"
            value={config.clarity.projectId}
            onChange={(e) => setConfig({ ...config, clarity: { ...config.clarity, projectId: e.target.value } })}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              fontSize: 13,
            }}
          />
        </div>

        {/* Google Search Console */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5DECF", borderRadius: 8, padding: 20 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#2A0F3A", fontSize: 14, fontWeight: 700 }}>
            🔍 Google Search Console
          </h4>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 4 }}>
            HTML VERIFICATION TOKEN
          </label>
          <input
            type="text"
            placeholder="e.g. abcdef123456789"
            value={config.searchConsole.verificationToken}
            onChange={(e) =>
              setConfig({ ...config, searchConsole: { verificationToken: e.target.value } })
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              fontSize: 13,
            }}
          />
          <span style={{ display: "block", fontSize: 11, color: "#888", marginTop: 4 }}>
            Injected into storefront HTML head tag automatically.
          </span>
        </div>

        {/* Diagnostic Tool */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5DECF", borderRadius: 8, padding: 20 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#2A0F3A", fontSize: 14, fontWeight: 700 }}>
            🧪 Live Event Bus Diagnostics
          </h4>
          <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px 0" }}>
            Trigger a real synthetic event through `queenscare-analytics.ts` to test client-side dataLayer and vendor dispatch.
          </p>
          <button
            type="button"
            onClick={runDiagnosticTest}
            style={{
              background: "#FAF8F5",
              border: "1px solid #2A0F3A",
              color: "#2A0F3A",
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            Dispatch Test Event
          </button>
          {diagnosticLogs.length > 0 && (
            <div
              style={{
                background: "#2A0F3A",
                color: "#D4AF37",
                padding: "8px 12px",
                borderRadius: 4,
                fontFamily: "monospace",
                fontSize: 11,
                maxHeight: 90,
                overflowY: "auto",
              }}
            >
              {diagnosticLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
