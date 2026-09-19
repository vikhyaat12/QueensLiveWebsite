"use client";

import React, { useState, useEffect } from "react";
import type { WhatsAppCommunicationConfig } from "@/app/api/admin/whatsapp/route";

export default function WhatsAppSettingsPanel() {
  const [config, setConfig] = useState<WhatsAppCommunicationConfig>({
    enabled: true,
    phoneNumber: "+91 98765 43210",
    displayLabel: "Chat with Clinical Desk",
    defaultMessage: "Hello Queens Care Laboratories, I would like to consult regarding formulations.",
    operatingHoursText: "Mon – Sat: 9:00 AM – 8:00 PM IST",
    position: "bottom-right",
    pulseAnimation: true,
    showTooltip: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/whatsapp")
      .then((r) => r.json())
      .then((d) => {
        if (d.config) setConfig(d.config);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: "success", text: "WhatsApp communication settings saved successfully." });
        if (data.config) setConfig(data.config);
      } else {
        setToast({ type: "error", text: data.error || "Failed to save settings." });
      }
    } catch {
      setToast({ type: "error", text: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
        Loading WhatsApp Communication Settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "10px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E1638", margin: "0 0 6px" }}>
            WhatsApp Communication Desk
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Configure live customer chat for formulation inquiries, order assistance, and direct pharmacist support.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: config.enabled ? "#DCFCE7" : "#F1F5F9",
              color: config.enabled ? "#166534" : "#64748B",
            }}
          >
            {config.enabled ? "● Live on Site" : "○ Disabled"}
          </span>
        </div>
      </div>

      {toast && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
            background: toast.type === "success" ? "#DCFCE7" : "#FEE2E2",
            color: toast.type === "success" ? "#166534" : "#991B1B",
            border: `1px solid ${toast.type === "success" ? "#BBF7D0" : "#FECACA"}`,
          }}
        >
          {toast.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: 24,
            display: "grid",
            gap: 20,
          }}
        >
          {/* Enabled Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: 16 }}>
            <div>
              <b style={{ fontSize: 14, color: "#1E1638", display: "block" }}>Enable Floating WhatsApp Button</b>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                Displays the 1-click WhatsApp support button across the website. If disabled, renders nothing.
              </span>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24 }}>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  cursor: "pointer",
                  inset: 0,
                  background: config.enabled ? "#22C55E" : "#CBD5E1",
                  borderRadius: 24,
                  transition: "0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    content: '""',
                    height: 18,
                    width: 18,
                    left: config.enabled ? 22 : 3,
                    bottom: 3,
                    background: "white",
                    borderRadius: "50%",
                    transition: "0.2s",
                  }}
                />
              </span>
            </label>
          </div>

          {/* WhatsApp Phone Number */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1E1638", display: "block", marginBottom: 6 }}>
              WhatsApp Business Phone Number (with Country Code)
            </label>
            <input
              type="text"
              required
              value={config.phoneNumber}
              onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
              placeholder="+91 98765 43210"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
            <span style={{ fontSize: 11.5, color: "#64748B", marginTop: 4, display: "block" }}>
              Include international country code (e.g. +91 for India).
            </span>
          </div>

          {/* Display Label */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1E1638", display: "block", marginBottom: 6 }}>
              Floating Button Label / Tooltip Title
            </label>
            <input
              type="text"
              value={config.displayLabel}
              onChange={(e) => setConfig({ ...config, displayLabel: e.target.value })}
              placeholder="Chat with Clinical Desk"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Default Message */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1E1638", display: "block", marginBottom: 6 }}>
              Default Pre-Filled Message
            </label>
            <textarea
              rows={2}
              value={config.defaultMessage}
              onChange={(e) => setConfig({ ...config, defaultMessage: e.target.value })}
              placeholder="Hello Queens Care Laboratories, I would like to consult regarding formulations."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 13,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: 11.5, color: "#64748B", marginTop: 4, display: "block" }}>
              When the user clicks the button, WhatsApp opens with this message already typed in their chat box.
            </span>
          </div>

          {/* Operating Hours */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1E1638", display: "block", marginBottom: 6 }}>
              Operating Hours &amp; Availability Notice
            </label>
            <input
              type="text"
              value={config.operatingHoursText}
              onChange={(e) => setConfig({ ...config, operatingHoursText: e.target.value })}
              placeholder="Mon – Sat: 9:00 AM – 8:00 PM IST"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Position & Animations */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1E1638", display: "block", marginBottom: 6 }}>
                Screen Position
              </label>
              <select
                value={config.position}
                onChange={(e) => setConfig({ ...config, position: e.target.value as "bottom-right" | "bottom-left" })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 14,
                  background: "white",
                  boxSizing: "border-box",
                }}
              >
                <option value="bottom-right">Bottom Right (Recommended)</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1E1638", display: "block", marginBottom: 6 }}>
                Visual Effects
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={config.pulseAnimation}
                    onChange={(e) => setConfig({ ...config, pulseAnimation: e.target.checked })}
                    style={{ accentColor: "#22C55E" }}
                  />
                  <span>Pulsing green live presence badge</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={config.showTooltip}
                    onChange={(e) => setConfig({ ...config, showTooltip: e.target.checked })}
                    style={{ accentColor: "#22C55E" }}
                  />
                  <span>Hover tooltip preview</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                background: "#1E1638",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(30, 22, 56, 0.2)",
              }}
            >
              {saving ? "Saving Changes..." : "Save WhatsApp Settings"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
