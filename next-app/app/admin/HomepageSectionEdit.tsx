"use client";

import React, { useState, useEffect } from "react";
import GlobalMediaUploader from "../components/GlobalMediaUploader";
import Hero3DProductVisual from "../components/Hero3DProductVisual";

const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4, background: "#fff" };
const labelStyle = { fontSize: 11, fontWeight: 700 as const, display: "block" as const, marginBottom: 4, color: "#2A0F3A", textTransform: "uppercase" as const, letterSpacing: ".04em" };

type SectionType =
  | "hero"
  | "heroVisual"
  | "trust"
  | "collection"
  | "science"
  | "ritual"
  | "testimonial"
  | "newsletter"
  | "consult"
  | "affiliate"
  | "banner"
  | "custom"
  | "marquee"
  | "quiz";

const SECTION_TYPES: { value: SectionType; label: string; icon: string }[] = [
  { value: "hero", label: "Hero Banner", icon: "✨" },
  { value: "heroVisual", label: "LUMINE-C™ 3D Product", icon: "💎" },
  { value: "trust", label: "Trust Strip", icon: "✦" },
  { value: "collection", label: "Product Collection", icon: "🛍️" },
  { value: "science", label: "Our Science", icon: "🔬" },
  { value: "ritual", label: "Ritual Cards", icon: "🌿" },
  { value: "testimonial", label: "Testimonial Quote", icon: "💬" },
  { value: "newsletter", label: "Newsletter / Care Letter", icon: "✉️" },
  { value: "consult", label: "Consultation / Doctors", icon: "🩺" },
  { value: "affiliate", label: "Partnership / Affiliate", icon: "🤝" },
  { value: "banner", label: "Announcement Bar", icon: "📢" },
  { value: "custom", label: "Custom Section", icon: "📝" },
  { value: "marquee", label: "Marquee / Ticker", icon: "📢" },
  { value: "quiz", label: "Health Quiz & Consultation", icon: "📋" },
];

interface Props {
  item: Record<string, unknown>;
  onSave: () => void;
}

