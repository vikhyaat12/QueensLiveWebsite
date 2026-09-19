"use client";

import { useState, useEffect } from "react";
import type { SupportSettings } from "@/lib/support/support-types";

export default function AdminSupportSettings() {
  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/support/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {
        setStatusMessage("Failed to load support settings");
        setIsError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || saving) return;

    setSaving(true);
    setStatusMessage("");
    try {
      const res = await fetch("/api/admin/support/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setStatusMessage("Support settings saved successfully!");
        setIsError(false);
      } else {
        setStatusMessage(data.error || "Failed to save settings");
        setIsError(true);
      }
    } catch {
      setStatusMessage("Network error saving settings");
      setIsError(true);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: 14 }}>
        Loading support configuration…
      </div>
    );
  }

  if (!settings) return null;

  const sectionStyle = {
    background: "#FFFFFF",
    borderRadius: 8,
    padding: "20px 24px",
    marginBottom: 20,
    border: "1px solid rgba(42,15,58,0.1)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#2A0F3A",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid rgba(42,15,58,0.15)",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    background: "#FAF8F5",
  };

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#2A0F3A" }}>
          Clinical Chat &amp; Support Settings
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
          Configure live support desk availability, AI assistant handoff, and patient-facing copy.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            background: isError ? "#FEE2E2" : "#DCFCE7",
            color: isError ? "#B91C1C" : "#15803D",
            border: isError ? "1px solid #FCA5A5" : "1px solid #86EFAC",
          }}
        >
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Availability & Channel Toggles */}
        <div style={sectionStyle}>
          <h2 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#2A0F3A" }}>
            1. Support Channels &amp; Modes
          </h2>

          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.chatEnabled}
                onChange={(e) => setSettings({ ...settings, chatEnabled: e.target.checked })}
              />
              <div>
                <b style={{ fontSize: 13, color: "#1E293B" }}>Enable Website Chat Widget</b>
                <span style={{ display: "block", fontSize: 11.5, color: "#64748B" }}>
                  Controls whether the floating chat trigger is visible on the storefront.
                </span>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.aiEnabled}
                onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })}
              />
              <div>
                <b style={{ fontSize: 13, color: "#1E293B" }}>Enable Dr. Queens AI Assistant</b>
                <span style={{ display: "block", fontSize: 11.5, color: "#64748B" }}>
                  Automatically answers clinical product details, shipping timelines, and FAQs.
                </span>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.humanHandoffEnabled}
                onChange={(e) => setSettings({ ...settings, humanHandoffEnabled: e.target.checked })}
              />
              <div>
                <b style={{ fontSize: 13, color: "#1E293B" }}>Enable Human Specialist Handoff</b>
                <span style={{ display: "block", fontSize: 11.5, color: "#64748B" }}>
                  Allows customers to request live agent takeover with 1 click.
                </span>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.isOnline}
                onChange={(e) => setSettings({ ...settings, isOnline: e.target.checked })}
              />
              <div>
                <b style={{ fontSize: 13, color: "#1E293B" }}>Live Support Status (Online Override)</b>
                <span style={{ display: "block", fontSize: 11.5, color: "#64748B" }}>
                  Shows the green live active dot and alerts patients that pharmacists are on duty.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Customer-Facing Copy */}
        <div style={sectionStyle}>
          <h2 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#2A0F3A" }}>
            2. Customer-Facing Messaging
          </h2>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Welcome Message</label>
              <textarea
                rows={2}
                value={settings.welcomeMessage}
                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Human Handoff Confirmation</label>
              <textarea
                rows={2}
                value={settings.humanHandoffMessage}
                onChange={(e) => setSettings({ ...settings, humanHandoffMessage: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Offline / After-Hours Notice</label>
              <textarea
                rows={2}
                value={settings.offlineMessage}
                onChange={(e) => setSettings({ ...settings, offlineMessage: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Resolution Closing Notice</label>
              <textarea
                rows={2}
                value={settings.resolutionMessage}
                onChange={(e) => setSettings({ ...settings, resolutionMessage: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* CSAT & Reopen Rules */}
        <div style={sectionStyle}>
          <h2 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#2A0F3A" }}>
            3. Experience &amp; Reopen Behavior
          </h2>

          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.reopenOnCustomerMessage}
                onChange={(e) => setSettings({ ...settings, reopenOnCustomerMessage: e.target.checked })}
              />
              <div>
                <b style={{ fontSize: 13, color: "#1E293B" }}>Auto-Reopen Resolved Chats on New Customer Reply</b>
                <span style={{ display: "block", fontSize: 11.5, color: "#64748B" }}>
                  If a customer sends a message after resolution, immediately moves conversation to Open.
                </span>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.csatEnabled}
                onChange={(e) => setSettings({ ...settings, csatEnabled: e.target.checked })}
              />
              <div>
                <b style={{ fontSize: 13, color: "#1E293B" }}>Enable Customer Experience Rating (CSAT)</b>
                <span style={{ display: "block", fontSize: 11.5, color: "#64748B" }}>
                  Prompts customers to rate their care experience after conversation resolution.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: "right" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 24px",
              borderRadius: 6,
              border: "none",
              background: "var(--purple, #2A0F3A)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 4px 12px rgba(42,15,58,0.2)",
            }}
          >
            {saving ? "Saving Changes…" : "Save Support Settings →"}
          </button>
        </div>
      </form>
    </div>
  );
}
