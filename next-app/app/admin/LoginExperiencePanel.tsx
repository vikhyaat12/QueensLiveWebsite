"use client";

import React, { useState, useEffect } from "react";
import MediaField from "./MediaField";

/* ═══════════════════════════════════════════════════════════════
   LoginExperiencePanel — Queens Care Admin → Settings
   Controls every visual knob of the cinematic doctor login scene
   (login-experience settings group). Persists via the existing
   admin settings API.
   ═══════════════════════════════════════════════════════════════ */

type FieldDef = {
  key: string;
  label: string;
  type: "toggle" | "text" | "number" | "select" | "media";
  options?: string[];
  hint?: string;
  mediaFolder?: string;
};

const FIELDS: FieldDef[] = [
  { key: "login_doctor_enabled", label: "Doctor visible", type: "toggle", hint: "Show the doctor character on the login experience." },
  { key: "login_doctor_asset", label: "Doctor image asset", type: "media", mediaFolder: "doctors", hint: "Optional. Replaces the built-in vector doctor with your own image (entrance becomes an elegant fade-in)." },
  { key: "login_doctor_size", label: "Doctor size", type: "select", options: ["sm", "md", "lg"] },
  { key: "login_doctor_position", label: "Doctor position", type: "select", options: ["left", "center", "right"] },
  { key: "login_entrance_enabled", label: "Entrance animation", type: "toggle", hint: "Full story: walk-in with the medical bag, placement, opening and welcome gesture." },
  { key: "login_walk_enabled", label: "Walking animation", type: "toggle", hint: "She walks into the scene (off = she fades in at her final spot)." },
  { key: "login_bag_animation_enabled", label: "Bag sequence", type: "toggle", hint: "Carry, place down and open the medical bag (off = bag waits pre-placed on the floor)." },
  { key: "login_reveal_enabled", label: "Login emerges from bag", type: "toggle", hint: "The signature interaction — the care-account card rises out of the opened bag." },
  { key: "login_animation_enabled", label: "Idle animation", type: "toggle", hint: "Breathing, blinking and gaze while the user signs in." },
  { key: "login_animation_speed", label: "Animation speed", type: "number", hint: "0.6 (slow) – 1.6 (brisk). Default 1." },
  { key: "login_animation_intensity", label: "Animation intensity", type: "number", hint: "0.6 (subtle) – 1.4 (expressive). Default 1." },
  { key: "login_bag_enabled", label: "Medical bag visible", type: "toggle" },
  { key: "login_bag_asset", label: "Medical bag asset", type: "media", mediaFolder: "general", hint: "Optional image override for the built-in branded bag." },
  { key: "login_coat_logo", label: "Coat logo asset", type: "media", mediaFolder: "logos", hint: "Optional chest-logo override on the doctor's coat (the approved artwork's printed logo shows by default)." },
  { key: "login_bag_logo", label: "Bag logo asset", type: "media", mediaFolder: "logos", hint: "Light logo variant applied to the dark medical bag." },
  { key: "login_bg_style", label: "Background style", type: "select", options: ["aurora", "plain"] },
  { key: "login_bg_image", label: "Background image", type: "media", mediaFolder: "banners", hint: "Optional image blended behind the doctor scene." },
  { key: "login_heading", label: "Login heading", type: "text" },
  { key: "login_subheading", label: "Login subheading", type: "text" },
  { key: "login_cta_label", label: "Sign-in CTA label", type: "text" },
  { key: "login_success_message", label: "Success message", type: "text", hint: "Shown with the doctor's welcome reaction after signing in." },
  { key: "login_trust_items", label: "Trust points (bullet separated)", type: "text", hint: "Genuine customer trust points displayed at bottom (e.g. Personalized Wellness • 256-Bit Encrypted • Verified Care Team)." },
];