export default function HomepageSectionEdit({ item, onSave }: Props) {
  const [form, setForm] = useState(item);
  const [content, setContent] = useState<Record<string, unknown>>(() => {
    try {
      return typeof item.content === "string"
        ? JSON.parse(item.content as string)
        : (item.content as Record<string, unknown>) || {};
    } catch {
      return {};
    }
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setMsg("");
    setIsError(false);
    const method = form.isNew ? "POST" : "PATCH";
    const payload = { ...form, content, id: form.isNew ? undefined : form.id };
    try {
      const res = await fetch("/api/admin/homepage", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMsg("✅ Section saved and persisted successfully!");
        setTimeout(onSave, 500);
      } else {
        const d = await res.json();
        setMsg(d.error || "Save failed.");
        setIsError(true);
      }
    } catch {
      setMsg("Network error.");
      setIsError(true);
    }
    setSaving(false);
  };

  const updateContent = (key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Top Header Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Homepage CMS
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "#2A0F3A", margin: "2px 0 0" }}>
            {form.isNew ? "Create Homepage Section" : `Edit Section: ${String(form.title || form.type || "Section")}`}
          </h3>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "9px 16px",
              background: "#fff",
              color: "#2A0F3A",
              border: "1px solid var(--line)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>👁️ Preview Homepage</span>
            <span>↗</span>
          </a>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              padding: "9px 24px",
              background: "#2A0F3A",
              color: "#D4AF37",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".03em",
              boxShadow: "0 2px 8px rgba(42, 15, 58, 0.2)",
            }}
          >
            {saving ? "Saving…" : "💾 Save Section"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            background: isError ? "#fde8e8" : "#e9f7e9",
            color: isError ? "#b34141" : "#2e7d32",
            border: `1px solid ${isError ? "#f8b4b4" : "#c3e6cb"}`,
          }}
        >
          {msg}
        </div>
      )}

      {/* SECTION SETTINGS & VISIBILITY */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>
          Section Configuration & Layout
        </h4>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Section Display Title *</label>
              <input
                style={inputStyle}
                value={String(form.title || "")}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Hero Section, Our Science..."
              />
            </div>
            <div>
              <label style={labelStyle}>Section Type</label>
              <select
                style={inputStyle}
                value={String(form.type || "custom")}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {SECTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sort Order</label>
              <input
                type="number"
                style={inputStyle}
                value={Number(form.sort ?? 0)}
                onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, fontSize: 13, alignItems: "center", paddingTop: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={form.active !== false}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              <span>Active (Enabled in System)</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={form.visible !== false}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
              />
              <span>Visible on Public Homepage</span>
            </label>
          </div>
        </div>
      </div>

      {/* UNIVERSAL STYLING & APPEARANCE */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>
          Section Design, Colors & Motion
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Section Background Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="color"
                value={String(content.backgroundColor || "#FAF8F5").startsWith("#") ? String(content.backgroundColor) : "#FAF8F5"}
                onChange={(e) => updateContent("backgroundColor", e.target.value)}
                style={{ width: 38, height: 38, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
              />
              <input
                style={inputStyle}
                value={String(content.backgroundColor || "")}
                onChange={(e) => updateContent("backgroundColor", e.target.value)}
                placeholder="e.g. #FAF8F5, #180524, transparent"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Text / Copy Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="color"
                value={String(content.textColor || "#180524").startsWith("#") ? String(content.textColor) : "#180524"}
                onChange={(e) => updateContent("textColor", e.target.value)}
                style={{ width: 38, height: 38, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
              />
              <input
                style={inputStyle}
                value={String(content.textColor || "")}
                onChange={(e) => updateContent("textColor", e.target.value)}
                placeholder="e.g. #180524, #FFFFFF"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Heading Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="color"
                value={String(content.headingColor || "#2A0F3A").startsWith("#") ? String(content.headingColor) : "#2A0F3A"}
                onChange={(e) => updateContent("headingColor", e.target.value)}
                style={{ width: 38, height: 38, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
              />
              <input
                style={inputStyle}
                value={String(content.headingColor || "")}
                onChange={(e) => updateContent("headingColor", e.target.value)}
                placeholder="e.g. #2A0F3A, #D4AF37"
              />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Button Background Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="color"
                value={String(content.buttonBg || "#2A0F3A").startsWith("#") ? String(content.buttonBg) : "#2A0F3A"}
                onChange={(e) => updateContent("buttonBg", e.target.value)}
                style={{ width: 38, height: 38, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
              />
              <input
                style={inputStyle}
                value={String(content.buttonBg || "")}
                onChange={(e) => updateContent("buttonBg", e.target.value)}
                placeholder="e.g. #2A0F3A"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Button Text Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="color"
                value={String(content.buttonColor || "#FFFFFF").startsWith("#") ? String(content.buttonColor) : "#FFFFFF"}
                onChange={(e) => updateContent("buttonColor", e.target.value)}
                style={{ width: 38, height: 38, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
              />
              <input
                style={inputStyle}
                value={String(content.buttonColor || "")}
                onChange={(e) => updateContent("buttonColor", e.target.value)}
                placeholder="e.g. #FFFFFF"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Section Padding / Spacing</label>
            <select
              style={inputStyle}
              value={String(content.padding || "default")}
              onChange={(e) => updateContent("padding", e.target.value)}
            >
              <option value="default">Default Spacing</option>
              <option value="40px 0">Compact (40px)</option>
              <option value="72px 0">Standard (72px)</option>
              <option value="100px 0">Generous (100px)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, fontSize: 13, alignItems: "center", marginTop: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={content.animationEnabled !== false}
              onChange={(e) => updateContent("animationEnabled", e.target.checked)}
            />
            <span>Enable Subtle Motion / Scroll Reveal</span>
          </label>
        </div>
      </div>

      {/* TYPOGRAPHY CONTROLS */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>
          Typography & Layout
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Heading Font Size</label>
            <input
              style={inputStyle}
              value={String(content.headingFontSize || "")}
              onChange={(e) => updateContent("headingFontSize", e.target.value)}
              placeholder="e.g. 42px, clamp(28px, 4vw, 42px)"
            />
          </div>
          <div>
            <label style={labelStyle}>Heading Font Weight</label>
            <select
              style={inputStyle}
              value={String(content.headingFontWeight || "")}
              onChange={(e) => updateContent("headingFontWeight", e.target.value)}
            >
              <option value="">Default</option>
              <option value="300">Light (300)</option>
              <option value="400">Regular (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semi-Bold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">Extra-Bold (800)</option>
              <option value="900">Black (900)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Heading Letter Spacing</label>
            <input
              style={inputStyle}
              value={String(content.headingLetterSpacing || "")}
              onChange={(e) => updateContent("headingLetterSpacing", e.target.value)}
              placeholder="e.g. -0.02em, 0.04em"
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Body Font Size</label>
            <input
              style={inputStyle}
              value={String(content.bodyFontSize || "")}
              onChange={(e) => updateContent("bodyFontSize", e.target.value)}
              placeholder="e.g. 16px, 1rem"
            />
          </div>
          <div>
            <label style={labelStyle}>Body Line Height</label>
            <input
              style={inputStyle}
              value={String(content.bodyLineHeight || "")}
              onChange={(e) => updateContent("bodyLineHeight", e.target.value)}
              placeholder="e.g. 1.6, 1.8, 24px"
            />
          </div>
          <div>
            <label style={labelStyle}>Text Alignment</label>
            <select
              style={inputStyle}
              value={String(content.textAlign || "")}
              onChange={(e) => updateContent("textAlign", e.target.value)}
            >
              <option value="">Default</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Section Max Width</label>
            <input
              style={inputStyle}
              value={String(content.maxWidth || "")}
              onChange={(e) => updateContent("maxWidth", e.target.value)}
              placeholder="e.g. 1200px, 80%"
            />
          </div>
          <div>
            <label style={labelStyle}>Button Border Radius</label>
            <input
              style={inputStyle}
              value={String(content.buttonRadius || "")}
              onChange={(e) => updateContent("buttonRadius", e.target.value)}
              placeholder="e.g. 4px, 24px, 50px"
            />
          </div>
          <div>
            <label style={labelStyle}>Section Border Radius</label>
            <input
              style={inputStyle}
              value={String(content.sectionRadius || "")}
              onChange={(e) => updateContent("sectionRadius", e.target.value)}
              placeholder="e.g. 8px, 16px"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LUMINE-C™ 3D PRODUCT CMS + LIVE PREVIEW */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "heroVisual" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase" }}>
                3D Interactive Studio
              </span>
              <h4 style={{ font: "16px var(--font-display)", margin: 0, color: "#2A0F3A" }}>
                LUMINE-C™ 3D Product Parameters & Live Preview
              </h4>
            </div>
            <button
              type="button"
              onClick={() => updateContent("enabled", content.enabled === false ? true : false)}
              style={{
                padding: "6px 16px",
                border: "none",
                borderRadius: 20,
                background: content.enabled !== false ? "#2e7d32" : "#757575",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {content.enabled !== false ? "● 3D VISUAL ACTIVE" : "○ 3D VISUAL DISABLED"}
            </button>
          </div>

          {/* Interactive Live Preview Card */}
          <div style={{ marginBottom: 20, border: "1px solid var(--line)", borderRadius: 6, padding: 14, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2A0F3A", textTransform: "uppercase" }}>
                ✦ Live Admin 3D Interactive Canvas Preview
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Drag in preview to test 360° orbital rotation
              </span>
            </div>
            <Hero3DProductVisual
              productName={String(content.productName || "LUMINE-C™")}
              subtitle={String(content.subtitle || "Radiance serum")}
              verticalLabel={String(content.verticalLabel || "FORMULATED WITH INTENTION")}
              scale={Number(content.scale || 1.0)}
              autoRotate={content.autoRotate !== false}
              rotationSpeed={Number(content.rotationSpeed || 1.0)}
              mouseInteraction={content.mouseInteraction !== false}
              lightingIntensity={Number(content.lightingIntensity || 1.5)}
              accentColor={String(content.accentColor || "#D4AF37")}
              bgEffect={(content.bgEffect as "studio" | "purple" | "transparent") || "studio"}
              customImageUrl={String(content.customImageUrl || "")}
              height={380}
            />
          </div>

          {/* 3D Parameters Grid */}
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Product Display Name</label>
                <input
                  style={inputStyle}
                  value={String(content.productName || "")}
                  onChange={(e) => updateContent("productName", e.target.value)}
                  placeholder="LUMINE-C™"
                />
              </div>
              <div>
                <label style={labelStyle}>Formula Subtitle</label>
                <input
                  style={inputStyle}
                  value={String(content.subtitle || "")}
                  onChange={(e) => updateContent("subtitle", e.target.value)}
                  placeholder="Radiance serum"
                />
              </div>
              <div>
                <label style={labelStyle}>Vertical Philosophy Label</label>
                <input
                  style={inputStyle}
                  value={String(content.verticalLabel || "")}
                  onChange={(e) => updateContent("verticalLabel", e.target.value)}
                  placeholder="FORMULATED WITH INTENTION"
                />
              </div>
            </div>

            {/* Sliders for 3D Presentation */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, background: "#fff", padding: 14, border: "1px solid var(--line)", borderRadius: 4 }}>
              <div>
                <label style={labelStyle}>
                  3D Scale: {Number(content.scale || 1.0).toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  style={{ width: "100%" }}
                  value={Number(content.scale || 1.0)}
                  onChange={(e) => updateContent("scale", parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Rotation Speed: {Number(content.rotationSpeed || 1.0).toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.2"
                  style={{ width: "100%" }}
                  value={Number(content.rotationSpeed || 1.0)}
                  onChange={(e) => updateContent("rotationSpeed", parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Lighting Intensity: {Number(content.lightingIntensity || 1.5).toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  style={{ width: "100%" }}
                  value={Number(content.lightingIntensity || 1.5)}
                  onChange={(e) => updateContent("lightingIntensity", parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Accent Metallic Gold Ring</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={String(content.accentColor || "#D4AF37")}
                    onChange={(e) => updateContent("accentColor", e.target.value)}
                    style={{ width: 44, height: 38, padding: 0, border: "1px solid var(--line)", cursor: "pointer", borderRadius: 4 }}
                  />
                  <input
                    style={inputStyle}
                    value={String(content.accentColor || "#D4AF37")}
                    onChange={(e) => updateContent("accentColor", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Ambient Background Effect</label>
                <select
                  style={inputStyle}
                  value={String(content.bgEffect || "studio")}
                  onChange={(e) => updateContent("bgEffect", e.target.value)}
                >
                  <option value="studio">✨ Studio Radial Glow</option>
                  <option value="purple">🔮 Luxury Deep Purple</option>
                  <option value="transparent">🌫️ Transparent</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Interaction Controls</label>
                <div style={{ display: "flex", gap: 12, paddingTop: 6 }}>
                  <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={content.autoRotate !== false}
                      onChange={(e) => updateContent("autoRotate", e.target.checked)}
                    />
                    Auto-Rotate
                  </label>
                  <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={content.mouseInteraction !== false}
                      onChange={(e) => updateContent("mouseInteraction", e.target.checked)}
                    />
                    Mouse Orbit
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>3D Model URL (GLB / GLTF)</label>
              <input
                style={inputStyle}
                value={String(content.customModelUrl || "")}
                onChange={(e) => updateContent("customModelUrl", e.target.value)}
                placeholder="/models/product.glb or https://..."
              />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Optional: paste a GLB or GLTF model URL. If set, loads this 3D model instead of the procedural bottle. Falls back to the 2D image below if the model fails to load.
              </div>
            </div>

            <div>
              <GlobalMediaUploader
                label="Fallback Product Photo / 2D Asset"
                preset="product_image"
                value={String(content.customImageUrl || "")}
                onChange={(url) => updateContent("customImageUrl", url)}
                folder="homepage"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO BANNER SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "hero" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Hero Background Image</h4>
          <GlobalMediaUploader
            label="Hero Image (optional — if set, replaces the 3D product visual)"
            preset="banner_desktop"
            value={String(content.heroImage || "")}
            onChange={(url) => updateContent("heroImage", url)}
            folder="homepage"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Or Paste Image URL</label>
              <input
                style={inputStyle}
                value={String(content.heroImage || "")}
                onChange={(e) => updateContent("heroImage", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label style={labelStyle}>Hero Background Color</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="color"
                  value={String(content.heroBackground || "#FAF8F5").startsWith("#") ? String(content.heroBackground) : "#FAF8F5"}
                  onChange={(e) => updateContent("heroBackground", e.target.value)}
                  style={{ width: 38, height: 38, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
                />
                <input
                  style={inputStyle}
                  value={String(content.heroBackground || "")}
                  onChange={(e) => updateContent("heroBackground", e.target.value)}
                  placeholder="#FAF8F5"
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, padding: 10, background: content.heroImage ? "#e9f7e9" : "#fff7e6", border: "1px solid " + (content.heroImage ? "#c3e6cb" : "#f5d6a0"), borderRadius: 4, fontSize: 12, color: content.heroImage ? "#2e7d32" : "#92400e" }}>
            {content.heroImage ? "Image set — will display instead of 3D product visual. Clear the field to restore 3D visual." : "No hero image set — the 3D product visual (LUMINE-C) is shown by default."}
          </div>
          <h4 style={{ font: "14px var(--font-display)", marginTop: 20, marginBottom: 14, color: "var(--purple)" }}>Hero Copy & Calls to Action</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Eyebrow Subheading</label>
              <input
                style={inputStyle}
                value={String(content.eyebrow || "")}
                onChange={(e) => updateContent("eyebrow", e.target.value)}
                placeholder="A higher standard of everyday care"
              />
            </div>
            <div>
              <label style={labelStyle}>Display Heading (HTML supported, e.g. &lt;em&gt;personal.&lt;/em&gt;)</label>
              <input
                style={inputStyle}
                value={String(content.heading || "")}
                onChange={(e) => updateContent("heading", e.target.value)}
                placeholder="Science, made <em>personal.</em>"
              />
            </div>
            <div>
              <label style={labelStyle}>Hero Lead Paragraph</label>
              <textarea
                style={{ ...inputStyle, minHeight: 70 }}
                value={String(content.subtitle || "")}
                onChange={(e) => updateContent("subtitle", e.target.value)}
                placeholder="Intelligent formulations that turn your daily health rituals into small, powerful acts of self-respect."
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Primary Button Label</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaText || "")}
                  onChange={(e) => updateContent("ctaText", e.target.value)}
                  placeholder="Explore the collection"
                />
              </div>
              <div>
                <label style={labelStyle}>Primary Button Link</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaLink || "")}
                  onChange={(e) => updateContent("ctaLink", e.target.value)}
                  placeholder="/#collection"
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Secondary Link Label</label>
                <input
                  style={inputStyle}
                  value={String(content.secondaryText || "")}
                  onChange={(e) => updateContent("secondaryText", e.target.value)}
                  placeholder="How we formulate"
                />
              </div>
              <div>
                <label style={labelStyle}>Secondary Link Destination</label>
                <input
                  style={inputStyle}
                  value={String(content.secondaryLink || "")}
                  onChange={(e) => updateContent("secondaryLink", e.target.value)}
                  placeholder="/#science"
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Rating Label</label>
                <input
                  style={inputStyle}
                  value={String(content.rating || "")}
                  onChange={(e) => updateContent("rating", e.target.value)}
                  placeholder="4.9 / 5"
                />
              </div>
              <div>
                <label style={labelStyle}>Rating Count / Proof</label>
                <input
                  style={inputStyle}
                  value={String(content.ratingCount || "")}
                  onChange={(e) => updateContent("ratingCount", e.target.value)}
                  placeholder="12,000+ care rituals"
                />
              </div>
            </div>

            {/* ─── FEMALE HEALTHCARE BRAND SPECIALIST (HERO CHARACTER) ─── */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase" }}>
                    Interactive Brand Character
                  </span>
                  <h5 style={{ font: "15px var(--font-display)", margin: 0, color: "var(--purple)" }}>
                    Female Healthcare Specialist (Hero Character)
                  </h5>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={content.characterEnabled !== false}
                    onChange={(e) => updateContent("characterEnabled", e.target.checked)}
                  />
                  <span>Enable Specialist Character</span>
                </label>
              </div>

              {content.characterEnabled !== false && (
                <div style={{ display: "grid", gap: 12, background: "#fff", padding: 14, border: "1px solid var(--line)", borderRadius: 6 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Composition / Display Mode</label>
                      <select
                        style={inputStyle}
                        value={String(content.characterPosition || "split")}
                        onChange={(e) => updateContent("characterPosition", e.target.value)}
                      >
                        <option value="split">Side-by-Side (Doctor + 3D Product)</option>
                        <option value="character_only">Doctor Focused Only</option>
                        <option value="product_only">3D Product Only</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Character Size</label>
                      <select
                        style={inputStyle}
                        value={String(content.characterSize || "md")}
                        onChange={(e) => updateContent("characterSize", e.target.value)}
                      >
                        <option value="sm">Small (220px)</option>
                        <option value="md">Medium (280px)</option>
                        <option value="lg">Large (340px)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Animation Style</label>
                      <select
                        style={inputStyle}
                        value={String(content.characterAnimation || "gentle_breathing")}
                        onChange={(e) => updateContent("characterAnimation", e.target.value)}
                      >
                        <option value="gentle_breathing">Natural Breathing Motion</option>
                        <option value="consultation">Consultation Presence</option>
                        <option value="minimal">Subtle Micro-Motion</option>
                        <option value="none">Static Silhouette</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Doctor Greeting / Name</label>
                      <input
                        style={inputStyle}
                        value={String(content.characterGreeting || "")}
                        onChange={(e) => updateContent("characterGreeting", e.target.value)}
                        placeholder="Hello, I'm Dr. Queens"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Specialist Badge Text</label>
                      <input
                        style={inputStyle}
                        value={String(content.characterBadge || "")}
                        onChange={(e) => updateContent("characterBadge", e.target.value)}
                        placeholder="Clinical Specialist"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Interactive Speech Bubble Message</label>
                    <input
                      style={inputStyle}
                      value={String(content.characterSubtext || "")}
                      onChange={(e) => updateContent("characterSubtext", e.target.value)}
                      placeholder="Let me guide your personalized formulation ritual"
                    />
                  </div>

                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={content.characterBubble !== false}
                        onChange={(e) => updateContent("characterBubble", e.target.checked)}
                      />
                      <span>Show Interactive Consultation Speech Bubble</span>
                    </label>
                  </div>

                  <div>
                    <GlobalMediaUploader
                      label="Custom Specialist Portrait / Avatar (Optional — SVG rendered if empty)"
                      preset="employee_photo"
                      value={String(content.characterImageUrl || "")}
                      onChange={(url) => updateContent("characterImageUrl", url)}
                      folder="characters"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TRUST STRIP SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "trust" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ font: "14px var(--font-display)", margin: 0, color: "var(--purple)" }}>Trust Badges ({((content.badges as string[]) || []).length} items)</h4>
            <button type="button" onClick={() => {
              const b = [...((content.badges as string[]) || []), "New trust point"];
              updateContent("badges", b);
            }} style={{ padding: "6px 14px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>+ Add Trust Point</button>
          </div>
          {((content.badges as string[]) || []).map((badge: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", minWidth: 20 }}>{i + 1}.</span>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={badge}
                onChange={(e) => {
                  const b = [...(content.badges as string[] || [])];
                  b[i] = e.target.value;
                  updateContent("badges", b);
                }}
              />
              <button type="button" title="Move up" disabled={i === 0} onClick={() => {
                const b = [...(content.badges as string[])];
                [b[i - 1], b[i]] = [b[i], b[i - 1]];
                updateContent("badges", b);
              }} style={{ padding: "2px 6px", fontSize: 10, cursor: i === 0 ? "default" : "pointer", border: "1px solid var(--line)", background: "#fff", borderRadius: 2 }}>▲</button>
              <button type="button" title="Move down" disabled={i >= ((content.badges as string[]) || []).length - 1} onClick={() => {
                const b = [...(content.badges as string[])];
                [b[i + 1], b[i]] = [b[i], b[i + 1]];
                updateContent("badges", b);
              }} style={{ padding: "2px 6px", fontSize: 10, cursor: i >= ((content.badges as string[]) || []).length - 1 ? "default" : "pointer", border: "1px solid var(--line)", background: "#fff", borderRadius: 2 }}>▼</button>
              <button type="button" title="Delete" onClick={() => {
                const b = (content.badges as string[]).filter((_, idx) => idx !== i);
                updateContent("badges", b);
              }} style={{ padding: "2px 6px", fontSize: 10, cursor: "pointer", border: "1px solid #ffcdd2", background: "#ffebee", color: "#c62828", borderRadius: 2 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PRODUCT COLLECTION SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "collection" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Product Collection Section</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Eyebrow</label>
              <input
                style={inputStyle}
                value={String(content.eyebrow || "")}
                onChange={(e) => updateContent("eyebrow", e.target.value)}
                placeholder="The care edit"
              />
            </div>
            <div>
              <label style={labelStyle}>Heading (supports &lt;em&gt;)</label>
              <input
                style={inputStyle}
                value={String(content.heading || "")}
                onChange={(e) => updateContent("heading", e.target.value)}
                placeholder="Considered essentials for your whole self."
              />
            </div>
            <div>
              <label style={labelStyle}>CTA Button Label</label>
              <input
                style={inputStyle}
                value={String(content.ctaText || "")}
                onChange={(e) => updateContent("ctaText", e.target.value)}
                placeholder="Shop all care"
              />
            </div>
          </div>
          <CollectionProductPicker content={content} updateContent={updateContent} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCIENCE SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "science" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Our Science Section</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <GlobalMediaUploader
              label="Science Background / Editorial Image"
              preset="banner_desktop"
              value={String(content.imageUrl || "")}
              onChange={(url) => updateContent("imageUrl", url)}
              folder="homepage"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Highlight Stat (e.g. 97%)</label>
                <input
                  style={inputStyle}
                  value={String(content.stat || "")}
                  onChange={(e) => updateContent("stat", e.target.value)}
                  placeholder="97"
                />
              </div>
              <div>
                <label style={labelStyle}>Stat Context / Label</label>
                <input
                  style={inputStyle}
                  value={String(content.statText || "")}
                  onChange={(e) => updateContent("statText", e.target.value)}
                  placeholder="of customers feel a difference within 30 days*"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Eyebrow</label>
              <input
                style={inputStyle}
                value={String(content.eyebrow || "")}
                onChange={(e) => updateContent("eyebrow", e.target.value)}
                placeholder="The Queens Care standard"
              />
            </div>
            <div>
              <label style={labelStyle}>Heading (supports &lt;em&gt;)</label>
              <input
                style={inputStyle}
                value={String(content.heading || "")}
                onChange={(e) => updateContent("heading", e.target.value)}
                placeholder="Precision you can feel. <em>Proof you can see.</em>"
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80 }}
                value={String(content.description || "")}
                onChange={(e) => updateContent("description", e.target.value)}
              />
            </div>

            {/* PRINCIPLES MANAGER */}
            <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ ...labelStyle, margin: 0, fontWeight: 700 }}>
                  Scientific Principles ({(Array.isArray(content.principles) ? content.principles : []).length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const curr = Array.isArray(content.principles) ? [...content.principles] : [];
                    curr.push({
                      number: String(curr.length + 1).padStart(2, "0"),
                      title: "New Principle",
                      text: "Principle description."
                    });
                    updateContent("principles", curr);
                  }}
                  style={{ padding: "3px 8px", fontSize: 11, background: "var(--purple)", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}
                >
                  + Add Principle
                </button>
              </div>
              {(Array.isArray(content.principles) ? content.principles : []).map((p: Record<string, string>, pIdx: number) => (
                <div key={pIdx} style={{ display: "grid", gridTemplateColumns: "60px 180px 1fr 30px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input
                    style={inputStyle}
                    value={p.number || ""}
                    onChange={(e) => {
                      const curr = [...(content.principles as Record<string, string>[])];
                      curr[pIdx] = { ...curr[pIdx], number: e.target.value };
                      updateContent("principles", curr);
                    }}
                    placeholder="01"
                  />
                  <input
                    style={inputStyle}
                    value={p.title || ""}
                    onChange={(e) => {
                      const curr = [...(content.principles as Record<string, string>[])];
                      curr[pIdx] = { ...curr[pIdx], title: e.target.value };
                      updateContent("principles", curr);
                    }}
                    placeholder="Title"
                  />
                  <input
                    style={inputStyle}
                    value={p.text || ""}
                    onChange={(e) => {
                      const curr = [...(content.principles as Record<string, string>[])];
                      curr[pIdx] = { ...curr[pIdx], text: e.target.value };
                      updateContent("principles", curr);
                    }}
                    placeholder="Description"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const curr = (content.principles as Record<string, string>[]).filter((_, i) => i !== pIdx);
                      updateContent("principles", curr);
                    }}
                    style={{ padding: "4px 6px", fontSize: 10, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>CTA Button Label</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaText || "")}
                  onChange={(e) => updateContent("ctaText", e.target.value)}
                  placeholder="Meet our standard"
                />
              </div>
              <div>
                <label style={labelStyle}>CTA Destination Link</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaLink || "")}
                  onChange={(e) => updateContent("ctaLink", e.target.value)}
                  placeholder="/about"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* RITUAL CARDS SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "ritual" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Ritual & Category Cards</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Eyebrow</label>
              <input
                style={inputStyle}
                value={String(content.eyebrow || "")}
                onChange={(e) => updateContent("eyebrow", e.target.value)}
                placeholder="Build your ritual"
              />
            </div>
            <div>
              <label style={labelStyle}>Heading (supports &lt;em&gt;)</label>
              <input
                style={inputStyle}
                value={String(content.heading || "")}
                onChange={(e) => updateContent("heading", e.target.value)}
                placeholder="Care that meets you where you are."
              />
            </div>
            <div>
              <label style={labelStyle}>Side Explanatory Copy</label>
              <textarea
                style={{ ...inputStyle, minHeight: 60 }}
                value={String(content.sideText || "")}
                onChange={(e) => updateContent("sideText", e.target.value)}
              />
            </div>

            {/* DYNAMIC RITUAL CARDS MANAGER */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ ...labelStyle, margin: 0, fontWeight: 700 }}>
                  Ritual Cards ({(Array.isArray(content.cards) ? content.cards : []).length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentCards = Array.isArray(content.cards) ? [...content.cards] : [];
                    const nextNum = String(currentCards.length + 1).padStart(2, "0");
                    currentCards.push({
                      id: `card-${Date.now()}`,
                      number: nextNum,
                      heading: "New Ritual Goal",
                      cta: "Discover care →",
                      link: "#collection",
                      color: "amber",
                      bgColor: "",
                      textColor: ""
                    });
                    updateContent("cards", currentCards);
                  }}
                  style={{ padding: "4px 10px", fontSize: 11, background: "var(--purple)", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}
                >
                  + Add Ritual Card
                </button>
              </div>

              {(Array.isArray(content.cards) ? content.cards : []).map((card: Record<string, string>, cIdx: number) => (
                <div key={card.id || cIdx} style={{ padding: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 4, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)" }}>
                      Card {card.number || `0${cIdx + 1}`}
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        disabled={cIdx === 0}
                        onClick={() => {
                          const currentCards = [...(content.cards as Record<string, string>[])];
                          const temp = currentCards[cIdx];
                          currentCards[cIdx] = currentCards[cIdx - 1];
                          currentCards[cIdx - 1] = temp;
                          updateContent("cards", currentCards);
                        }}
                        style={{ padding: "2px 6px", fontSize: 10, cursor: cIdx === 0 ? "default" : "pointer" }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={cIdx >= (content.cards as Record<string, string>[]).length - 1}
                        onClick={() => {
                          const currentCards = [...(content.cards as Record<string, string>[])];
                          const temp = currentCards[cIdx];
                          currentCards[cIdx] = currentCards[cIdx + 1];
                          currentCards[cIdx + 1] = temp;
                          updateContent("cards", currentCards);
                        }}
                        style={{ padding: "2px 6px", fontSize: 10, cursor: cIdx >= (content.cards as Record<string, string>[]).length - 1 ? "default" : "pointer" }}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentCards = (content.cards as Record<string, string>[]).filter((_, i) => i !== cIdx);
                          updateContent("cards", currentCards);
                        }}
                        style={{ padding: "2px 6px", fontSize: 10, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--muted)" }}>Number</label>
                      <input
                        style={inputStyle}
                        value={card.number || ""}
                        onChange={(e) => {
                          const currentCards = [...(content.cards as Record<string, string>[])];
                          currentCards[cIdx] = { ...currentCards[cIdx], number: e.target.value };
                          updateContent("cards", currentCards);
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--muted)" }}>Heading (HTML tags allowed)</label>
                      <input
                        style={inputStyle}
                        value={card.heading || ""}
                        onChange={(e) => {
                          const currentCards = [...(content.cards as Record<string, string>[])];
                          currentCards[cIdx] = { ...currentCards[cIdx], heading: e.target.value };
                          updateContent("cards", currentCards);
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--muted)" }}>CTA Label</label>
                      <input
                        style={inputStyle}
                        value={card.cta || ""}
                        onChange={(e) => {
                          const currentCards = [...(content.cards as Record<string, string>[])];
                          currentCards[cIdx] = { ...currentCards[cIdx], cta: e.target.value };
                          updateContent("cards", currentCards);
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--muted)" }}>Target Link</label>
                      <input
                        style={inputStyle}
                        value={card.link || ""}
                        onChange={(e) => {
                          const currentCards = [...(content.cards as Record<string, string>[])];
                          currentCards[cIdx] = { ...currentCards[cIdx], link: e.target.value };
                          updateContent("cards", currentCards);
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "var(--muted)" }}>Color Accent</label>
                      <select
                        style={inputStyle}
                        value={card.color || "amber"}
                        onChange={(e) => {
                          const currentCards = [...(content.cards as Record<string, string>[])];
                          currentCards[cIdx] = { ...currentCards[cIdx], color: e.target.value };
                          updateContent("cards", currentCards);
                        }}
                      >
                        <option value="amber">Amber Gold</option>
                        <option value="lavender">Lavender</option>
                        <option value="rose">Rose Quartz</option>
                        <option value="teal">Clinical Teal</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TESTIMONIAL SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "testimonial" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Testimonial Quote</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Testimonial Quote</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80 }}
                value={String(content.quote || "")}
                onChange={(e) => updateContent("quote", e.target.value)}
                placeholder="For the first time, my wellness routine feels less like a chore..."
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Author Name</label>
                <input
                  style={inputStyle}
                  value={String(content.author || "")}
                  onChange={(e) => updateContent("author", e.target.value)}
                  placeholder="Dr. Priya Sharma"
                />
              </div>
              <div>
                <label style={labelStyle}>Designation / Attribution</label>
                <input
                  style={inputStyle}
                  value={String(content.attribution || "")}
                  onChange={(e) => updateContent("attribution", e.target.value)}
                  placeholder="Dermatologist, Mumbai"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CONSULTATION / DOCTORS SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "consult" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Consultation & Healthcare Portal Section</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <GlobalMediaUploader
              label="Consultation Photo / Doctor Image"
              preset="employee_photo"
              value={String(content.imageUrl || "")}
              onChange={(url) => updateContent("imageUrl", url)}
              folder="homepage"
            />
            <div>
              <label style={labelStyle}>Eyebrow</label>
              <input
                style={inputStyle}
                value={String(content.eyebrow || "")}
                onChange={(e) => updateContent("eyebrow", e.target.value)}
                placeholder="Care, with a human on the other end"
              />
            </div>
            <div>
              <label style={labelStyle}>Heading (supports &lt;em&gt;)</label>
              <input
                style={inputStyle}
                value={String(content.heading || "")}
                onChange={(e) => updateContent("heading", e.target.value)}
                placeholder="Questions deserve thoughtful answers."
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 70 }}
                value={String(content.description || "")}
                onChange={(e) => updateContent("description", e.target.value)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Primary CTA Text</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaText || "")}
                  onChange={(e) => updateContent("ctaText", e.target.value)}
                  placeholder="Talk to our care team"
                />
              </div>
              <div>
                <label style={labelStyle}>Primary CTA Link</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaLink || "")}
                  onChange={(e) => updateContent("ctaLink", e.target.value)}
                  placeholder="/contact"
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Secondary CTA Text</label>
                <input
                  style={inputStyle}
                  value={String(content.secondaryCtaText || "")}
                  onChange={(e) => updateContent("secondaryCtaText", e.target.value)}
                  placeholder="For healthcare professionals"
                />
              </div>
              <div>
                <label style={labelStyle}>Secondary CTA Link</label>
                <input
                  style={inputStyle}
                  value={String(content.secondaryCtaLink || "")}
                  onChange={(e) => updateContent("secondaryCtaLink", e.target.value)}
                  placeholder="/doctors"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PARTNERSHIP / AFFILIATE SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "affiliate" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Partnership / Affiliate Section</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <GlobalMediaUploader
              label="Partnership Banner / Editorial Image"
              preset="banner_desktop"
              value={String(content.imageUrl || "")}
              onChange={(url) => updateContent("imageUrl", url)}
              folder="homepage"
            />
            <div>
              <label style={labelStyle}>Eyebrow</label>
              <input
                style={inputStyle}
                value={String(content.eyebrow || "")}
                onChange={(e) => updateContent("eyebrow", e.target.value)}
                placeholder="PARTNERSHIP PROGRAMME"
              />
            </div>
            <div>
              <label style={labelStyle}>Heading</label>
              <input
                style={inputStyle}
                value={String(content.heading || "")}
                onChange={(e) => updateContent("heading", e.target.value)}
                placeholder="Partner with Queens Care Laboratories"
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 70 }}
                value={String(content.description || "")}
                onChange={(e) => updateContent("description", e.target.value)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Button Label</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaText || "")}
                  onChange={(e) => updateContent("ctaText", e.target.value)}
                  placeholder="BECOME AN AFFILIATE"
                />
              </div>
              <div>
                <label style={labelStyle}>Button Link</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaLink || "")}
                  onChange={(e) => updateContent("ctaLink", e.target.value)}
                  placeholder="/affiliate"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ANNOUNCEMENT BANNER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "banner" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Announcement Bar</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Announcement Text</label>
              <input
                style={inputStyle}
                value={String(content.text || "")}
                onChange={(e) => updateContent("text", e.target.value)}
                placeholder="Complimentary delivery on orders above ₹1,500"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Secondary Link Label</label>
                <input
                  style={inputStyle}
                  value={String(content.secondaryText || "")}
                  onChange={(e) => updateContent("secondaryText", e.target.value)}
                  placeholder="For healthcare professionals"
                />
              </div>
              <div>
                <label style={labelStyle}>Secondary Link Destination</label>
                <input
                  style={inputStyle}
                  value={String(content.secondaryLink || "")}
                  onChange={(e) => updateContent("secondaryLink", e.target.value)}
                  placeholder="/doctors"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* NEWSLETTER CTA SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "newsletter" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Newsletter / Journal CTA</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Eyebrow / Label</label>
              <input style={inputStyle} value={String(content.eyebrow || "")} onChange={(e) => updateContent("eyebrow", e.target.value)} placeholder="THE CARE LETTER" />
            </div>
            <div>
              <label style={labelStyle}>Heading</label>
              <input style={inputStyle} value={String(content.heading || "")} onChange={(e) => updateContent("heading", e.target.value)} placeholder="A smarter kind of inbox." />
            </div>
            <div>
              <label style={labelStyle}>Subtitle / Description</label>
              <input style={inputStyle} value={String(content.subtitle || "")} onChange={(e) => updateContent("subtitle", e.target.value)} placeholder="Thoughtful dispatches on science, care, and living well." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Input Placeholder</label>
                <input style={inputStyle} value={String(content.inputPlaceholder || "")} onChange={(e) => updateContent("inputPlaceholder", e.target.value)} placeholder="Your email address" />
              </div>
              <div>
                <label style={labelStyle}>Button Text</label>
                <input style={inputStyle} value={String(content.buttonText || "")} onChange={(e) => updateContent("buttonText", e.target.value)} placeholder="Subscribe" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Success Message</label>
              <input style={inputStyle} value={String(content.successMessage || "")} onChange={(e) => updateContent("successMessage", e.target.value)} placeholder="Welcome to the care letter." />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CUSTOM SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "custom" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Custom Content</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <GlobalMediaUploader
              label="Section Image / Media"
              preset="banner_desktop"
              value={String(content.imageUrl || "")}
              onChange={(url) => updateContent("imageUrl", url)}
              folder="homepage"
            />
            <div>
              <label style={labelStyle}>Heading</label>
              <input
                style={inputStyle}
                value={String(content.heading || "")}
                onChange={(e) => updateContent("heading", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Body Content / HTML</label>
              <textarea
                style={{ ...inputStyle, minHeight: 120 }}
                value={String(content.body || content.text || "")}
                onChange={(e) => updateContent("body", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {form.type === "marquee" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase" }}>
                Universal Scrolling Ticker
              </span>
              <h4 style={{ font: "16px var(--font-display)", margin: 0, color: "var(--purple)" }}>
                📢 Multi-Placement Marquee Engine
              </h4>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
            Admin-controlled infinite marquee ticker configurable across multiple website positions with custom speed, direction, colors, and items.
          </p>

          <div style={{ display: "grid", gap: 14 }}>
            {/* Placement & Direction */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Ticker Placement Location</label>
                <select
                  style={inputStyle}
                  value={String(content.placement || "hero")}
                  onChange={(e) => updateContent("placement", e.target.value)}
                >
                  <option value="above_header">Above Header (Top Notification Ribbon)</option>
                  <option value="below_header">Below Header (Primary Brand Ticker)</option>
                  <option value="hero">Hero Sequence (Sub-Hero Ticker)</option>
                  <option value="between_sections">Between Sections (In-Page Transition)</option>
                  <option value="above_footer">Above Footer (Bottom Trust Strip)</option>
                  <option value="all">Universal (All Placements)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Scroll Direction</label>
                <select
                  style={inputStyle}
                  value={String(content.direction || "rtl")}
                  onChange={(e) => updateContent("direction", e.target.value)}
                >
                  <option value="rtl">Right to Left (Standard)</option>
                  <option value="ltr">Left to Right (Reverse)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Separator Symbol</label>
                <input
                  style={inputStyle}
                  value={String(content.separator || "✦")}
                  onChange={(e) => updateContent("separator", e.target.value)}
                  placeholder="✦"
                />
              </div>
            </div>

            {/* Speeds & Hover */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Desktop Speed (Seconds per cycle)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={8}
                  max={90}
                  value={Number(content.speed) || 24}
                  onChange={(e) => updateContent("speed", Number(e.target.value))}
                />
              </div>
              <div>
                <label style={labelStyle}>Mobile Speed (Seconds per cycle)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={6}
                  max={60}
                  value={Number(content.mobileSpeed) || 18}
                  onChange={(e) => updateContent("mobileSpeed", Number(e.target.value))}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={content.pauseOnHover !== false}
                    onChange={(e) => updateContent("pauseOnHover", e.target.checked)}
                  />
                  <span>Pause Scrolling on Cursor Hover</span>
                </label>
              </div>
            </div>

            {/* Typography & Colors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Text Color</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="color"
                    value={String(content.textColor || "#1c1917").startsWith("#") ? String(content.textColor) : "#1c1917"}
                    onChange={(e) => updateContent("textColor", e.target.value)}
                    style={{ width: 38, height: 38, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
                  />
                  <input
                    style={inputStyle}
                    value={String(content.textColor || "")}
                    onChange={(e) => updateContent("textColor", e.target.value)}
                    placeholder="e.g. #1c1917"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Background Color</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="color"
                    value={String(content.bgColor || "#FAF8F5").startsWith("#") ? String(content.bgColor) : "#FAF8F5"}
                    onChange={(e) => updateContent("bgColor", e.target.value)}
                    style={{ width: 38, height: 38, padding: 0, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
                  />
                  <input
                    style={inputStyle}
                    value={String(content.bgColor || "")}
                    onChange={(e) => updateContent("bgColor", e.target.value)}
                    placeholder="e.g. #FAF8F5"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Font Size</label>
                <input
                  style={inputStyle}
                  value={String(content.fontSize || "12px")}
                  onChange={(e) => updateContent("fontSize", e.target.value)}
                  placeholder="12px"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Marquee Items (one item per line)</label>
              <textarea
                style={{ ...inputStyle, minHeight: 120, fontFamily: "monospace" }}
                value={Array.isArray(content.items) ? (content.items as string[]).join("\n") : "Clinical intelligence\nMade with soul\nScience-backed formulas\nTraceable ingredients\nDesigned with doctors\nPharmaceutical rigor\nEveryday wellness"}
                onChange={(e) => updateContent("items", e.target.value.split("\n").filter((s: string) => s.trim()))}
                placeholder="Enter one item per line..."
              />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Each line will be rendered as an individual ticker item separated by the separator symbol.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HEALTH QUIZ SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {form.type === "quiz" && (
        <div style={{ marginBottom: 24, padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>
            📋 Clinical Health Consultation Quiz
          </h4>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
            Configure the interactive health diagnostic quiz that guides visitors to personalized product recommendations.
          </p>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Quiz Section Eyebrow</label>
                <input
                  style={inputStyle}
                  value={String(content.eyebrow || "")}
                  onChange={(e) => updateContent("eyebrow", e.target.value)}
                  placeholder="Personalized Consultation"
                />
              </div>
              <div>
                <label style={labelStyle}>CTA Button Label</label>
                <input
                  style={inputStyle}
                  value={String(content.ctaText || "")}
                  onChange={(e) => updateContent("ctaText", e.target.value)}
                  placeholder="Take Formulation Quiz"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Heading</label>
              <input
                style={inputStyle}
                value={String(content.heading || "")}
                onChange={(e) => updateContent("heading", e.target.value)}
                placeholder="Find the exact formulation your routine requires."
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 70 }}
                value={String(content.description || "")}
                onChange={(e) => updateContent("description", e.target.value)}
                placeholder="Answer 4 clinical questions to calculate your personalized bioactive routine."
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Button Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: "12px 32px",
            background: "#2A0F3A",
            color: "#D4AF37",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: ".04em",
          }}
        >
          {saving ? "Saving…" : "💾 Save & Publish Section"}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Collection Product Picker                                                 */
/* ────────────────────────────────────────────────────────────────────────── */
function CollectionProductPicker({ content, updateContent }: { content: Record<string, unknown>; updateContent: (k: string, v: unknown) => void }) {
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; image: string; category: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const selectedIds: string[] = (content.selectedProductIds as string[]) || [];
  const categoryFilter: string[] = (content.selectedCategoryFilter as string[]) || [];

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(p.category);
    return matchesSearch && matchesCategory;
  });

  const toggle = (id: string) => {
    const next = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    updateContent("selectedProductIds", next);
  };

  const selectAll = () => {
    updateContent("selectedProductIds", filteredProducts.map(p => p.id));
  };

  const deselectAll = () => {
    updateContent("selectedProductIds", []);
  };

  const toggleCategory = (cat: string) => {
    const next = categoryFilter.includes(cat) ? categoryFilter.filter(x => x !== cat) : [...categoryFilter, cat];
    updateContent("selectedCategoryFilter", next);
  };

  const btnSmall = { padding: "4px 10px", fontSize: 11, border: "1px solid var(--line)", borderRadius: 4, background: "#fff", cursor: "pointer" as const };

  return (
    <div style={{ marginTop: 16, padding: 16, background: "#fff", border: "1px solid var(--line)", borderRadius: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h5 style={{ font: "bold 12px var(--font-display)", color: "var(--purple)", margin: 0 }}>Product Selection</h5>
        <button onClick={() => setShowPicker(!showPicker)} style={{ ...btnSmall, background: showPicker ? "var(--purple)" : "#fff", color: showPicker ? "#fff" : "var(--purple)", fontWeight: 700 }}>
          {showPicker ? "Hide Picker" : "Choose Products"}
        </button>
      </div>

      {selectedIds.length > 0 && !showPicker && (
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{selectedIds.length} product(s) selected</p>
      )}

      {categoryFilter.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ ...labelStyle, marginBottom: 6 }}>Category Filter</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {categoryFilter.map(cat => (
              <span key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "var(--purple)", color: "#fff", borderRadius: 12, fontSize: 11 }}>
                {cat}
                <button onClick={() => toggleCategory(cat)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {showPicker && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: 10, background: "#faf8f5", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <input
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 140 }}
              />
              <button onClick={selectAll} style={{ ...btnSmall, background: "var(--purple)", color: "#fff" }}>Select All</button>
              <button onClick={deselectAll} style={btnSmall}>Deselect All</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2A0F3A", alignSelf: "center" }}>Filter:</span>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  style={{ ...btnSmall, background: categoryFilter.includes(cat) ? "var(--purple)" : "#fff", color: categoryFilter.includes(cat) ? "#fff" : "#2A0F3A" }}
                >{cat}</button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto", padding: 8 }}>
            {loading && <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Loading…</p>}
            {!loading && filteredProducts.length === 0 && <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>No products found.</p>}
            {filteredProducts.map(p => (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: selectedIds.includes(p.id) ? "#f3e8ff" : "transparent", transition: "background .15s" }}>
                <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggle(p.id)} style={{ accentColor: "var(--purple)" }} />
                <div style={{ width: 36, height: 36, borderRadius: 4, background: "#f0f0f0", overflow: "hidden", flexShrink: 0 }}>
                  {p.image && <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.category} · ₹{p.price.toLocaleString("en-IN")}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
