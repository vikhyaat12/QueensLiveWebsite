"use client";

import { useState, useEffect } from "react";
import GlobalMediaUploader, { MediaItem } from "../components/GlobalMediaUploader";

/* ─── 15-TAB ENTERPRISE PRODUCT EDIT FORM ──────────────────────────────── */

type SpecRow = { name: string; value: string };

type HighlightItem = {
  id: string;
  text: string;
  icon?: string;
  active?: boolean;
};

type VariantItem = {
  id: string;
  name: string;
  sku?: string;
  price: number;
  mrp?: number;
  stock: number;
  active: boolean;
  sort: number;
};

type APlusSection = {
  id?: string;
  type: string;
  heading?: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  columns?: string;
  items?: string[];
  ctaText?: string;
  ctaLink?: string;
  published?: boolean;
};

type EditTab =
  | "overview"
  | "pricing"
  | "inventory"
  | "variants"
  | "media"
  | "highlights"
  | "description"
  | "specs"
  | "pharma"
  | "tax"
  | "shipping"
  | "aplus"
  | "seo"
  | "cross_sell"
  | "advanced";

const APLUS_TYPES: { value: string; label: string; icon: string }[] = [
  { value: "hero", label: "Hero Banner", icon: "🖼️" },
  { value: "fullWidth", label: "Full Width Image", icon: "📐" },
  { value: "imageText", label: "Image + Text", icon: "📰" },
  { value: "richText", label: "Rich Text", icon: "📝" },
  { value: "benefits", label: "Benefits Grid", icon: "✅" },
  { value: "features", label: "Features Grid", icon: "⭐" },
  { value: "comparison", label: "Comparison Table", icon: "📊" },
  { value: "highlights", label: "Highlights", icon: "💡" },
  { value: "video", label: "Video Section", icon: "🎬" },
  { value: "cta", label: "CTA / Button", icon: "🔘" },
];