const DEFAULTS: Record<string, string> = {
  login_doctor_enabled: "true",
  login_doctor_asset: "",
  login_doctor_size: "md",
  login_doctor_position: "left",
  login_entrance_enabled: "true",
  login_walk_enabled: "true",
  login_bag_animation_enabled: "true",
  login_reveal_enabled: "true",
  login_animation_enabled: "true",
  login_animation_speed: "1",
  login_animation_intensity: "1",
  login_bag_enabled: "true",
  login_bag_asset: "",
  login_coat_logo: "",
  login_bag_logo: "",
  login_bg_style: "aurora",
  login_bg_image: "",
  login_heading: "Welcome back",
  login_subheading: "Your health is our highest mission.",
  login_cta_label: "Sign in",
  login_success_message: "Welcome to your care account",
  login_trust_items: "Personalized Wellness • 256-Bit Encrypted • Verified Care Team",
};

export default function LoginExperiencePanel({ onSave }: { onSave?: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings?group=login-experience")
      .then((r) => r.json())
      .then((d) => {
        const settings = d.settings || [];
        setValues((prev) => {
          const next = { ...prev };
          for (const s of settings) {
            if (s.key in next) next[s.key] = s.value === null || s.value === undefined ? "" : String(s.value);
          }
          return next;
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setValue = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      for (const f of FIELDS) {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: f.key, value: values[f.key], group: "login-experience" }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Failed to save ${f.label}`);
        }
      }
      setFeedback({ msg: "Login experience updated.", type: "success" });
      onSave?.();
    } catch (e) {
      setFeedback({ msg: e instanceof Error ? e.message : "Could not save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid var(--line)", fontSize: 13, fontFamily: "inherit" };

  return (
    <div style={{ padding: 20, background: "var(--paper)", border: "1px solid var(--line)", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h3 style={{ font: "16px var(--font-display)", margin: 0 }}>Login Experience — Doctor Scene</h3>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{ padding: "8px 18px", background: "var(--purple)", color: "#fff", border: "none", cursor: saving || loading ? "wait" : "pointer", fontSize: 12 }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 18px" }}>
        Controls the cinematic doctor animation on the customer sign-in page (/account). Settings apply to new page loads.
      </p>
      {feedback && (
        <p style={{ padding: "9px 12px", fontSize: 12, marginBottom: 14, background: feedback.type === "success" ? "#e9f7e9" : "#fde8e8", color: feedback.type === "success" ? "#2e7d32" : "#b34141" }}>
          {feedback.msg}
        </p>
      )}
      {loading ? (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading current settings…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {FIELDS.map((f) => (
            <div key={f.key} style={{ display: "grid", gap: 5, alignContent: "start" }}>
              <label style={{ fontSize: 11.5, fontWeight: 600 }}>
                {f.label}
                {f.type === "toggle" && (
                  <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 400, color: values[f.key] === "true" ? "#2e7d32" : "var(--muted)" }}>
                    {values[f.key] === "true" ? "on" : "off"}
                  </span>
                )}
              </label>
              {f.type === "toggle" && (
                <button
                  type="button"
                  onClick={() => setValue(f.key, values[f.key] === "true" ? "false" : "true")}
                  aria-pressed={values[f.key] === "true"}
                  style={{
                    width: 46, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
                    background: values[f.key] === "true" ? "var(--purple)" : "#cfc8da", transition: "background 0.2s",
                  }}
                >
                  <span style={{ position: "absolute", top: 3, left: values[f.key] === "true" ? 25 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
                </button>
              )}
              {f.type === "text" && (
                <input value={values[f.key]} onChange={(e) => setValue(f.key, e.target.value)} style={inputStyle} />
              )}
              {f.type === "number" && (
                <input
                  type="number" step="0.05" min={f.key === "login_animation_intensity" ? "0.6" : "0.6"} max={f.key === "login_animation_intensity" ? "1.4" : "1.6"}
                  value={values[f.key]} onChange={(e) => setValue(f.key, e.target.value)} style={inputStyle}
                />
              )}
              {f.type === "select" && (
                <select value={values[f.key]} onChange={(e) => setValue(f.key, e.target.value)} style={inputStyle}>
                  {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {f.type === "media" && (
                <MediaField label="" value={values[f.key]} onChange={(v) => setValue(f.key, v)} folder={f.mediaFolder || "general"} compact />
              )}
              {f.hint && <p style={{ fontSize: 10.5, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>{f.hint}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
