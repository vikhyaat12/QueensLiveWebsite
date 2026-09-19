"use client";

import React, { useEffect, useState, useCallback } from "react";

interface AnalyticsConfig {
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

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e8e4df", borderRadius: 10, padding: 20, marginBottom: 16 };
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#2A0F3A", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em" };
const help: React.CSSProperties = { fontSize: 11.5, color: "#71717A", margin: "4px 0 10px", lineHeight: 1.5 };
const input: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #e2ddd5", borderRadius: 6, fontSize: 13, background: "#fff", boxSizing: "border-box" };
const toggleRow: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #f0ece5" };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#2A0F3A", fontWeight: 600 }}>
      <span
        role="switch"
        aria-checked={on}
        tabIndex={0}
        onClick={() => onChange(!on)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(!on); } }}
        style={{ width: 40, height: 22, borderRadius: 11, background: on ? "#166534" : "#d4d0c8", position: "relative", transition: "background .15s", flexShrink: 0 }}
      >
        <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
      </span>
      {label}
    </label>
  );
}

export default function AnalyticsSettingsPanel() {
  const [cfg, setCfg] = useState<AnalyticsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/analytics-config");
      const d = await r.json();
      if (r.ok && d.config) setCfg(d.config);
      else setMsg({ type: "err", text: d.error || "Failed to load analytics settings." });
    } catch {
      setMsg({ type: "err", text: "Network error loading analytics settings." });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/analytics-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const d = await r.json();
      if (r.ok) {
        setCfg(d.config);
        const warn = Array.isArray(d.warnings) && d.warnings.length ? ` Saved with warnings: ${d.warnings.join(" ")}` : "";
        setMsg({ type: warn ? "err" : "ok", text: `Analytics settings saved.${warn}` });
      } else {
        setMsg({ type: "err", text: d.error || "Save failed." });
      }
    } catch {
      setMsg({ type: "err", text: "Network error saving settings." });
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#71717A" }}>Loading analytics settings…</div>;
  if (!cfg) return <div style={{ padding: 40, textAlign: "center", color: "#b91c1c" }}>{msg?.text || "Settings unavailable."}</div>;

  const upd = (fn: (c: AnalyticsConfig) => void) => setCfg(prev => { const c = JSON.parse(JSON.stringify(prev)); fn(c); return c; });

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#2A0F3A", margin: 0 }}>Analytics &amp; Tracking</h2>
          <p style={{ fontSize: 12.5, color: "#71717A", margin: "4px 0 0" }}>
            Configure marketing integrations without code. Vendor IDs are public values; no credentials are stored here.
          </p>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 22px", background: "#2A0F3A", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 600, background: msg.type === "ok" ? "#f0fdf4" : "#fef2f2", color: msg.type === "ok" ? "#166534" : "#b91c1c", border: `1px solid ${msg.type === "ok" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      {/* Master */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2A0F3A", margin: "0 0 6px" }}>Master Control</h3>
        <p style={help}>When OFF, no analytics events are recorded and no vendor scripts load anywhere on the site.</p>
        <Toggle on={cfg.enabled} onChange={v => upd(c => { c.enabled = v; })} label="Enable analytics & tracking site-wide" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          <div>
            <label style={label}>Environment</label>
            <p style={help}>Tag data by environment. Only affects internal labeling and display.</p>
            <select style={input} value={cfg.environment} onChange={e => upd(c => { c.environment = e.target.value as AnalyticsConfig["environment"]; })}>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div>
            <label style={label}>Tracking Mode</label>
            <p style={help}>
              <b>Consent-based</b>: vendor scripts load only after visitor accepts. <b>All visitors</b>: load immediately. <b>Privacy mode</b>: internal analytics only.
            </p>
            <select style={input} value={cfg.trackingMode} onChange={e => upd(c => { c.trackingMode = e.target.value as AnalyticsConfig["trackingMode"]; })}>
              <option value="consent_based">Consent-based (recommended)</option>
              <option value="all_visitors">All visitors</option>
              <option value="privacy_mode">Privacy mode (internal only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* GA4 */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2A0F3A", margin: "0 0 6px" }}>Google Analytics 4</h3>
        <Toggle on={cfg.ga4.enabled} onChange={v => upd(c => { c.ga4.enabled = v; })} label="Enable GA4" />
        <div style={{ marginTop: 10 }}>
          <label style={label}>Measurement ID</label>
          <p style={help}>Format: G-XXXXXXXXXX. Found in GA4 Admin → Data Streams.</p>
          <input style={input} placeholder="G-XXXXXXXXXX" value={cfg.ga4.measurementId} onChange={e => upd(c => { c.ga4.measurementId = e.target.value; })} maxLength={20} />
        </div>
      </div>

      {/* Meta Pixel */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2A0F3A", margin: "0 0 6px" }}>Meta Pixel</h3>
        <Toggle on={cfg.meta.enabled} onChange={v => upd(c => { c.meta.enabled = v; })} label="Enable Meta Pixel" />
        <div style={{ marginTop: 10 }}>
          <label style={label}>Pixel ID</label>
          <p style={help}>Numeric ID from Meta Events Manager. Only ecommerce events are sent — never personal or health data.</p>
          <input style={input} placeholder="1234567890123456" value={cfg.meta.pixelId} onChange={e => upd(c => { c.meta.pixelId = e.target.value; })} maxLength={24} />
        </div>
      </div>

      {/* GTM */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2A0F3A", margin: "0 0 6px" }}>Google Tag Manager</h3>
        <Toggle on={cfg.gtm.enabled} onChange={v => upd(c => { c.gtm.enabled = v; })} label="Enable GTM" />
        <div style={{ marginTop: 10 }}>
          <label style={label}>Container ID</label>
          <p style={help}>Format: GTM-XXXXXXX. GTM receives the same ecommerce dataLayer events for custom tags.</p>
          <input style={input} placeholder="GTM-XXXXXXX" value={cfg.gtm.containerId} onChange={e => upd(c => { c.gtm.containerId = e.target.value; })} maxLength={20} />
        </div>
      </div>

      {/* Search Console */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2A0F3A", margin: "0 0 6px" }}>Google Search Console</h3>
        <label style={label}>Verification Token</label>
        <p style={help}>Paste the <code>content</code> value from the google-site-verification meta tag. Rendered in &lt;head&gt; automatically.</p>
        <input style={input} placeholder="e.g. abC123dEf..." value={cfg.searchConsole.verificationToken} onChange={e => upd(c => { c.searchConsole.verificationToken = e.target.value; })} maxLength={120} />
      </div>

      {/* Clarity */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2A0F3A", margin: "0 0 6px" }}>Microsoft Clarity</h3>
        <p style={help}>Privacy-safe session analytics (no PII collected by Clarity by design).</p>
        <Toggle on={cfg.clarity.enabled} onChange={v => upd(c => { c.clarity.enabled = v; })} label="Enable Microsoft Clarity" />
        <div style={{ marginTop: 10 }}>
          <label style={label}>Project ID</label>
          <input style={input} placeholder="xxxxxxxxxx" value={cfg.clarity.projectId} onChange={e => upd(c => { c.clarity.projectId = e.target.value; })} maxLength={24} />
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 8 }}>
        {cfg.updatedAt ? `Last updated: ${new Date(cfg.updatedAt).toLocaleString()}` : "Never saved yet."}
        {" · "}Changes are audit-logged.
      </p>
    </div>
  );
}