export function ProductEditFormAdvanced({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [activeTab, setActiveTab] = useState<EditTab>("overview");
  const [form, setForm] = useState<Record<string, unknown>>(item);
  const [showSeoModal, setShowSeoModal] = useState(false);

  // Highlights state
  const [highlights, setHighlights] = useState<HighlightItem[]>(() => {
    try {
      const raw = form.highlights;
      if (Array.isArray(raw)) {
        return raw.map((h, i) => {
          if (typeof h === "string") return { id: `hl-${i}`, text: h, active: true, icon: "✓" };
          return {
            id: (h.id as string) || `hl-${i}`,
            text: String(h.text || ""),
            icon: h.icon ? String(h.icon) : "✓",
            active: h.active !== false,
          };
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  // Variants state
  const [variants, setVariants] = useState<VariantItem[]>(() => {
    try {
      const raw = form.variants;
      if (Array.isArray(raw)) {
        return (raw as Record<string, unknown>[]).map((v, i) => ({
          id: String(v.id || `var-${i}`),
          name: String(v.name || ""),
          sku: v.sku ? String(v.sku) : "",
          price: Number(v.price || form.price || 0),
          mrp: v.mrp ? Number(v.mrp) : Number(form.mrp || 0),
          stock: Number(v.stock || 0),
          active: v.active !== false,
          sort: Number(v.sort ?? i),
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  // A+ Content sections state
  const [aplusSections, setAplusSections] = useState<APlusSection[]>(() => {
    try {
      if (Array.isArray(form.aplusContent)) return form.aplusContent as APlusSection[];
      if (typeof form.aplusContent === "string") return JSON.parse(form.aplusContent);
      return [];
    } catch { return []; }
  });

  // Specifications state
  const [specs, setSpecs] = useState<SpecRow[]>(() => {
    try {
      if (Array.isArray(form.specifications)) return form.specifications as SpecRow[];
      if (typeof form.specifications === "string") return JSON.parse(form.specifications);
      return [];
    } catch { return []; }
  });

  // Images state
  const [images, setImages] = useState<string[]>(() => {
    const img = form.images || form.gallery;
    if (Array.isArray(img)) return img.map(String);
    return form.image ? [String(form.image)] : [];
  });

  // Videos state
  const [videos, setVideos] = useState<MediaItem[]>(() => {
    if (Array.isArray(form.videos)) {
      return (form.videos as Record<string, unknown>[]).map((v, i) => ({
        id: (v.id as string) || `vid-${i}`,
        url: String(v.url || ""),
        title: v.title ? String(v.title) : undefined,
        posterUrl: v.posterUrl ? String(v.posterUrl) : undefined,
      }));
    }
    if (form.video) {
      return [{ id: "main-vid", url: String(form.video), posterUrl: form.videoPoster ? String(form.videoPoster) : undefined }];
    }
    return [];
  });

  // Cross-sell lists
  const [relatedProducts, setRelatedProducts] = useState<string[]>(() => {
    if (Array.isArray(form.relatedProductIds)) return form.relatedProductIds.map(String);
    return [];
  });
  const [fbtProducts, setFbtProducts] = useState<string[]>(() => {
    if (Array.isArray(form.frequentlyBoughtTogetherIds)) return form.frequentlyBoughtTogetherIds.map(String);
    return [];
  });

  // All catalog products for cross-sell selectors
  const [allCatalogProducts, setAllCatalogProducts] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  const [aplusTemplatesList, setAplusTemplatesList] = useState<Array<{ id: string; title: string; sections: APlusSection[] }>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(String(form.aplusTemplateId || ""));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [aplusExpanded, setAplusExpanded] = useState<number | null>(null);
  const [aplusPublished, setAplusPublished] = useState<boolean>(() => !!form.aplusPublished);
  const [aplusSavedMsg, setAplusSavedMsg] = useState("");
  const [taxRules, setTaxRules] = useState<Array<{ id: string; name: string; gstRate: number; hsnCodes?: string[]; isDefault?: boolean }>>([]);

  useEffect(() => {
    fetch("/api/admin/aplus")
      .then(r => r.json())
      .then(d => { if (d.templates) setAplusTemplatesList(d.templates); })
      .catch(() => {});

    fetch("/api/admin/tax")
      .then(r => r.json())
      .then(d => { if (d.rules) setTaxRules(d.rules); })
      .catch(() => {});

    fetch("/api/products?all=true")
      .then(r => r.json())
      .then(d => {
        if (d.products) {
          setAllCatalogProducts(d.products.map((p: Record<string, unknown>) => ({
            id: String(p.id || p.slug),
            name: String(p.name || ""),
            slug: String(p.slug || ""),
          })));
        }
      })
      .catch(() => {});
  }, []);

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid var(--line)", fontSize: 13, background: "#fff", color: "var(--foreground)" };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4, color: "var(--foreground)" };

  /* ── HIGHLIGHTS HELPERS ── */
  const addHighlight = () => {
    setHighlights([...highlights, { id: `hl-${Date.now()}`, text: "", icon: "✓", active: true }]);
  };
  const updateHighlight = (idx: number, patch: Partial<HighlightItem>) => {
    const arr = [...highlights]; arr[idx] = { ...arr[idx], ...patch }; setHighlights(arr);
  };
  const removeHighlight = (idx: number) => setHighlights(highlights.filter((_, i) => i !== idx));
  const moveHighlight = (idx: number, dir: number) => {
    const arr = [...highlights]; const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]]; setHighlights(arr);
  };
  const duplicateHighlight = (idx: number) => {
    const src = highlights[idx];
    const dup = { ...src, id: `hl-${Date.now()}` };
    const arr = [...highlights]; arr.splice(idx + 1, 0, dup); setHighlights(arr);
  };

  /* ── VARIANTS HELPERS ── */
  const addVariant = () => {
    setVariants([...variants, {
      id: `var-${Date.now()}`,
      name: "",
      sku: `${form.sku || form.slug || "QC"}-${variants.length + 1}`,
      price: Number(form.price || 0),
      mrp: Number(form.mrp || 0),
      stock: 10,
      active: true,
      sort: variants.length,
    }]);
  };
  const updateVariant = (idx: number, patch: Partial<VariantItem>) => {
    const arr = [...variants]; arr[idx] = { ...arr[idx], ...patch }; setVariants(arr);
  };
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));

  /* ── SPEC HELPERS ── */
  const addSpec = () => setSpecs([...specs, { name: "", value: "" }]);
  const updateSpec = (idx: number, field: keyof SpecRow, val: string) => {
    const arr = [...specs]; arr[idx] = { ...arr[idx], [field]: val }; setSpecs(arr);
  };
  const removeSpec = (idx: number) => setSpecs(specs.filter((_, i) => i !== idx));

  /* ── A+ HELPERS ── */
  const addAplusSection = (type: string) => {
    setAplusSections([...aplusSections, {
      type, heading: "", text: "", imageUrl: "", imageAlt: "",
      videoUrl: "", items: [], ctaText: "", ctaLink: "", published: true,
    }]);
    setAplusExpanded(aplusSections.length);
  };
  const updateAplus = (idx: number, patch: Partial<APlusSection>) => {
    const arr = [...aplusSections]; arr[idx] = { ...arr[idx], ...patch }; setAplusSections(arr);
  };
  const removeAplus = (idx: number) => { setAplusSections(aplusSections.filter((_, i) => i !== idx)); if (aplusExpanded === idx) setAplusExpanded(null); };
  const moveAplus = (idx: number, dir: number) => {
    const arr = [...aplusSections]; const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]]; setAplusSections(arr);
    if (aplusExpanded === idx) setAplusExpanded(swap);
    else if (aplusExpanded === swap) setAplusExpanded(idx);
  };

  /* ── SAVE ── */
  const handleSaveClick = () => {
    const isNew = Boolean(form.isNew);
    const oldSlug = String(item.slug || "").trim().toLowerCase();
    const newSlug = String(form.slug || "").trim().toLowerCase();
    if (!isNew && oldSlug && newSlug && oldSlug !== newSlug) {
      setShowSeoModal(true);
      return;
    }
    executeSave();
  };

  const executeSave = async () => {
    setSaving(true); setIsError(false); setMsg("");
    const isNew = Boolean(form.isNew);
    const identifier = String(item.id || item.slug || form.id || form.slug || "");
    const endpoint = isNew ? "/api/products" : `/api/products/${encodeURIComponent(identifier)}`;
    const method = isNew ? "POST" : "PATCH";

    const payload = {
      ...form,
      images: images,
      image: images[0] || form.image || "",
      videos: videos.map((v) => ({ id: v.id, url: v.url, title: v.title, posterUrl: v.posterUrl })),
      video: videos[0]?.url || form.video || "",
      videoPoster: videos[0]?.posterUrl || form.videoPoster || "",
      specifications: specs,
      highlights: highlights,
      variants: variants,
      aplusContent: aplusSections,
      aplusTemplateId: selectedTemplateId || null,
      aplusPublished: aplusPublished,
      price: Number(form.price || 0),
      mrp: form.mrp ? Number(form.mrp) : undefined,
      discount: form.discount ? Number(form.discount) : undefined,
      costPrice: form.costPrice !== undefined && form.costPrice !== "" ? Number(form.costPrice) : undefined,
      stock: Number(form.stock || 0),
      lowStockThreshold: Number(form.lowStockThreshold || 10),
      scarcityThreshold: Number(form.scarcityThreshold ?? 5),
      minPurchaseQty: Number(form.minPurchaseQty ?? 1),
      maxPurchaseQty: Number(form.maxPurchaseQty ?? 10),
      trackInventory: form.trackInventory !== false,
      inventoryMessagingEnabled: form.inventoryMessagingEnabled !== false,
      preorderEnabled: Boolean(form.preorderEnabled),
      preorderLabel: form.preorderLabel || "Pre-Order Now",
      preorderMessage: form.preorderMessage || "",
      expectedDispatchDate: form.expectedDispatchDate || "",
      preorderMaxQty: form.preorderMaxQty ? Number(form.preorderMaxQty) : undefined,
      preorderCodAllowed: Boolean(form.preorderCodAllowed),
      outOfStockMessage: form.outOfStockMessage || "",
      status: String(form.status || (Number(form.stock || 0) <= 0 ? "out_of_stock" : "active")),
      taxRate: Number(form.taxRate || form.gstRate || 12),
      gstRate: form.gstRate !== undefined && form.gstRate !== "" ? Number(form.gstRate) : Number(form.taxRate || 12),
      taxMode: form.taxMode || "taxable",
      taxInclusive: form.taxInclusive !== false,
      taxRuleId: form.taxRuleId ? String(form.taxRuleId) : undefined,
      hsnCode: String(form.hsnCode || "3004"),
      taxCategory: String(form.taxCategory || "pharmaceuticals"),
      weightGrams: form.weightGrams ? Number(form.weightGrams) : undefined,
      dimensions: {
        length: form.dimLength ? Number(form.dimLength) : undefined,
        width: form.dimWidth ? Number(form.dimWidth) : undefined,
        height: form.dimHeight ? Number(form.dimHeight) : undefined,
        unit: String(form.dimUnit || "cm"),
      },
      coldChainRequired: Boolean(form.coldChainRequired),
      relatedProductIds: relatedProducts,
      frequentlyBoughtTogetherIds: fbtProducts,
      adminNotes: String(form.adminNotes || ""),
    };

    try {
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setIsError(false); setMsg("Product saved successfully!"); setTimeout(onSave, 500); }
      else { setIsError(true); setMsg(data.error || "Failed to save product."); }
    } catch { setIsError(true); setMsg("Network error while saving."); }
    setSaving(false);
  };

  /* ── 15 ENTERPRISE TABS CONFIG ── */
  const tabs: { id: EditTab; label: string; icon: string; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "pricing", label: "Pricing", icon: "💰" },
    { id: "inventory", label: "Inventory & Pre-order", icon: "📦" },
    { id: "variants", label: "Variants & SKUs", icon: "🔀", badge: variants.length || undefined },
    { id: "media", label: "Media & 3D", icon: "🎬", badge: images.length + videos.length || undefined },
    { id: "highlights", label: "Key Highlights", icon: "💡", badge: highlights.length || undefined },
    { id: "description", label: "Description", icon: "📝" },
    { id: "specs", label: "Specifications", icon: "📐", badge: specs.length || undefined },
    { id: "pharma", label: "Pharma & Clinical", icon: "💊" },
    { id: "tax", label: "Tax & GST", icon: "⚖️" },
    { id: "shipping", label: "Shipping", icon: "🚚" },
    { id: "aplus", label: "A+ Content", icon: "✨", badge: aplusSections.length || undefined },
    { id: "seo", label: "SEO", icon: "🔍" },
    { id: "cross_sell", label: "Cross-Sell", icon: "🎯", badge: relatedProducts.length + fbtProducts.length || undefined },
    { id: "advanced", label: "Advanced", icon: "⚙️" },
  ];

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto" }}>
      {/* ── TOP ACTION HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ font: "22px var(--font-display)", margin: 0, color: "var(--foreground)" }}>
              {form.isNew ? "Create Formulation" : `Edit: ${String(form.name || "Product")}`}
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
              background: form.status === "out_of_stock" ? "#fff3cd" : form.status === "inactive" ? "#eee" : "#e9f7e9",
              color: form.status === "out_of_stock" ? "#8a6d3b" : form.status === "inactive" ? "#666" : "#2e7d32",
              textTransform: "uppercase", letterSpacing: ".05em",
            }}>
              {String(form.status || "active")}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
            SKU: <code>{String(form.sku || form.slug || "QC-FORMULATION")}</code> · Route: <code>/products/{String(form.slug || "")}</code>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!form.isNew && (
            <a
              href={`/products/${String(form.slug || "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "9px 16px", background: "#fff", border: "1px solid var(--purple)", color: "var(--purple)", fontSize: 13, fontWeight: 600, textDecoration: "none", borderRadius: 4 }}
            >
              👁️ View Live PDP
            </a>
          )}
          <button
            onClick={handleSaveClick}
            disabled={saving}
            style={{ padding: "9px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 4 }}
          >
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {/* ── STATUS MESSAGE ── */}
      {msg && (
        <p style={{
          padding: "10px 14px", marginBottom: 16, fontSize: 12, fontWeight: 600, borderRadius: 4,
          background: isError ? "#fde8e8" : "#e9f7e9", color: isError ? "#b34141" : "#2e7d32",
          border: `1px solid ${isError ? "#f8b4b4" : "#c3e6cb"}`,
        }}>{msg}</p>
      )}

      {/* ── 15-TAB SCROLLABLE NAVIGATION ── */}
      <div style={{
        display: "flex", gap: 2, borderBottom: "2px solid var(--line)", marginBottom: 20,
        overflowX: "auto", scrollbarWidth: "thin", paddingBottom: 1,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 14px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
              background: activeTab === t.id ? "#fff" : "transparent",
              color: activeTab === t.id ? "var(--purple)" : "var(--muted)",
              borderBottom: activeTab === t.id ? "2px solid var(--purple)" : "2px solid transparent",
              marginBottom: "-2px",
              borderRadius: "4px 4px 0 0",
              transition: "all 0.15s ease",
            }}
          >
            <span>{t.icon}</span> {t.label}
            {t.badge !== undefined && (
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 10,
                background: activeTab === t.id ? "var(--purple)" : "#e8e1eb",
                color: activeTab === t.id ? "#fff" : "var(--purple)",
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: OVERVIEW */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Formulation Identity & Overview</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Product Formulation Name *</label>
                <input style={inputStyle} value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lumine-C 15% Vitamin C Daily Glow Serum" />
              </div>
              <div>
                <label style={labelStyle}>URL Slug (Editable Public Route) *</label>
                <input
                  style={inputStyle}
                  value={String(form.slug || "")}
                  onChange={e => setForm({
                    ...form,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, "-").replace(/-+/g, "-")
                  })}
                  placeholder="e.g. lumine-c"
                />
                <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                  Preview: <code>/products/{String(form.slug || "")}</code>
                </div>
                {Boolean(!form.isNew && item.slug && String(form.slug || "").toLowerCase() !== String(item.slug).toLowerCase()) && (
                  <div style={{ marginTop: 6, padding: "5px 8px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 4, fontSize: 11, color: "#92400e" }}>
                    🔄 URL modified. Saving will auto-create 301 redirect: <code>/products/{String(item.slug)}</code> → <code>/products/{String(form.slug)}</code>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Primary Category *</label>
                <input style={inputStyle} value={String(form.category || "")} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Dermatological / Serums" />
              </div>
              <div>
                <label style={labelStyle}>Subcategory (Optional)</label>
                <input style={inputStyle} value={String(form.subcategory || "")} onChange={e => setForm({ ...form, subcategory: e.target.value })} placeholder="e.g. Vitamin C / Brightening" />
              </div>
              <div>
                <label style={labelStyle}>Brand / Division</label>
                <input style={inputStyle} value={String(form.brand || "Queens Care")} onChange={e => setForm({ ...form, brand: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Master SKU</label>
                <input style={inputStyle} value={String(form.sku || form.slug || "")} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. QC-LUM-01" />
              </div>
              <div>
                <label style={labelStyle}>Lifecycle Status</label>
                <select style={inputStyle} value={String(form.status || "active")} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active (Live in Catalog)</option>
                  <option value="inactive">Inactive (Hidden from Shop)</option>
                  <option value="out_of_stock">Out of Stock (View-Only)</option>
                  <option value="hidden">Draft / Hidden</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Prescription Classification</label>
                <select style={inputStyle} value={String(form.prescriptionStatus || "none")} onChange={e => setForm({ ...form, prescriptionStatus: e.target.value })}>
                  <option value="none">OTC / Wellness Formulation</option>
                  <option value="rx_required">Rx Required (Schedule H / H1)</option>
                  <option value="rx_optional">Physician Recommended</option>
                </select>
              </div>
            </div>

            {/* Visual Merchandising Badges */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <label style={{ ...labelStyle, fontSize: 12, marginBottom: 8 }}>Merchandising Badges</label>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                <label><input type="checkbox" checked={!!form.bestSeller} onChange={e => setForm({ ...form, bestSeller: e.target.checked })} /> 🏆 Best Seller</label>
                <label><input type="checkbox" checked={!!form.newArrival} onChange={e => setForm({ ...form, newArrival: e.target.checked })} /> 🆕 New Arrival</label>
                <label><input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> ⭐ Featured</label>
                <label><input type="checkbox" checked={!!form.trending} onChange={e => setForm({ ...form, trending: e.target.checked })} /> 📈 Trending</label>
                <label><input type="checkbox" checked={!!form.recommended} onChange={e => setForm({ ...form, recommended: e.target.checked })} /> 👍 Physician Recommended</label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PRICING */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "pricing" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Commercial Pricing & Margins</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Selling Price (₹) *</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={Number(form.price || 0)}
                  onChange={e => {
                    const sp = Number(e.target.value);
                    const mrp = Number(form.mrp || 0);
                    const disc = mrp > sp && mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
                    setForm({ ...form, price: sp, discount: disc > 0 ? disc : undefined });
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Maximum Retail Price (MRP ₹)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={Number(form.mrp || 0)}
                  onChange={e => {
                    const mrp = Number(e.target.value);
                    const sp = Number(form.price || 0);
                    const disc = mrp > sp && mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
                    setForm({ ...form, mrp: mrp, discount: disc > 0 ? disc : undefined });
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Discount (%)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={Number(form.discount || 0)}
                  onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={labelStyle}>Cost Price (₹) [Internal Admin Only]</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.costPrice !== undefined ? String(form.costPrice) : ""}
                  placeholder="e.g. 240"
                  onChange={e => setForm({ ...form, costPrice: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Margin Calculation Box */}
            {(() => {
              const sp = Number(form.price || 0);
              const cp = Number(form.costPrice || 0);
              const mrp = Number(form.mrp || 0);
              if (sp > 0 && cp > 0) {
                const margin = sp - cp;
                const marginPct = ((margin / sp) * 100).toFixed(1);
                return (
                  <div style={{ background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: 4, padding: "10px 14px", fontSize: 12 }}>
                    <b>Gross Commercial Margin: </b>
                    <span style={{ color: "#2e7d32", fontWeight: 700 }}>₹{margin.toFixed(2)} ({marginPct}%)</span>
                    {mrp > sp && <span style={{ marginLeft: 14, color: "#666" }}>Customer Saves: ₹{(mrp - sp).toFixed(2)} ({Math.round(((mrp - sp) / mrp) * 100)}% off)</span>}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: INVENTORY & PRE-ORDER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "inventory" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Authoritative Inventory &amp; Pre-Order Orchestration</h4>
          <div style={{ display: "grid", gap: 16 }}>
            {/* Core Inventory Toggles */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", background: "#fff", padding: 12, borderRadius: 4, border: "1px solid var(--line)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.trackInventory !== false}
                  onChange={e => setForm({ ...form, trackInventory: e.target.checked })}
                />
                Enable Authoritative Stock Tracking
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.inventoryMessagingEnabled !== false}
                  onChange={e => setForm({ ...form, inventoryMessagingEnabled: e.target.checked })}
                />
                Show Dynamic Scarcity Messaging on PDP
              </label>
            </div>

            {/* Quantity Limits & Thresholds */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Available Stock Units *</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={Number(form.stock ?? 0)}
                  onChange={e => setForm({ ...form, stock: Math.max(0, Number(e.target.value)) })}
                />
              </div>
              <div>
                <label style={labelStyle}>Low-Stock Warning Level</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={Number(form.lowStockThreshold ?? 10)}
                  onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={labelStyle}>Scarcity Urgency Threshold</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={Number(form.scarcityThreshold ?? 5)}
                  onChange={e => setForm({ ...form, scarcityThreshold: Number(e.target.value) })}
                />
                <span style={{ fontSize: 10, color: "var(--muted)" }}>Displays &ldquo;Only X left&rdquo; when &le; this</span>
              </div>
              <div>
                <label style={labelStyle}>Max Purchase Per Order</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={Number(form.maxPurchaseQty ?? 10)}
                  onChange={e => setForm({ ...form, maxPurchaseQty: Math.max(1, Number(e.target.value)) })}
                />
              </div>
            </div>

            {/* Real-time Customer Scarcity Preview */}
            <div style={{ background: "#fff", border: "1px dashed var(--purple)", borderRadius: 6, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
                Customer-Facing Scarcity Simulation Preview:
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {Number(form.stock || 0) <= 0 ? (
                  Boolean(form.preorderEnabled) ? (
                    <span style={{ color: "#0066cc" }}>🔷 {String(form.preorderLabel || "Pre-Order Now")} — {String(form.preorderMessage || "Dispatching soon")}</span>
                  ) : (
                    <span style={{ color: "#b34141" }}>🚫 Out of Stock — {String(form.outOfStockMessage || "Back-in-stock waitlist available")}</span>
                  )
                ) : Number(form.stock || 0) <= Number(form.scarcityThreshold ?? 5) ? (
                  <span style={{ color: "#d97706" }}>⚡ Only {Number(form.stock)} units left in lab stock — Order now</span>
                ) : (
                  <span style={{ color: "#2e7d32" }}>✓ In Stock — Ready for dispatch</span>
                )}
              </div>
            </div>

            {/* Out of Stock Messaging */}
            <div>
              <label style={labelStyle}>Out of Stock Message (Optional)</label>
              <input
                style={inputStyle}
                value={String(form.outOfStockMessage || "")}
                onChange={e => setForm({ ...form, outOfStockMessage: e.target.value })}
                placeholder="e.g. Currently undergoing cGMP batch synthesis — restocking in 4 days"
              />
            </div>

            {/* Pre-Order Architecture */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--purple)" }}>
                  ⏳ Backorder &amp; Pre-Order Orchestration
                </span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.preorderEnabled)}
                    onChange={e => setForm({ ...form, preorderEnabled: e.target.checked })}
                  />
                  Enable Pre-Order When Stock Is Zero
                </label>
              </div>

              {Boolean(form.preorderEnabled) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, background: "#fff", padding: 14, borderRadius: 4, border: "1px solid #b3d7ff" }}>
                  <div>
                    <label style={labelStyle}>Pre-Order Button Label</label>
                    <input
                      style={inputStyle}
                      value={String(form.preorderLabel || "Pre-Order Now")}
                      onChange={e => setForm({ ...form, preorderLabel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Expected Dispatch Date / Window</label>
                    <input
                      style={inputStyle}
                      value={String(form.expectedDispatchDate || "")}
                      onChange={e => setForm({ ...form, expectedDispatchDate: e.target.value })}
                      placeholder="e.g. Dispatches on Oct 5, 2026"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Pre-Order Capacity (Optional)</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={form.preorderMaxQty ? String(form.preorderMaxQty) : ""}
                      onChange={e => setForm({ ...form, preorderMaxQty: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Pre-Order Explanatory Message</label>
                    <input
                      style={inputStyle}
                      value={String(form.preorderMessage || "")}
                      onChange={e => setForm({ ...form, preorderMessage: e.target.value })}
                      placeholder="e.g. Reserved directly from the next clinical batch. Priority express shipping included."
                    />
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(form.preorderCodAllowed)}
                        onChange={e => setForm({ ...form, preorderCodAllowed: e.target.checked })}
                      />
                      Allow Cash on Delivery (COD) for Pre-Orders
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: VARIANTS & SKUS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "variants" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Multi-SKU &amp; Variant Matrix ({variants.length})
              </h4>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 0" }}>
                Add different sizes, strengths, or packaging variants. Each variant has independent stock and price.
              </p>
            </div>
            <button
              onClick={addVariant}
              style={{ padding: "7px 14px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4 }}
            >
              + Add SKU Variant
            </button>
          </div>

          {variants.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              {variants.map((v, idx) => (
                <div key={v.id || idx} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto auto", gap: 8, alignItems: "center", background: "#fff", padding: 10, border: "1px solid var(--line)", borderRadius: 4 }}>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>Variant Name (e.g. 50ml / 500mg)</label>
                    <input style={inputStyle} value={v.name} onChange={e => updateVariant(idx, { name: e.target.value })} placeholder="e.g. 50ml Bottle" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>SKU Code</label>
                    <input style={inputStyle} value={v.sku || ""} onChange={e => updateVariant(idx, { sku: e.target.value })} placeholder="e.g. QC-LUM-50ML" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>Price (₹)</label>
                    <input type="number" style={inputStyle} value={v.price} onChange={e => updateVariant(idx, { price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>MRP (₹)</label>
                    <input type="number" style={inputStyle} value={v.mrp || 0} onChange={e => updateVariant(idx, { mrp: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>Stock</label>
                    <input type="number" style={inputStyle} value={v.stock} onChange={e => updateVariant(idx, { stock: Math.max(0, Number(e.target.value)) })} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <label style={{ fontSize: 10, color: "var(--muted)", display: "block" }}>Active</label>
                    <input type="checkbox" checked={v.active} onChange={e => updateVariant(idx, { active: e.target.checked })} />
                  </div>
                  <button onClick={() => removeVariant(idx)} style={{ padding: "6px 10px", border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer", fontSize: 11, borderRadius: 4 }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)", borderRadius: 4 }}>
              <p style={{ fontSize: 13, margin: 0 }}>This product currently has a single default SKU (no extra variants).</p>
              <p style={{ fontSize: 11, margin: "6px 0 0" }}>Click &ldquo;+ Add SKU Variant&rdquo; if you have multiple sizes, strengths, or bottle volumes.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: MEDIA & 3D */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "media" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 4, color: "var(--purple)" }}>
            Product Photography, Clinical Videos &amp; 3D Model
          </h4>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
            The first image is the primary hero image. Videos and 3D models enrich the customer PDP gallery.
          </p>

          <GlobalMediaUploader
            label="Product Image Gallery"
            preset="product_image"
            multiple
            value={images}
            onChange={(val) => {
              const urls = Array.isArray(val)
                ? val.map((v) => (typeof v === "string" ? v : v.url))
                : typeof val === "string" && val
                ? [val]
                : [];
              setImages(urls);
              if (urls.length > 0) {
                setForm((prev) => ({ ...prev, image: urls[0], images: urls }));
              }
            }}
            folder="products"
          />

          <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            <GlobalMediaUploader
              label="Product Videos (MP4 / YouTube / Vimeo)"
              preset="product_video"
              multiple
              allowVideo
              value={videos}
              onChange={(val) => {
                const list: MediaItem[] = Array.isArray(val)
                  ? val.map((v) => (typeof v === "string" ? { url: v } : v))
                  : typeof val === "string" && val
                  ? [{ url: val }]
                  : [];
                setVideos(list);
                if (list.length > 0) {
                  setForm((prev) => ({ ...prev, video: list[0].url, videoPoster: list[0].posterUrl || "" }));
                }
              }}
              folder="products"
            />
          </div>

          <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--purple)" }}>🎨 3D Interactive Model</h5>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle}>Model URL (.glb / .gltf)</label>
                <input
                  style={inputStyle}
                  value={String(form.modelUrl || "")}
                  onChange={e => setForm({ ...form, modelUrl: e.target.value })}
                  placeholder="/models/product.glb or https://..."
                />
                <span style={{ fontSize: 10, color: "var(--muted)" }}>Leave empty to disable the 3D viewer on this PDP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: KEY HIGHLIGHTS / BULLETS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "highlights" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Amazon-Style Key Highlights &amp; Feature Bullets ({highlights.length})
              </h4>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 0" }}>
                Unlimited bullet points. Only active bullets are shown on the live product page. Reorder, duplicate, or toggle visibility below.
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {highlights.length > 0 && (
                <>
                  <button
                    onClick={() => setHighlights(highlights.filter(h => h.text.trim()))}
                    style={{ padding: "6px 12px", background: "#fff", border: "1px solid var(--line)", cursor: "pointer", fontSize: 11, borderRadius: 4, color: "var(--muted)" }}
                  >
                    🧹 Remove Empty
                  </button>
                  <button
                    onClick={() => setHighlights(highlights.map(h => ({ ...h, active: true })))}
                    style={{ padding: "6px 12px", background: "#fff", border: "1px solid var(--line)", cursor: "pointer", fontSize: 11, borderRadius: 4, color: "var(--muted)" }}
                  >
                    ✅ Enable All
                  </button>
                </>
              )}
              <button
                onClick={addHighlight}
                style={{ padding: "7px 14px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4 }}
              >
                + Add Key Highlight
              </button>
            </div>
          </div>

          {highlights.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              {highlights.map((hl, idx) => (
                <div key={hl.id || idx} style={{ display: "grid", gridTemplateColumns: "24px 40px 1fr auto auto auto auto", gap: 8, alignItems: "center", background: hl.active !== false ? "#fff" : "#f5f3f0", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, opacity: hl.active !== false ? 1 : 0.6 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textAlign: "center" }}>{idx + 1}</span>
                  <input
                    style={{ ...inputStyle, textAlign: "center", padding: "8px 4px" }}
                    value={hl.icon || "✓"}
                    onChange={e => updateHighlight(idx, { icon: e.target.value })}
                    title="Bullet icon / symbol"
                  />
                  <input
                    style={inputStyle}
                    value={hl.text}
                    onChange={e => updateHighlight(idx, { text: e.target.value })}
                    placeholder="e.g. 15% Pure L-Ascorbic Acid stabilized with Ferulic Acid"
                  />
                  <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={hl.active !== false}
                      onChange={e => updateHighlight(idx, { active: e.target.checked })}
                    />
                    Active
                  </label>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => moveHighlight(idx, -1)} disabled={idx === 0} style={{ padding: "4px 8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 10 }}>▲</button>
                    <button onClick={() => moveHighlight(idx, 1)} disabled={idx === highlights.length - 1} style={{ padding: "4px 8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 10 }}>▼</button>
                  </div>
                  <button onClick={() => duplicateHighlight(idx)} title="Duplicate" style={{ padding: "4px 8px", border: "1px solid #c9d4e8", background: "#fff", color: "#2563eb", cursor: "pointer", fontSize: 10 }}>⎘</button>
                  <button onClick={() => removeHighlight(idx)} style={{ padding: "4px 8px", border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer", fontSize: 10 }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)", borderRadius: 4 }}>
              <p style={{ fontSize: 13, margin: 0 }}>No bullet points added yet.</p>
              <p style={{ fontSize: 11, margin: "6px 0 0" }}>When empty, no bullet box will render on the product page. Click &ldquo;+ Add Key Highlight&rdquo; to add.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 7: DESCRIPTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "description" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Clinical &amp; Narrative Copy</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Short Executive Summary</label>
              <input style={inputStyle} value={String(form.shortDescription || "")} onChange={e => setForm({ ...form, shortDescription: e.target.value })} placeholder="A single concise paragraph summarizing clinical purpose" />
            </div>
            <div>
              <label style={labelStyle}>Full Formulation Monograph / Description</label>
              <textarea style={{ ...inputStyle, minHeight: 110 }} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Comprehensive description of product mechanism..." />
            </div>
            <div>
              <label style={labelStyle}>Key Clinical Benefits (comma separated)</label>
              <textarea style={{ ...inputStyle, minHeight: 65 }} value={Array.isArray(form.benefits) ? form.benefits.join(", ") : String(form.benefits || "")} onChange={e => setForm({ ...form, benefits: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="Antioxidant defense, Melanin inhibition, Collagen synthesis..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Full Ingredients List (INCI)</label>
                <textarea style={{ ...inputStyle, minHeight: 80 }} value={String(form.ingredients || "")} onChange={e => setForm({ ...form, ingredients: e.target.value })} placeholder="Aqua, 3-O-Ethyl Ascorbic Acid, Glycerin, Ferulic Acid..." />
              </div>
              <div>
                <label style={labelStyle}>Directions &amp; Application Protocol</label>
                <textarea style={{ ...inputStyle, minHeight: 80 }} value={String(form.usage || "")} onChange={e => setForm({ ...form, usage: e.target.value })} placeholder="Apply 4-5 drops every morning to freshly cleansed face and neck..." />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Clinical Warnings &amp; Safety Information</label>
              <textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.safetyInfo || "")} onChange={e => setForm({ ...form, safetyInfo: e.target.value })} placeholder="For external dermatological use only. Perform patch test before use..." />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 8: SPECIFICATIONS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "specs" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: 0 }}>
              Technical Specifications ({specs.length} rows)
            </h4>
            <button onClick={addSpec} style={{ padding: "7px 14px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4 }}>+ Add Row</button>
          </div>
          {specs.length > 0 ? specs.map((spec, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} value={spec.name} onChange={e => updateSpec(idx, "name", e.target.value)} placeholder="e.g. Skin Type / pH Level" />
              <input style={inputStyle} value={spec.value} onChange={e => updateSpec(idx, "value", e.target.value)} placeholder="e.g. All Skin Types / pH 3.5" />
              <button onClick={() => removeSpec(idx)} style={{ padding: "4px 10px", border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer", fontSize: 11, borderRadius: 4 }}>✕</button>
            </div>
          )) : (
            <div style={{ padding: 30, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)", borderRadius: 4 }}>
              <p style={{ fontSize: 13, margin: 0 }}>No specifications yet. Click &ldquo;+ Add Row&rdquo; to add product specs.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 9: PHARMA & CLINICAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "pharma" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>💊 Pharmaceutical &amp; Clinical Monograph</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Generic / Salt Name (Optional)</label>
                <input style={inputStyle} value={String(form.genericName || "")} onChange={e => setForm({ ...form, genericName: e.target.value })} placeholder="e.g. Lycopene, Multivitamins & Minerals" />
              </div>
              <div>
                <label style={labelStyle}>Chemical Composition (Optional)</label>
                <input style={inputStyle} value={String(form.composition || "")} onChange={e => setForm({ ...form, composition: e.target.value })} placeholder="Active API percentages" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Strength &amp; Dosage Form</label>
                <input style={inputStyle} value={String(form.strength || form.dosageForm || "")} onChange={e => setForm({ ...form, strength: e.target.value, dosageForm: e.target.value })} placeholder="e.g. 15% w/v / Topical Serum" />
              </div>
              <div>
                <label style={labelStyle}>Pack Size</label>
                <input style={inputStyle} value={String(form.packSize || "")} onChange={e => setForm({ ...form, packSize: e.target.value })} placeholder="e.g. 30 ml Amber Dropper" />
              </div>
              <div>
                <label style={labelStyle}>Manufacturer</label>
                <input style={inputStyle} value={String(form.manufacturer || "")} onChange={e => setForm({ ...form, manufacturer: e.target.value })} placeholder="Licensed Pharmaceutical Lab" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Batch No. (Optional)</label>
                <input style={inputStyle} value={String(form.batchNo || "")} onChange={e => setForm({ ...form, batchNo: e.target.value })} placeholder="e.g. QC-BATCH-2026-08" />
              </div>
              <div>
                <label style={labelStyle}>Expiry Date (Optional)</label>
                <input style={inputStyle} value={String(form.expiryDate || "")} onChange={e => setForm({ ...form, expiryDate: e.target.value })} placeholder="e.g. 2028-09" />
              </div>
              <div>
                <label style={labelStyle}>Storage Conditions</label>
                <input style={inputStyle} value={String(form.storageConditions || "")} onChange={e => setForm({ ...form, storageConditions: e.target.value })} placeholder="Store below 25°C in a dry place" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 10: TAX & GST */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "tax" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>⚖️ GST &amp; Healthcare Taxation Engine</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--purple)" }}>Tax Model Mode</span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.taxInclusive !== false}
                    onChange={e => setForm({ ...form, taxInclusive: e.target.checked })}
                  />
                  Selling Price is GST-Inclusive
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Tax Rule</label>
                  <select
                    style={inputStyle}
                    value={String(form.taxRuleId || "")}
                    onChange={e => {
                      const rId = e.target.value;
                      const matched = taxRules.find(r => r.id === rId);
                      setForm({
                        ...form,
                        taxRuleId: rId,
                        gstRate: matched ? matched.gstRate : form.gstRate,
                        hsnCode: (matched?.hsnCodes?.[0]) || form.hsnCode || "3004",
                      });
                    }}
                  >
                    <option value="">Standard Pharma (12%)</option>
                    {taxRules.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.gstRate}%)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tax Mode</label>
                  <select style={inputStyle} value={String(form.taxMode || "taxable")} onChange={e => setForm({ ...form, taxMode: e.target.value })}>
                    <option value="taxable">Taxable (Standard GST)</option>
                    <option value="exempt">Exempt (0% Healthcare)</option>
                    <option value="zero_rated">Zero-Rated (0%)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>GST Override % (Optional)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="Auto from rule"
                    value={form.gstRate !== undefined ? String(form.gstRate) : ""}
                    onChange={e => setForm({ ...form, gstRate: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>HSN / SAC Code</label>
                  <input style={inputStyle} value={String(form.hsnCode || "3004")} onChange={e => setForm({ ...form, hsnCode: e.target.value })} />
                </div>
              </div>

              {/* Real-time GST Breakdown Preview */}
              {(() => {
                const effRate = form.taxMode === "exempt" || form.taxMode === "zero_rated"
                  ? 0
                  : (form.gstRate !== undefined && form.gstRate !== "" && !isNaN(Number(form.gstRate))
                      ? Number(form.gstRate)
                      : 12);
                const isInc = form.taxInclusive !== false;
                const priceNum = Number(form.price || 0);
                const pTaxable = isInc ? Math.round((priceNum / (1 + effRate / 100)) * 100) / 100 : priceNum;
                const pGst = isInc ? Math.round((priceNum - pTaxable) * 100) / 100 : Math.round((priceNum * (effRate / 100)) * 100) / 100;
                const pCgst = Math.round((pGst / 2) * 100) / 100;
                const pSgst = Math.round((pGst - pCgst) * 100) / 100;
                const pTotal = isInc ? priceNum : Math.round((pTaxable + pGst) * 100) / 100;

                return (
                  <div style={{ background: "#f8f6f9", borderRadius: 4, padding: "10px 14px", border: "1px dashed #cfc3d5", fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <span><strong>Mode:</strong> {isInc ? "GST-Inclusive" : "GST-Exclusive (+ Tax at Checkout)"}</span>
                      <span><strong>Rate:</strong> {effRate}%</span>
                      <span><strong>Base Value:</strong> ₹{pTaxable.toFixed(2)}</span>
                      <span><strong>CGST ({(effRate / 2).toFixed(1)}%):</strong> ₹{pCgst.toFixed(2)}</span>
                      <span><strong>SGST ({(effRate / 2).toFixed(1)}%):</strong> ₹{pSgst.toFixed(2)}</span>
                      <span style={{ color: "var(--purple)", fontWeight: 700 }}>Total: ₹{pTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 11: SHIPPING & COLD CHAIN */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "shipping" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>🚚 Shipping, Weight &amp; Cold-Chain Parameters</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Weight (Grams) (Optional)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.weightGrams ? String(form.weightGrams) : ""}
                  onChange={e => setForm({ ...form, weightGrams: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 150"
                />
              </div>
              <div>
                <label style={labelStyle}>Length (cm)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.dimLength ? String(form.dimLength) : ""}
                  onChange={e => setForm({ ...form, dimLength: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 8"
                />
              </div>
              <div>
                <label style={labelStyle}>Width (cm)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.dimWidth ? String(form.dimWidth) : ""}
                  onChange={e => setForm({ ...form, dimWidth: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label style={labelStyle}>Height (cm)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.dimHeight ? String(form.dimHeight) : ""}
                  onChange={e => setForm({ ...form, dimHeight: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 12"
                />
              </div>
            </div>

            <div style={{ background: "#fff", padding: 14, border: "1px solid var(--line)", borderRadius: 4 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={Boolean(form.coldChainRequired)}
                  onChange={e => setForm({ ...form, coldChainRequired: e.target.checked })}
                />
                ❄️ Cold-Chain Packaging Required (Temperature Controlled Dispatch: 2°C - 8°C)
              </label>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0 24px" }}>
                When enabled, cold-chain thermal packaging alerts will appear on shipping manifest and warehouse dispatch notes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 12: A+ CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "aplus" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          {/* Header & Status */}
          <div style={{ padding: 16, background: "#fff", border: "2px solid " + (aplusPublished ? "#2e7d32" : "var(--line)"), marginBottom: 16, borderRadius: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", margin: 0 }}>A+ Visual Storytelling for:</p>
                <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "4px 0 0" }}>{String(form.name || "Formulation")}</h4>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 4,
                  background: aplusPublished ? "#e9f7e9" : "#fff3cd",
                  color: aplusPublished ? "#2e7d32" : "#8a6d3b",
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em",
                }}>
                  {aplusPublished ? "✅ PUBLISHED" : "⚠️ DRAFT"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setAplusPublished(!aplusPublished);
                  setForm({ ...form, aplusPublished: !aplusPublished });
                  setAplusSavedMsg(!aplusPublished ? "Published! Save Product to persist." : "Draft mode enabled.");
                  setTimeout(() => setAplusSavedMsg(""), 3000);
                }}
                style={{ padding: "7px 14px", background: aplusPublished ? "#b34141" : "#2e7d32", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4 }}
              >
                {aplusPublished ? "🚫 Set to Draft" : "✅ Publish A+ Content"}
              </button>
              {aplusSavedMsg && <span style={{ fontSize: 12, color: "#2e7d32", alignSelf: "center", fontWeight: 600 }}>{aplusSavedMsg}</span>}
            </div>
          </div>

          {/* Template Attachment */}
          <div style={{ padding: 12, background: "#f0f7ff", border: "1px solid #b3d7ff", marginBottom: 16, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#004085" }}>Attach Pre-Built Story Template:</span>
            <div style={{ display: "flex", gap: 6 }}>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                style={{ padding: "6px 8px", fontSize: 12, border: "1px solid #b3d7ff", background: "#fff" }}
              >
                <option value="">-- Choose Template --</option>
                {aplusTemplatesList.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.sections?.length || 0} sections)</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const found = aplusTemplatesList.find(t => t.id === selectedTemplateId);
                  if (found) {
                    setAplusSections(found.sections);
                    setAplusPublished(true);
                    setForm(prev => ({ ...prev, aplusTemplateId: found.id, aplusPublished: true }));
                    setAplusSavedMsg(`Applied "${found.title}". Click Save Product to persist.`);
                  }
                }}
                disabled={!selectedTemplateId}
                style={{ padding: "6px 12px", background: "var(--purple)", color: "#fff", border: "none", fontSize: 12, cursor: selectedTemplateId ? "pointer" : "not-allowed", borderRadius: 4 }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Section Picker */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, padding: 10, background: "#fff", border: "1px solid var(--line)", borderRadius: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", alignSelf: "center", marginRight: 4 }}>ADD:</span>
            {APLUS_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => addAplusSection(t.value)}
                style={{ padding: "5px 10px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, borderRadius: 3 }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Sections List */}
          {aplusSections.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              {aplusSections.map((sec, idx) => {
                const typeConfig = APLUS_TYPES.find(t => t.value === sec.type) || { label: sec.type, icon: "📄" };
                const isExpanded = aplusExpanded === idx;
                return (
                  <div key={idx} style={{ border: "1px solid var(--line)", background: "#fff", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isExpanded ? "#f5f0eb" : "transparent" }}
                      onClick={() => setAplusExpanded(isExpanded ? null : idx)}
                    >
                      <span style={{ fontSize: 12 }}>{typeConfig.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{sec.heading || typeConfig.label}</span>
                      <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => moveAplus(idx, -1)} disabled={idx === 0} style={{ padding: "2px 6px", fontSize: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>▲</button>
                        <button onClick={() => moveAplus(idx, 1)} disabled={idx === aplusSections.length - 1} style={{ padding: "2px 6px", fontSize: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>▼</button>
                        <button onClick={() => removeAplus(idx)} style={{ padding: "2px 6px", fontSize: 10, border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer" }}>✕</button>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: 14, background: "#faf9f7", borderTop: "1px solid var(--line)" }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          <div>
                            <label style={labelStyle}>Section Heading</label>
                            <input style={inputStyle} value={sec.heading || ""} onChange={e => updateAplus(idx, { heading: e.target.value })} placeholder="e.g. Clinical Mechanism" />
                          </div>
                          <div>
                            <label style={labelStyle}>Image or Media URL</label>
                            <input style={inputStyle} value={sec.imageUrl || sec.videoUrl || ""} onChange={e => updateAplus(idx, { imageUrl: e.target.value })} placeholder="https://..." />
                          </div>
                          <div>
                            <label style={labelStyle}>Narrative Text Content</label>
                            <textarea style={{ ...inputStyle, minHeight: 70 }} value={sec.text || ""} onChange={e => updateAplus(idx, { text: e.target.value })} placeholder="Content for this section..." />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)", borderRadius: 4 }}>
              <p style={{ fontSize: 13, margin: 0 }}>No A+ Story sections added yet.</p>
              <p style={{ fontSize: 11, margin: "6px 0 0" }}>Use the section picker above to construct clinical infographics, comparison tables, and banners.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 13: SEO */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "seo" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>🔍 Search Engine Optimization (SEO) &amp; OpenGraph</h4>
          <div style={{ padding: "10px 14px", background: "#f8fafc", border: "1px solid var(--line)", borderRadius: 4, marginBottom: 14 }}>
            <label style={{ ...labelStyle, marginBottom: 2 }}>Canonical Public URL</label>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#1e293b" }}>
              https://queenscare.in/products/{String(form.slug || "")}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)" }}>
              Updating this slug automatically establishes an authoritative 301 redirect and updates Google search canonical tags.
            </p>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Meta Title</label>
              <input style={inputStyle} value={String(form.seoTitle || "")} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder="e.g. Lumine-C 15% Vitamin C Serum | Queens Care Laboratories" />
            </div>
            <div>
              <label style={labelStyle}>Meta Description</label>
              <textarea style={{ ...inputStyle, minHeight: 70 }} value={String(form.seoDescription || "")} onChange={e => setForm({ ...form, seoDescription: e.target.value })} placeholder="Concise 150-160 character description for Google search snippets" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>OpenGraph Social Image URL</label>
                <input style={inputStyle} value={String(form.seoOgImage || "")} onChange={e => setForm({ ...form, seoOgImage: e.target.value })} placeholder="https://... (1200x630 px)" />
              </div>
              <div>
                <label style={labelStyle}>Product Image Alt Text</label>
                <input style={inputStyle} value={String(form.altText || "")} onChange={e => setForm({ ...form, altText: e.target.value })} placeholder="Descriptive alt text for accessibility" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 14: CROSS-SELL & MERCHANDISING */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "cross_sell" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>🎯 Cross-Sell, Upsell &amp; Formulations Bundle</h4>
          <div style={{ display: "grid", gap: 16 }}>
            {/* Frequently Bought Together */}
            <div style={{ background: "#fff", padding: 14, border: "1px solid var(--line)", borderRadius: 4 }}>
              <label style={{ ...labelStyle, fontSize: 13, color: "var(--purple)", marginBottom: 6 }}>
                Frequently Bought Together Formulations
              </label>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 10px" }}>
                Select complementary formulations that customers often combine in their daily protocol.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {allCatalogProducts
                  .filter(p => p.slug !== form.slug)
                  .map(p => {
                    const isSelected = fbtProducts.includes(p.id) || fbtProducts.includes(p.slug);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFbtProducts(fbtProducts.filter(id => id !== p.id && id !== p.slug));
                          } else {
                            setFbtProducts([...fbtProducts, p.slug]);
                          }
                        }}
                        style={{
                          padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                          border: isSelected ? "1px solid var(--purple)" : "1px solid var(--line)",
                          background: isSelected ? "var(--purple)" : "#f8f8f8",
                          color: isSelected ? "#fff" : "var(--foreground)",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {isSelected ? "✓ " : "+ "} {p.name}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Related Formulations */}
            <div style={{ background: "#fff", padding: 14, border: "1px solid var(--line)", borderRadius: 4 }}>
              <label style={{ ...labelStyle, fontSize: 13, color: "var(--purple)", marginBottom: 6 }}>
                Related Formulations in Same Category
              </label>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 10px" }}>
                Curated alternatives and regimen recommendations displayed in the related products carousel.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {allCatalogProducts
                  .filter(p => p.slug !== form.slug)
                  .map(p => {
                    const isSelected = relatedProducts.includes(p.id) || relatedProducts.includes(p.slug);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setRelatedProducts(relatedProducts.filter(id => id !== p.id && id !== p.slug));
                          } else {
                            setRelatedProducts([...relatedProducts, p.slug]);
                          }
                        }}
                        style={{
                          padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                          border: isSelected ? "1px solid var(--purple)" : "1px solid var(--line)",
                          background: isSelected ? "var(--purple)" : "#f8f8f8",
                          color: isSelected ? "#fff" : "var(--foreground)",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {isSelected ? "✓ " : "+ "} {p.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 15: ADVANCED & INTERNAL NOTES */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "advanced" && (
        <div style={{ padding: 22, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 6 }}>
          <h4 style={{ font: "15px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>⚙️ Advanced Settings &amp; Internal Notes</h4>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", background: "#fff", padding: 12, borderRadius: 4, border: "1px solid var(--line)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={Boolean(form.homepageVisible)}
                  onChange={e => setForm({ ...form, homepageVisible: e.target.checked })}
                />
                Feature in Homepage Formulations Showcase
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.visible !== false}
                  onChange={e => setForm({ ...form, visible: e.target.checked })}
                />
                Visible in Catalog Search
              </label>
            </div>

            <div>
              <label style={labelStyle}>Search Keywords &amp; Misspellings (Internal)</label>
              <input
                style={inputStyle}
                value={String(form.searchKeywords || form.tags || "")}
                onChange={e => setForm({ ...form, searchKeywords: e.target.value, tags: e.target.value })}
                placeholder="vit c, l-ascorbic, brightening, serum, dark spots"
              />
            </div>

            <div>
              <label style={labelStyle}>Internal Pharmacist / Admin Notes [Confidential]</label>
              <textarea
                style={{ ...inputStyle, minHeight: 90 }}
                value={String(form.adminNotes || "")}
                onChange={e => setForm({ ...form, adminNotes: e.target.value })}
                placeholder="Internal audit notes, supplier lead times, storage requirements, or QC lot notes..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM SAVE BAR ── */}
      <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
          {images.length} photos · {variants.length} SKU variants · {highlights.length} highlights · {specs.length} specs · {aplusSections.length} A+ sections
        </p>
        <button
          onClick={handleSaveClick}
          disabled={saving}
          style={{ padding: "11px 32px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, borderRadius: 4 }}
        >
          {saving ? "Saving…" : "💾 Save Product"}
        </button>
      </div>

      {/* ── SEO IMPACT CONFIRMATION MODAL ── */}
      {showSeoModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 8, padding: 24, maxWidth: 520, width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <h3 style={{ margin: 0, font: "20px var(--font-display)", color: "#991b1b" }}>
                Confirm Public URL / Slug Change
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, margin: "0 0 16px" }}>
              You are modifying the live public URL for this formulation. Existing backlinks, customer bookmarks, and search engine indices pointing to the previous URL will be affected.
            </p>
            <div style={{ background: "#f8fafc", border: "1px solid var(--line)", borderRadius: 6, padding: 12, marginBottom: 18, fontSize: 12 }}>
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: "#64748B" }}>Current URL:</strong>{" "}
                <code style={{ color: "#dc2626" }}>/products/{String(item.slug)}</code>
              </div>
              <div>
                <strong style={{ color: "#64748B" }}>New URL:</strong>{" "}
                <code style={{ color: "#16a34a" }}>/products/{String(form.slug)}</code>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: 4, margin: "0 0 20px" }}>
              ✓ An authoritative <strong>301 Permanent Redirect</strong> will be automatically registered across all servers to preserve search engine ranking equity and forward existing traffic seamlessly.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowSeoModal(false)}
                style={{ padding: "9px 16px", border: "1px solid var(--line)", background: "#fff", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSeoModal(false);
                  executeSave();
                }}
                style={{ padding: "9px 20px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Confirm &amp; Update URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
