"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import GlobalMediaUploader from "../../components/GlobalMediaUploader";

export type PopupButton = {
  id: string;
  text: string;
  actionType: "link" | "product" | "category" | "blog" | "whatsapp" | "phone" | "email" | "add_to_cart" | "view_product" | "buy_now" | "close";
  url?: string;
  productId?: string;
  productSlug?: string;
  style: "primary" | "secondary" | "outline" | "ghost" | "custom";
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  icon?: string;
  iconPosition?: "left" | "right";
  isFullWidth?: boolean;
};

export type Popup = {
  id: string;
  title: string;
  enabled: boolean;
  visible: boolean;

  placement: string;
  targetProductSlug?: string;
  targetCategorySlug?: string;
  targetBlogSlug?: string;
  targetCustomPath?: string;
  position: string;
  customPositionTop?: string;
  customPositionLeft?: string;
  customPositionBottom?: string;
  customPositionRight?: string;

  sizePreset: "small" | "medium" | "large" | "fullscreen" | "custom";
  width: number;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  mobileWidth?: string;
  mobileHeight?: string;
  padding?: number;
  margin?: number;
  borderRadius: number;

  mediaType: "none" | "image" | "video";
  imageUrl: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
  videoControls?: boolean;
  videoPlayOnClick?: boolean;
  mediaLayout: "above" | "beside_left" | "beside_right" | "below" | "media_only" | "background";
  mediaClickAction?: "none" | "link" | "product" | "whatsapp" | "phone" | "email";
  mediaClickUrl?: string;

  eyebrow?: string;
  heading: string;
  subtitle?: string;
  text: string;
  highlightText?: string;
  bulletList?: string[];
  badgeText?: string;
  divider?: boolean;

  productAware?: boolean;
  productId?: string;
  productSlug?: string;
  showProductPrice?: boolean;
  showProductStock?: boolean;
  showProductImage?: boolean;

  buttons: PopupButton[];
  buttonText?: string;
  buttonUrl?: string;

  trigger: "immediate" | "delay" | "scroll_percentage" | "scroll_element" | "exit_intent" | "click_selector";
  delay: number;
  scrollPercentage?: number;
  scrollElementSelector?: string;
  clickSelector?: string;

  frequency: "every_visit" | "once_per_session" | "once_per_day" | "once_per_x_days" | "once_ever";
  frequencyDays?: number;
  maxImpressions?: number;
  startDate?: string;
  endDate?: string;

  deviceTarget: "all" | "desktop" | "tablet" | "mobile" | "mobile_tablet" | "desktop_tablet";
  desktopOnly?: boolean;

  bgType?: "solid" | "gradient" | "image" | "transparent";
  bgColor?: string;
  bgGradient?: string;
  bgImageUrl?: string;
  textColor?: string;
  headingColor?: string;
  accentColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadowEnabled?: boolean;
  shadowBlur?: number;
  shadowColor?: string;

  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity: number;
  overlayBlur?: number;
  closeOnOverlayClick?: boolean;

  showCloseButton?: boolean;
  closeButtonPosition?: "inside_right" | "inside_left" | "outside_right" | "outside_left";
  closeButtonColor?: string;
  closeButtonBg?: string;
  closeOnEscape?: boolean;

  headingSize?: number;
  bodySize?: number;
  fontAlignment?: "left" | "center" | "right";

  animation: string;
  animationDuration?: number;

  impressions?: number;
  clicks?: number;
  closes?: number;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
};

const defaultPopup: Popup = {
  id: "",
  title: "New Promotional Popup",
  enabled: true,
  visible: true,

  placement: "site-wide",
  targetProductSlug: "",
  targetCategorySlug: "",
  targetBlogSlug: "",
  targetCustomPath: "",
  position: "center",
  customPositionTop: "",
  customPositionLeft: "",
  customPositionBottom: "",
  customPositionRight: "",

  sizePreset: "medium",
  width: 540,
  maxWidth: "",
  height: "",
  maxHeight: "",
  mobileWidth: "94vw",
  mobileHeight: "",
  padding: 28,
  margin: 16,
  borderRadius: 16,

  mediaType: "none",
  imageUrl: "",
  videoUrl: "",
  videoPosterUrl: "",
  videoAutoplay: false,
  videoMuted: true,
  videoLoop: false,
  videoControls: true,
  videoPlayOnClick: false,
  mediaLayout: "above",
  mediaClickAction: "none",
  mediaClickUrl: "",

  eyebrow: "✦ CLINICAL CARE RITUAL",
  heading: "Experience <em>Targeted Efficacy</em>",
  subtitle: "Formulated in pharmaceutical cleanrooms for verified cellular vitality.",
  text: "Receive complimentary express cold-chain delivery and our physician assessment with your initial ritual.",
  highlightText: "FIRSTCARE — 15% OFF YOUR INITIAL DISPENSE",
  bulletList: ["ISO & GMP Certified Formulation", "100% Active Batch Purity", "Physician Monitored Stability"],
  badgeText: "",
  divider: true,

  productAware: false,
  productId: "",
  productSlug: "",
  showProductPrice: true,
  showProductStock: true,
  showProductImage: true,

  buttons: [
    {
      id: "btn-1",
      text: "Explore Collection",
      actionType: "link",
      url: "/#collection",
      style: "primary",
      icon: "arrow",
      iconPosition: "right",
    },
    {
      id: "btn-2",
      text: "Ask A Doctor",
      actionType: "link",
      url: "/doctors",
      style: "outline",
      icon: "phone",
      iconPosition: "left",
    },
  ],

  trigger: "delay",
  delay: 3,
  scrollPercentage: 50,
  scrollElementSelector: "",
  clickSelector: "",

  frequency: "every_visit",
  frequencyDays: 7,
  maxImpressions: 0,
  startDate: "",
  endDate: "",

  deviceTarget: "all",
  desktopOnly: false,

  bgType: "solid",
  bgColor: "#FFFFFF",
  bgGradient: "",
  bgImageUrl: "",
  textColor: "#1F1A24",
  headingColor: "#2A0F3A",
  accentColor: "#C5A880",
  borderColor: "rgba(42, 15, 58, 0.08)",
  borderWidth: 1,
  shadowEnabled: true,
  shadowBlur: 48,
  shadowColor: "rgba(0,0,0,0.22)",

  overlayEnabled: true,
  overlayColor: "rgba(0,0,0,0.6)",
  overlayOpacity: 0.55,
  overlayBlur: 4,
  closeOnOverlayClick: true,

  showCloseButton: true,
  closeButtonPosition: "inside_right",
  closeButtonColor: "rgba(0,0,0,0.6)",
  closeButtonBg: "rgba(0,0,0,0.06)",
  closeOnEscape: true,

  headingSize: 24,
  bodySize: 14,
  fontAlignment: "left",

  animation: "scale",
  animationDuration: 0.35,

  impressions: 0,
  clicks: 0,
  closes: 0,
  sort: 0,
};

// 12 Templates
const POPUP_TEMPLATES: Array<{ name: string; icon: string; description: string; data: Partial<Popup> }> = [
  {
    name: "Welcome Concierge Offer",
    icon: "✨",
    description: "First-order discount code with clinical benefits and instant copy",
    data: {
      title: "Welcome Offer (15% Off)",
      placement: "homepage",
      eyebrow: "WELCOME TO QUEENS CARE",
      heading: "Begin Your <em>Clinical Care Routine</em>",
      subtitle: "Experience purity verified by high-precision liquid chromatography.",
      text: "Enjoy complimentary delivery and 15% off your first clinical order.",
      highlightText: "CARE15 — 15% OFF FIRST RITUAL",
      bulletList: ["Free cold-chain shipping", "Dermatologist verified formulation", "Full batch certificate included"],
      buttons: [
        { id: "b1", text: "Explore Formulations", actionType: "link", url: "/#collection", style: "primary", icon: "arrow" },
      ],
      trigger: "delay",
      delay: 2,
      frequency: "once_per_session",
    },
  },
  {
    name: "LUMINE-C Product Spotlight",
    icon: "🌟",
    description: "Product-aware popup with direct Add to Care Bag and live price",
    data: {
      title: "LUMINE-C Clinical Spotlight",
      placement: "site-wide",
      productAware: true,
      productSlug: "lumine-c",
      eyebrow: "✦ BIO-IDENTICAL STABILIZATION",
      heading: "LUMINE-C <em>Dual-Action Radiance</em>",
      subtitle: "15% Ethylated L-Ascorbic Acid + Ferulic Acid Complex.",
      text: "Neutralizes oxidative stress and visibly evens tone within 14 clinical days.",
      buttons: [
        { id: "b1", text: "Add To Care Bag", actionType: "add_to_cart", productSlug: "lumine-c", style: "primary", icon: "cart" },
        { id: "b2", text: "Clinical Study Details", actionType: "view_product", productSlug: "lumine-c", style: "outline" },
      ],
      trigger: "delay",
      delay: 3,
    },
  },
  {
    name: "Liko-Q 200ml Suspension Launch",
    icon: "🧪",
    description: "New pharmaceutical formulation spotlight with amber visual",
    data: {
      title: "Liko-Q Suspension Launch",
      placement: "product",
      productAware: true,
      productSlug: "liko-q-suspension",
      mediaType: "image",
      imageUrl: "/uploads/liko-q-suspension.png",
      mediaLayout: "beside_left",
      eyebrow: "NEW PHARMACEUTICAL RELEASE",
      heading: "Liko-Q <em>Oral Suspension</em>",
      subtitle: "Bio-enhanced Lycopene, CoQ10, L-Carnitine & Zinc 200ml.",
      text: "Precision oral liquid formulation for micro-vascular integrity and cellular energy synthesis.",
      buttons: [
        { id: "b1", text: "Dispense Now", actionType: "add_to_cart", productSlug: "liko-q-suspension", style: "primary", icon: "cart" },
        { id: "b2", text: "View Monograph", actionType: "view_product", productSlug: "liko-q-suspension", style: "outline" },
      ],
      trigger: "scroll_percentage",
      scrollPercentage: 35,
    },
  },
  {
    name: "VIP Clinical Newsletter",
    icon: "✉️",
    description: "Curated research briefings and formulation release notices",
    data: {
      title: "Clinical Newsletter Concierge",
      placement: "blog",
      eyebrow: "THE FORMULATION JOURNAL",
      heading: "Evidence-Based <em>Dermatology Notes</em>",
      subtitle: "Published bi-weekly by Queens Care research fellows.",
      text: "Receive peer-reviewed skincare insights, cleanroom updates, and priority access to limited batch releases.",
      buttons: [
        { id: "b1", text: "Join Registry", actionType: "link", url: "/contact", style: "primary", icon: "arrow" },
      ],
      trigger: "scroll_percentage",
      scrollPercentage: 60,
      frequency: "once_per_x_days",
      frequencyDays: 14,
    },
  },
  {
    name: "Exit Intent Consultation",
    icon: "🚪",
    description: "Engages desktop visitors moving to close or leave the tab",
    data: {
      title: "Exit Intent Consultation",
      placement: "site-wide",
      eyebrow: "BEFORE YOU DEPART",
      heading: "Have Questions About <em>Your Skin Biology?</em>",
      subtitle: "Our clinical pharmacologists and doctors are online.",
      text: "Unsure which active concentration suits your barrier profile? Receive an individualized regimen recommendation.",
      buttons: [
        { id: "b1", text: "WhatsApp Doctor", actionType: "whatsapp", url: "919820011223", style: "primary", icon: "whatsapp" },
        { id: "b2", text: "Book Virtual Consult", actionType: "link", url: "/doctors", style: "outline" },
      ],
      trigger: "exit_intent",
      frequency: "once_per_session",
    },
  },
  {
    name: "Cold-Chain Express Delivery Notice",
    icon: "❄️",
    description: "Temperature-controlled distribution assurance notice",
    data: {
      title: "Cold-Chain Delivery Notice",
      placement: "shop",
      eyebrow: "LOGISTICS VERIFICATION",
      heading: "Complimentary <em>Cold-Chain Packaging</em>",
      subtitle: "Active enzymes and stabilized antioxidants protected in transit.",
      text: "All orders above ₹999 are dispatched in thermal insulated cartons with batch temperature logging.",
      buttons: [
        { id: "b1", text: "Continue To Dispense", actionType: "close", style: "primary" },
      ],
      trigger: "delay",
      delay: 4,
      position: "bottom-right",
      width: 420,
      frequency: "once_per_day",
    },
  },
  {
    name: "Clinical Video Cleanroom Tour",
    icon: "🎥",
    description: "High-definition cleanroom and laboratory verification video",
    data: {
      title: "Laboratory Cleanroom Video",
      placement: "science",
      mediaType: "video",
      videoUrl: "",
      mediaLayout: "above",
      eyebrow: "RESEARCH & DEVELOPMENT",
      heading: "Inside the <em>Queens Care Cleanroom</em>",
      subtitle: "ISO Class 5 environment with HEPA laminar airflow filtration.",
      text: "Watch our scientific directors synthesize antioxidant suspensions under strict atmosphere monitoring.",
      buttons: [
        { id: "b1", text: "Explore Formulation Principles", actionType: "link", url: "/about", style: "primary" },
      ],
      trigger: "delay",
      delay: 2,
    },
  },
  {
    name: "Doctor & Specialist Referral",
    icon: "🩺",
    description: "Direct invitation for certified medical practitioners",
    data: {
      title: "Doctor Panel Enrollment",
      placement: "doctors",
      eyebrow: "MEDICAL AFFAIRS PANEL",
      heading: "Partner with <em>Queens Care Laboratories</em>",
      subtitle: "Prescription-grade clinical support for dermatologists & GPs.",
      text: "Join 450+ verified specialists with complimentary sample allotments, monographs, and patient dispatch support.",
      buttons: [
        { id: "b1", text: "Submit Medical Credentials", actionType: "link", url: "/doctors", style: "primary" },
      ],
      trigger: "delay",
      delay: 2,
    },
  },
  {
    name: "Festival Care Ritual Gift Box",
    icon: "🎁",
    description: "Seasonal promotional box with gold accents",
    data: {
      title: "Festive Ritual Collection",
      placement: "homepage",
      eyebrow: "LIMITED SEASONAL BATCH",
      heading: "The <em>Queens Care Grand Ritual</em>",
      subtitle: "4-step clinical routine packaged in bespoke purple linen box.",
      text: "Includes Liko-Q, Lumine-C, Hydration Emulsion, and hand-turned brass dosing measure.",
      highlightText: "FESTIVE — COMPLIMENTARY BRASS DOSING CUP",
      buttons: [
        { id: "b1", text: "View Gift Collection", actionType: "link", url: "/#collection", style: "primary", icon: "arrow" },
      ],
      trigger: "delay",
      delay: 3,
    },
  },
  {
    name: "Diagnostic Routine Builder",
    icon: "📋",
    description: "Interactive skin assessment to recommend correct formulations",
    data: {
      title: "Diagnostic Routine Builder",
      placement: "homepage",
      eyebrow: "60-SECOND CLINICAL ASSESSMENT",
      heading: "Find Your <em>Formulation Matrix</em>",
      subtitle: "Calibrated to barrier lipid condition, UV exposure & urban climate.",
      text: "Answer four fundamental questions to pinpoint your active serum concentrations.",
      buttons: [
        { id: "b1", text: "Begin Skin Assessment", actionType: "link", url: "/recommendations", style: "primary", icon: "arrow" },
      ],
      trigger: "delay",
      delay: 5,
    },
  },
  {
    name: "Minimal Corner Bulletin",
    icon: "📌",
    description: "Non-intrusive bottom-left notification card",
    data: {
      title: "Laboratory Update Notice",
      placement: "site-wide",
      position: "bottom-left",
      width: 380,
      eyebrow: "ANNOUNCEMENT",
      heading: "New <em>ISO Batch Released</em>",
      text: "Batch #QC-2026-09 analytical certificates are now verified and available on all product pages.",
      buttons: [
        { id: "b1", text: "Dismiss", actionType: "close", style: "ghost" },
        { id: "b2", text: "Inspect Lab Data", actionType: "link", url: "/about", style: "primary" },
      ],
      trigger: "delay",
      delay: 4,
      overlayEnabled: false,
    },
  },
  {
    name: "B2B Distribution Bulk Orders",
    icon: "🏢",
    description: "Wholesale pharmacy and healthcare chain portal CTA",
    data: {
      title: "B2B Commercial Distribution",
      placement: "b2b",
      eyebrow: "COMMERCIAL SUPPLY CHAIN",
      heading: "Authorized <em>Hospital & Pharmacy Supply</em>",
      subtitle: "Direct laboratory invoicing with volume discount structures.",
      text: "Access wholesale tier pricing, scheduled pallet replenishment, and dedicated account management.",
      buttons: [
        { id: "b1", text: "Commercial Application", actionType: "link", url: "/b2b", style: "primary" },
      ],
      trigger: "delay",
      delay: 2,
    },
  },
];

export default function PopupManagementPanel() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; slug: string; price?: number }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Load popups, products, and categories
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [popupsRes, productsRes, categoriesRes] = await Promise.all([
        fetch("/api/popups?admin=true"),
        fetch("/api/products?all=true"),
        fetch("/api/admin/categories").catch(() => null),
      ]);

      if (popupsRes.ok) {
        const d = await popupsRes.json();
        setPopups(d.popups || []);
      }
      if (productsRes.ok) {
        const pd = await productsRes.json();
        setProducts(pd.products || []);
      }
      if (categoriesRes && categoriesRes.ok) {
        const cd = await categoriesRes.json();
        setCategories(cd.categories || []);
      }
    } catch {
      setMessage("Failed to load popups or catalog.");
      setIsError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save popup (create or update)
  const save = async (popup: Partial<Popup>) => {
    try {
      const method = popup.id ? "PATCH" : "POST";
      const res = await fetch("/api/popups", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(popup),
      });

      if (!res.ok) throw new Error("Save failed");
      setMessage(popup.id ? "Popup updated successfully." : "Popup created and published.");
      setIsError(false);
      setShowForm(false);
      setEditing(null);
      loadData();
    } catch {
      setMessage("Failed to save popup.");
      setIsError(true);
    }
  };

  // Toggle active status
  const toggleEnabled = async (popup: Popup) => {
    await save({ id: popup.id, enabled: !popup.enabled, visible: !popup.enabled });
  };

  // 1-Click duplicate
  const duplicate = async (popup: Popup) => {
    const clone = {
      ...popup,
      id: undefined,
      title: `${popup.title} (Copy)`,
      enabled: false,
      visible: false,
      impressions: 0,
      clicks: 0,
      closes: 0,
    };
    await save(clone);
  };

  // Delete popup
  const deletePopup = async (id: string) => {
    try {
      const res = await fetch("/api/popups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setMessage("Popup deleted.");
      setIsError(false);
      setDeletingId(null);
      loadData();
    } catch {
      setMessage("Failed to delete popup.");
      setIsError(true);
    }
  };

  // Filtered popups list
  const filteredPopups = useMemo(() => {
    return popups.filter((p) => {
      if (statusFilter === "active" && !p.enabled) return false;
      if (statusFilter === "inactive" && p.enabled) return false;
      if (placementFilter !== "all" && p.placement !== placementFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchTitle = (p.title || "").toLowerCase().includes(q);
        const matchHeading = (p.heading || "").toLowerCase().includes(q);
        const matchText = (p.text || "").toLowerCase().includes(q);
        if (!matchTitle && !matchHeading && !matchText) return false;
      }
      return true;
    });
  }, [popups, statusFilter, placementFilter, searchFilter]);

  // Aggregate stats
  const totalImpressions = popups.reduce((sum, p) => sum + (Number(p.impressions) || 0), 0);
  const totalClicks = popups.reduce((sum, p) => sum + (Number(p.clicks) || 0), 0);
  const activeCount = popups.filter((p) => p.enabled).length;

  return (
    <div>
      {/* Top Header & Analytics Strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--purple, #2A0F3A)", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🪟</span> Site Popups & Modal Campaigns
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted, #666)" }}>
            Professional responsive modal builder with video, product CTAs, exit-intent triggers, and granular placement rules.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Template dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                const modal = document.getElementById("qc-templates-modal");
                if (modal) modal.style.display = modal.style.display === "none" ? "block" : "none";
              }}
              style={{
                padding: "8px 14px",
                background: "#FAF9F7",
                border: "1px solid var(--line, #E5E0D8)",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--purple, #2A0F3A)",
              }}
            >
              <span>✨</span> Use Template ▾
            </button>

            {/* Templates Selector Dropdown Modal */}
            <div
              id="qc-templates-modal"
              style={{
                display: "none",
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 6,
                width: 360,
                maxHeight: 480,
                overflowY: "auto",
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
                border: "1px solid var(--line, #E5E0D8)",
                zIndex: 100,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple, #2A0F3A)", paddingBottom: 8, borderBottom: "1px solid #f0ede8", marginBottom: 8 }}>
                Select a Queens Care Template:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {POPUP_TEMPLATES.map((tmpl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setEditing({ ...defaultPopup, ...tmpl.data } as Popup);
                      setShowForm(true);
                      const el = document.getElementById("qc-templates-modal");
                      if (el) el.style.display = "none";
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: "#faf9f7",
                      cursor: "pointer",
                      border: "1px solid transparent",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--purple, #2A0F3A)";
                      e.currentTarget.style.background = "#f4eff7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.background = "#faf9f7";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--purple, #2A0F3A)" }}>
                      <span>{tmpl.icon}</span> {tmpl.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted, #666)", marginTop: 2 }}>
                      {tmpl.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setEditing({ ...defaultPopup } as Popup);
              setShowForm(true);
            }}
            style={{
              padding: "8px 18px",
              background: "var(--purple, #2A0F3A)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>+</span> Create Custom Popup
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div style={{ padding: "10px 14px", background: "#fff", border: "1px solid var(--line, #E5E0D8)", borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Popups</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--purple, #2A0F3A)", marginTop: 2 }}>{popups.length}</div>
        </div>
        <div style={{ padding: "10px 14px", background: "#fff", border: "1px solid var(--line, #E5E0D8)", borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Active Popups</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#2e7d32", marginTop: 2 }}>{activeCount}</div>
        </div>
        <div style={{ padding: "10px 14px", background: "#fff", border: "1px solid var(--line, #E5E0D8)", borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Impressions</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink, #1F1A24)", marginTop: 2 }}>{totalImpressions.toLocaleString()}</div>
        </div>
        <div style={{ padding: "10px 14px", background: "#fff", border: "1px solid var(--line, #E5E0D8)", borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total CTA Clicks</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink, #1F1A24)", marginTop: 2 }}>{totalClicks.toLocaleString()}</div>
        </div>
        <div style={{ padding: "10px 14px", background: "#fff", border: "1px solid var(--line, #E5E0D8)", borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Avg Conversion (CTR)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#C5A880", marginTop: 2 }}>
            {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search by title, heading, or copy…"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "8px 12px",
            border: "1px solid var(--line, #E5E0D8)",
            borderRadius: 4,
            fontSize: 12,
            background: "#fff",
          }}
        />

        <div style={{ display: "flex", gap: 4, background: "#FAF9F7", padding: 2, borderRadius: 4, border: "1px solid var(--line, #E5E0D8)" }}>
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                background: statusFilter === s ? "#fff" : "transparent",
                color: statusFilter === s ? "var(--purple, #2A0F3A)" : "var(--muted, #666)",
                boxShadow: statusFilter === s ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={placementFilter}
          onChange={(e) => setPlacementFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--line, #E5E0D8)",
            borderRadius: 4,
            fontSize: 12,
            background: "#fff",
            color: "var(--ink)",
          }}
        >
          <option value="all">All Placements</option>
          <option value="site-wide">Site-wide</option>
          <option value="homepage">Homepage</option>
          <option value="shop">Shop</option>
          <option value="product">Product Pages</option>
          <option value="specific_product">Specific Product</option>
          <option value="category">Category</option>
          <option value="blog">Blog</option>
          <option value="about">About Page</option>
          <option value="science">Science Page</option>
          <option value="contact">Contact</option>
          <option value="b2b">B2B Portal</option>
          <option value="doctors">Doctors Portal</option>
          <option value="custom">Custom Path</option>
        </select>
      </div>

      {message && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 4,
            marginBottom: 14,
            fontSize: 12,
            background: isError ? "#fce4ec" : "#e8f5e9",
            color: isError ? "#c62828" : "#2e7d32",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{message}</span>
          <button onClick={() => setMessage("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "inherit" }}>×</button>
        </div>
      )}

      {/* Popup Form (Drawer / Inline Editor) */}
      {showForm && editing && (
        <PopupFormModal
          popup={editing}
          products={products}
          categories={categories}
          onSave={save}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {/* Popups Table List */}
      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 13, padding: "20px 0" }}>Loading popups…</p>
      ) : filteredPopups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "#faf9f7", borderRadius: 8, border: "1px solid var(--line, #E5E0D8)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🪟</div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", color: "var(--purple, #2A0F3A)" }}>No Popups Found</p>
          <p style={{ fontSize: 12, color: "var(--muted)", maxWidth: 460, margin: "0 auto 16px" }}>
            Create an announcement, product highlight, or newsletter modal to engage prospective clients and clinic visitors.
          </p>
          <button
            onClick={() => {
              setEditing({ ...defaultPopup } as Popup);
              setShowForm(true);
            }}
            style={{
              padding: "8px 18px",
              background: "var(--purple, #2A0F3A)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Create Your First Popup
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredPopups.map((p) => {
            const hasMedia = p.mediaType !== "none" && Boolean(p.imageUrl || p.videoUrl);
            const ctr = p.impressions && p.impressions > 0 ? ((Number(p.clicks || 0) / p.impressions) * 100).toFixed(1) : "0.0";

            return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr auto",
                  gap: 14,
                  padding: "14px 16px",
                  background: "#fff",
                  border: "1px solid var(--line, #E5E0D8)",
                  borderRadius: 8,
                  alignItems: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                {/* Media thumbnail / icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    background: "#f4f1ea",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {p.mediaType === "image" && p.imageUrl ? (
                    <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : p.mediaType === "video" ? (
                    <span style={{ fontSize: 18 }}>🎥</span>
                  ) : (
                    <span style={{ fontSize: 18 }}>🪟</span>
                  )}
                </div>

                {/* Details */}
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    <strong style={{ fontSize: 14, color: "var(--purple, #2A0F3A)" }}>{p.title || "Untitled"}</strong>

                    {/* Status Badge */}
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: p.enabled ? "#e8f5e9" : "#f5f5f5",
                        color: p.enabled ? "#2e7d32" : "#999",
                      }}
                    >
                      {p.enabled ? "● Active" : "○ Inactive"}
                    </span>

                    {/* Placement Badge */}
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        background: "#f0ede8",
                        color: "var(--ink)",
                      }}
                    >
                      📍 {p.placement}
                      {p.placement === "specific_product" && p.targetProductSlug ? `: ${p.targetProductSlug}` : ""}
                    </span>

                    {/* Trigger Badge */}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      ⚡ {p.trigger}{p.trigger === "delay" ? ` (${p.delay}s)` : p.trigger === "scroll_percentage" ? ` (${p.scrollPercentage}%)` : ""}
                    </span>

                    {/* Device Badge */}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      📱 {p.deviceTarget || "all"}
                    </span>
                  </div>

                  {/* Heading & Subtitle preview */}
                  {p.heading && (
                    <div
                      dangerouslySetInnerHTML={{ __html: p.heading }}
                      style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}
                    />
                  )}

                  {/* Analytics line */}
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    <span>👁️ <b>{p.impressions || 0}</b> views</span>
                    <span>👆 <b>{p.clicks || 0}</b> clicks</span>
                    <span>🎯 <b>{ctr}%</b> CTR</span>
                    {p.startDate && <span>📅 From {p.startDate.slice(0, 10)}</span>}
                    {p.endDate && <span>⏳ To {p.endDate.slice(0, 10)}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={() => toggleEnabled(p)}
                    style={{
                      padding: "5px 10px",
                      border: "1px solid var(--line, #E5E0D8)",
                      background: p.enabled ? "#fff5f5" : "#f0fff0",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 4,
                      color: p.enabled ? "#c62828" : "#2e7d32",
                    }}
                  >
                    {p.enabled ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => {
                      setPreviewPopup(p);
                    }}
                    style={{
                      padding: "5px 10px",
                      border: "1px solid var(--line, #E5E0D8)",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 4,
                    }}
                  >
                    👁️ Preview
                  </button>

                  <button
                    onClick={() => duplicate(p)}
                    style={{
                      padding: "5px 10px",
                      border: "1px solid var(--line, #E5E0D8)",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 4,
                    }}
                  >
                    Copy
                  </button>

                  <button
                    onClick={() => {
                      setEditing(p);
                      setShowForm(true);
                    }}
                    style={{
                      padding: "5px 12px",
                      border: "1px solid var(--purple, #2A0F3A)",
                      background: "var(--purple, #2A0F3A)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 4,
                    }}
                  >
                    Edit
                  </button>

                  {deletingId === p.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => deletePopup(p.id)}
                        style={{ padding: "5px 10px", background: "#c62828", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, borderRadius: 4, fontWeight: 700 }}
                      >
                        Confirm Del
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{ padding: "5px 8px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 11, borderRadius: 4 }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(p.id)}
                      style={{ padding: "5px 8px", border: "1px solid #ffcdd2", background: "#fff", cursor: "pointer", fontSize: 11, borderRadius: 4, color: "#c62828" }}
                    >
                      Del
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standalone Preview Modal */}
      {previewPopup && (
        <PreviewModal popup={previewPopup} onClose={() => setPreviewPopup(null)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// POPUP FORM MODAL (TABBED BUILDER + LIVE PREVIEW)
// ═══════════════════════════════════════════════════════════════

function PopupFormModal({
  popup,
  products,
  categories,
  onSave,
  onCancel,
}: {
  popup: Popup;
  products: Array<{ id: string; name: string; slug: string; price?: number }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  onSave: (p: Partial<Popup>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Popup>({ ...popup });
  const [activeTab, setActiveTab] = useState<"placement" | "media" | "content" | "product" | "buttons" | "triggers" | "styling">("placement");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [newBullet, setNewBullet] = useState("");

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    display: "block",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: ".06em",
    color: "var(--purple, #2A0F3A)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--line, #E5E0D8)",
    borderRadius: 4,
    fontSize: 13,
    boxSizing: "border-box",
    background: "#fff",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    background: "#fff",
  };

  // Add / remove button helper
  const addButton = () => {
    const newBtn: PopupButton = {
      id: "btn-" + Date.now(),
      text: "New Action",
      actionType: "link",
      url: "/#collection",
      style: "primary",
      icon: "arrow",
    };
    setForm({ ...form, buttons: [...(form.buttons || []), newBtn] });
  };

  const updateButton = (index: number, patch: Partial<PopupButton>) => {
    const list = [...(form.buttons || [])];
    list[index] = { ...list[index], ...patch };
    setForm({ ...form, buttons: list });
  };

  const removeButton = (index: number) => {
    const list = [...(form.buttons || [])];
    list.splice(index, 1);
    setForm({ ...form, buttons: list });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "95vw",
          maxWidth: 1320,
          height: "92vh",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 24px",
            borderBottom: "1px solid var(--line, #E5E0D8)",
            background: "#FAF9F7",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--purple, #2A0F3A)" }}>
              {popup.id ? `Edit Popup: ${form.title}` : "New Popup Builder"}
            </h3>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: form.enabled ? "#2e7d32" : "#999", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked, visible: e.target.checked })}
              />
              {form.enabled ? "Active" : "Inactive"}
            </label>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Device preview toggles */}
            <div style={{ display: "flex", background: "#f0ede8", borderRadius: 4, padding: 2 }}>
              <button
                onClick={() => setPreviewDevice("desktop")}
                style={{
                  padding: "4px 10px",
                  border: "none",
                  background: previewDevice === "desktop" ? "#fff" : "transparent",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--purple, #2A0F3A)",
                }}
              >
                🖥️ Desktop
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                style={{
                  padding: "4px 10px",
                  border: "none",
                  background: previewDevice === "tablet" ? "#fff" : "transparent",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--purple, #2A0F3A)",
                }}
              >
                📱 Tablet
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                style={{
                  padding: "4px 10px",
                  border: "none",
                  background: previewDevice === "mobile" ? "#fff" : "transparent",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--purple, #2A0F3A)",
                }}
              >
                📱 Mobile
              </button>
            </div>

            <button
              onClick={onCancel}
              style={{ padding: "8px 16px", border: "1px solid var(--line, #E5E0D8)", background: "#fff", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              style={{
                padding: "8px 22px",
                background: "var(--purple, #2A0F3A)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              💾 Save & Publish
            </button>
          </div>
        </div>

        {/* Modal Split Body: Left Editor / Right Live Preview */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", overflow: "hidden" }}>
          {/* Left Column: Tabs & Inputs */}
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--line, #E5E0D8)", overflow: "hidden" }}>
            {/* Tab Navigation */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                borderBottom: "1px solid var(--line, #E5E0D8)",
                background: "#faf9f7",
              }}
            >
              {[
                { id: "placement", label: "📍 Placement" },
                { id: "media", label: "🖼️ Media" },
                { id: "content", label: "✍️ Content" },
                { id: "product", label: "🛍️ Product Aware" },
                { id: "buttons", label: "🔘 Buttons & CTAs" },
                { id: "triggers", label: "⚡ Triggers & Rules" },
                { id: "styling", label: "🎨 Design & Styling" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as never)}
                  style={{
                    padding: "10px 14px",
                    border: "none",
                    borderBottom: activeTab === tab.id ? "2px solid var(--purple, #2A0F3A)" : "2px solid transparent",
                    background: activeTab === tab.id ? "#fff" : "transparent",
                    color: activeTab === tab.id ? "var(--purple, #2A0F3A)" : "var(--muted, #666)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Form Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {/* TAB 1: PLACEMENT & SIZING */}
              {activeTab === "placement" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Internal Title</label>
                    <input
                      style={inputStyle}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Lumine-C Special Promotion"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Placement Route</label>
                      <select
                        style={selectStyle}
                        value={form.placement}
                        onChange={(e) => setForm({ ...form, placement: e.target.value })}
                      >
                        <option value="site-wide">Site-wide (All Public Pages)</option>
                        <option value="homepage">Homepage Only (/)</option>
                        <option value="shop">Shop Page (/shop)</option>
                        <option value="product">All Product Pages (/products/*)</option>
                        <option value="specific_product">Specific Product Only</option>
                        <option value="category">Category Pages (/categories/*)</option>
                        <option value="blog">All Blog Articles (/blog/*)</option>
                        <option value="specific_blog">Specific Blog Article</option>
                        <option value="about">Our Story / About (/about)</option>
                        <option value="science">Our Science (/science)</option>
                        <option value="contact">Contact Page (/contact)</option>
                        <option value="account">Account Page (/account)</option>
                        <option value="b2b">B2B Portal (/b2b)</option>
                        <option value="doctors">Doctors Portal (/doctors)</option>
                        <option value="affiliate">Affiliate / Partners (/affiliate)</option>
                        <option value="employee">Employee Directory (/employee/*)</option>
                        <option value="custom">Custom URL Path / Slug</option>
                      </select>
                    </div>

                    {/* Conditional Target Inputs */}
                    {form.placement === "specific_product" && (
                      <div>
                        <label style={labelStyle}>Select Target Product</label>
                        <select
                          style={selectStyle}
                          value={form.targetProductSlug || ""}
                          onChange={(e) => setForm({ ...form, targetProductSlug: e.target.value, productSlug: e.target.value })}
                        >
                          <option value="">-- Choose Catalog Product --</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.slug}>
                              {prod.name} ({prod.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {form.placement === "category" && (
                      <div>
                        <label style={labelStyle}>Select Target Category</label>
                        <select
                          style={selectStyle}
                          value={form.targetCategorySlug || ""}
                          onChange={(e) => setForm({ ...form, targetCategorySlug: e.target.value })}
                        >
                          <option value="">-- Choose Category --</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {form.placement === "specific_blog" && (
                      <div>
                        <label style={labelStyle}>Article Slug</label>
                        <input
                          style={inputStyle}
                          value={form.targetBlogSlug || ""}
                          onChange={(e) => setForm({ ...form, targetBlogSlug: e.target.value })}
                          placeholder="e.g. molecular-antioxidant-mechanisms"
                        />
                      </div>
                    )}

                    {form.placement === "custom" && (
                      <div>
                        <label style={labelStyle}>Custom URL Path</label>
                        <input
                          style={inputStyle}
                          value={form.targetCustomPath || ""}
                          onChange={(e) => setForm({ ...form, targetCustomPath: e.target.value })}
                          placeholder="e.g. /quality-assurance"
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Position on Page</label>
                      <select
                        style={selectStyle}
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                      >
                        <option value="center">Center Modal</option>
                        <option value="top">Top Bar / Header</option>
                        <option value="bottom">Bottom Bar</option>
                        <option value="top-left">Top-Left Corner</option>
                        <option value="top-right">Top-Right Corner</option>
                        <option value="bottom-left">Bottom-Left Corner</option>
                        <option value="bottom-right">Bottom-Right Corner</option>
                        <option value="custom">Custom Position Coordinates</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Size Preset</label>
                      <select
                        style={selectStyle}
                        value={form.sizePreset}
                        onChange={(e) => {
                          const v = e.target.value as never;
                          let w = 540;
                          if (v === "small") w = 400;
                          else if (v === "medium") w = 560;
                          else if (v === "large") w = 760;
                          else if (v === "fullscreen") w = 1100;
                          setForm({ ...form, sizePreset: v, width: w });
                        }}
                      >
                        <option value="small">Small (400px compact)</option>
                        <option value="medium">Medium (560px standard)</option>
                        <option value="large">Large (760px wide)</option>
                        <option value="fullscreen">Fullscreen / Takeover</option>
                        <option value="custom">Custom Dimensions</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Width (px)</label>
                      <input
                        type="number"
                        min="280"
                        max="1400"
                        style={inputStyle}
                        value={form.width}
                        onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) || 520 })}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Border Radius (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        style={inputStyle}
                        value={form.borderRadius}
                        onChange={(e) => setForm({ ...form, borderRadius: parseInt(e.target.value) || 16 })}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Inner Padding (px)</label>
                      <input
                        type="number"
                        min="12"
                        max="60"
                        style={inputStyle}
                        value={form.padding || 28}
                        onChange={(e) => setForm({ ...form, padding: parseInt(e.target.value) || 28 })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEDIA (IMAGE & VIDEO) */}
              {activeTab === "media" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Media Type</label>
                      <select
                        style={selectStyle}
                        value={form.mediaType}
                        onChange={(e) => setForm({ ...form, mediaType: e.target.value as never })}
                      >
                        <option value="none">No Media (Text Card Only)</option>
                        <option value="image">Image (JPG, PNG, WebP, SVG)</option>
                        <option value="video">Video (MP4, WebM, YouTube, Vimeo)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Media Layout</label>
                      <select
                        style={selectStyle}
                        value={form.mediaLayout}
                        onChange={(e) => setForm({ ...form, mediaLayout: e.target.value as never })}
                      >
                        <option value="above">Media Above Content (Stacked)</option>
                        <option value="beside_left">Media Left, Content Right (Split)</option>
                        <option value="beside_right">Content Left, Media Right (Split)</option>
                        <option value="below">Media Below Content</option>
                        <option value="media_only">Media Only (Pure Visual Modal)</option>
                      </select>
                    </div>
                  </div>

                  {/* Centralized Media Uploader */}
                  {form.mediaType === "image" && (
                    <GlobalMediaUploader
                      label="Popup Image (Upload, Media Library, or URL)"
                      value={form.imageUrl}
                      allowVideo={false}
                      onChange={(val: any) => {
                        const url = typeof val === "string" ? val : Array.isArray(val) ? (typeof val[0] === "string" ? val[0] : val[0]?.url || "") : "";
                        setForm({ ...form, imageUrl: url });
                      }}
                    />
                  )}

                  {form.mediaType === "video" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <GlobalMediaUploader
                        label="Popup Video (Upload MP4/WebM, Media Library, or YouTube/Vimeo URL)"
                        value={form.videoUrl}
                        allowVideo={true}
                        onChange={(val: any) => {
                          const url = typeof val === "string" ? val : Array.isArray(val) ? (typeof val[0] === "string" ? val[0] : val[0]?.url || "") : "";
                          setForm({ ...form, videoUrl: url });
                        }}
                      />

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={labelStyle}>Video Poster / Thumbnail Image URL</label>
                          <input
                            style={inputStyle}
                            value={form.videoPosterUrl || ""}
                            onChange={(e) => setForm({ ...form, videoPosterUrl: e.target.value })}
                            placeholder="/images/poster.jpg"
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={form.videoAutoplay}
                              onChange={(e) => setForm({ ...form, videoAutoplay: e.target.checked })}
                            />
                            Autoplay Video (Muted)
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={form.videoLoop}
                              onChange={(e) => setForm({ ...form, videoLoop: e.target.checked })}
                            />
                            Loop Video
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clickable Media Settings */}
                  {form.mediaType !== "none" && (
                    <div style={{ padding: 12, background: "#faf9f7", borderRadius: 6, border: "1px solid var(--line)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple, #2A0F3A)", marginBottom: 8 }}>
                        Clickable Media Action
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={labelStyle}>Action On Media Click</label>
                          <select
                            style={selectStyle}
                            value={form.mediaClickAction || "none"}
                            onChange={(e) => setForm({ ...form, mediaClickAction: e.target.value as never })}
                          >
                            <option value="none">No Action (Display only)</option>
                            <option value="link">Navigate to URL / Page</option>
                            <option value="product">Open Product Details</option>
                            <option value="whatsapp">Open WhatsApp Chat</option>
                            <option value="phone">Call Phone Number</option>
                            <option value="email">Send Email</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Target URL / Number</label>
                          <input
                            style={inputStyle}
                            value={form.mediaClickUrl || ""}
                            onChange={(e) => setForm({ ...form, mediaClickUrl: e.target.value })}
                            placeholder="/#collection or +91..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CONTENT BUILDER */}
              {activeTab === "content" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Eyebrow Tag / Small Label</label>
                    <input
                      style={inputStyle}
                      value={form.eyebrow || ""}
                      onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
                      placeholder="e.g. ✦ CLINICAL ANNOUNCEMENT"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Main Heading (Supports &lt;em&gt; for italics)</label>
                    <input
                      style={inputStyle}
                      value={form.heading}
                      onChange={(e) => setForm({ ...form, heading: e.target.value })}
                      placeholder="e.g. Targeted <em>Cellular Vitality</em>"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Subtitle</label>
                    <input
                      style={inputStyle}
                      value={form.subtitle || ""}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="e.g. Formulated in pharmaceutical cleanrooms"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Body Copy</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: 70 }}
                      value={form.text}
                      onChange={(e) => setForm({ ...form, text: e.target.value })}
                      placeholder="Enter detailed narrative or promo notice…"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Highlight Callout / Coupon Code</label>
                    <input
                      style={inputStyle}
                      value={form.highlightText || ""}
                      onChange={(e) => setForm({ ...form, highlightText: e.target.value })}
                      placeholder="e.g. QUEENS20 — 20% OFF FIRST RITUAL"
                    />
                  </div>

                  {/* Bullet Points */}
                  <div>
                    <label style={labelStyle}>Clinical Benefits / Bullet Points</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input
                        style={inputStyle}
                        placeholder="Add benefit bullet..."
                        value={newBullet}
                        onChange={(e) => setNewBullet(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newBullet.trim()) {
                            e.preventDefault();
                            setForm({ ...form, bulletList: [...(form.bulletList || []), newBullet.trim()] });
                            setNewBullet("");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newBullet.trim()) {
                            setForm({ ...form, bulletList: [...(form.bulletList || []), newBullet.trim()] });
                            setNewBullet("");
                          }
                        }}
                        style={{ padding: "6px 14px", background: "var(--purple, #2A0F3A)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                      >
                        + Add
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {(form.bulletList || []).map((bullet, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "#FAF9F7", borderRadius: 4, fontSize: 12 }}>
                          <span>✓ {bullet}</span>
                          <button
                            onClick={() => {
                              const list = [...(form.bulletList || [])];
                              list.splice(idx, 1);
                              setForm({ ...form, bulletList: list });
                            }}
                            style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer", fontSize: 13 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.divider}
                        onChange={(e) => setForm({ ...form, divider: e.target.checked })}
                      />
                      Show Elegant Divider Line
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: PRODUCT AWARE */}
              {activeTab === "product" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ padding: 12, background: "#faf9f7", borderRadius: 8, border: "1px solid var(--line)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--purple, #2A0F3A)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.productAware}
                        onChange={(e) => setForm({ ...form, productAware: e.target.checked })}
                      />
                      Enable Live Product Integration
                    </label>
                    <p style={{ margin: "4px 0 0 24px", fontSize: 11, color: "var(--muted)" }}>
                      Automatically binds actual catalog details (live MRP, discounted price, stock inventory, and formulation photography) to this popup.
                    </p>
                  </div>

                  {form.productAware && (
                    <>
                      <div>
                        <label style={labelStyle}>Select Catalog Product</label>
                        <select
                          style={selectStyle}
                          value={form.productSlug || ""}
                          onChange={(e) => {
                            const slug = e.target.value;
                            const prod = products.find((p) => p.slug === slug);
                            setForm({
                              ...form,
                              productSlug: slug,
                              productId: prod?.id || "",
                            });
                          }}
                        >
                          <option value="">-- Choose Real Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.slug}>
                              {p.name} {p.price ? `(₹${p.price.toLocaleString()})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={form.showProductImage !== false}
                            onChange={(e) => setForm({ ...form, showProductImage: e.target.checked })}
                          />
                          Show Product Photo
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={form.showProductPrice !== false}
                            onChange={(e) => setForm({ ...form, showProductPrice: e.target.checked })}
                          />
                          Show Price & MRP
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={form.showProductStock !== false}
                            onChange={(e) => setForm({ ...form, showProductStock: e.target.checked })}
                          />
                          Show Dispense Status
                        </label>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 5: BUTTONS & CTAS */}
              {activeTab === "buttons" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={labelStyle}>Action Buttons</label>
                    <button
                      onClick={addButton}
                      style={{ padding: "4px 10px", background: "var(--purple, #2A0F3A)", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      + Add Button
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(form.buttons || []).map((btn, idx) => (
                      <div
                        key={btn.id || idx}
                        style={{
                          padding: 12,
                          background: "#FAF9F7",
                          border: "1px solid var(--line, #E5E0D8)",
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: 12, color: "var(--purple, #2A0F3A)" }}>Button #{idx + 1}</strong>
                          <button
                            onClick={() => removeButton(idx)}
                            style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                          >
                            Remove
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Label Text</label>
                            <input
                              style={inputStyle}
                              value={btn.text}
                              onChange={(e) => updateButton(idx, { text: e.target.value })}
                              placeholder="Button Label"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Action Type</label>
                            <select
                              style={selectStyle}
                              value={btn.actionType}
                              onChange={(e) => updateButton(idx, { actionType: e.target.value as never })}
                            >
                              <option value="link">Navigate URL / Internal Page</option>
                              <option value="add_to_cart">Add To Care Bag (Direct)</option>
                              <option value="buy_now">Buy Now (Add & Checkout)</option>
                              <option value="view_product">View Product Page</option>
                              <option value="category">Browse Category</option>
                              <option value="blog">Read Blog Article</option>
                              <option value="whatsapp">WhatsApp Message</option>
                              <option value="phone">Dial Phone Call</option>
                              <option value="email">Compose Email</option>
                              <option value="close">Dismiss / Close Popup</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Target Link / Slug</label>
                            <input
                              style={inputStyle}
                              value={btn.url || ""}
                              onChange={(e) => updateButton(idx, { url: e.target.value })}
                              placeholder="/shop or https://..."
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Styling Preset</label>
                            <select
                              style={selectStyle}
                              value={btn.style}
                              onChange={(e) => updateButton(idx, { style: e.target.value as never })}
                            >
                              <option value="primary">Primary (Purple Fill)</option>
                              <option value="secondary">Secondary (Gold Fill)</option>
                              <option value="outline">Outline (Purple Border)</option>
                              <option value="ghost">Ghost (Text Link)</option>
                              <option value="custom">Custom Color Palette</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Icon</label>
                            <select
                              style={selectStyle}
                              value={btn.icon || "none"}
                              onChange={(e) => updateButton(idx, { icon: e.target.value })}
                            >
                              <option value="none">No Icon</option>
                              <option value="arrow">Arrow (→)</option>
                              <option value="cart">Care Bag (🛍️)</option>
                              <option value="whatsapp">WhatsApp (💬)</option>
                              <option value="phone">Phone (📞)</option>
                              <option value="star">Star (✦)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: TRIGGERS & SCHEDULING */}
              {activeTab === "triggers" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Trigger Condition</label>
                      <select
                        style={selectStyle}
                        value={form.trigger}
                        onChange={(e) => setForm({ ...form, trigger: e.target.value as never })}
                      >
                        <option value="delay">Time Delay (Seconds)</option>
                        <option value="immediate">Immediately on Page Load</option>
                        <option value="exit_intent">Exit Intent (Mouse Leaves Viewport)</option>
                        <option value="scroll_percentage">Scroll Percentage Down Page</option>
                        <option value="scroll_element">Scroll to CSS Element / Section</option>
                        <option value="click_selector">Click on Custom Element</option>
                      </select>
                    </div>

                    {form.trigger === "delay" && (
                      <div>
                        <label style={labelStyle}>Delay (Seconds)</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          style={inputStyle}
                          value={form.delay}
                          onChange={(e) => setForm({ ...form, delay: parseInt(e.target.value) || 3 })}
                        />
                      </div>
                    )}

                    {form.trigger === "scroll_percentage" && (
                      <div>
                        <label style={labelStyle}>Scroll Threshold (%)</label>
                        <input
                          type="number"
                          min="10"
                          max="95"
                          style={inputStyle}
                          value={form.scrollPercentage || 50}
                          onChange={(e) => setForm({ ...form, scrollPercentage: parseInt(e.target.value) || 50 })}
                        />
                      </div>
                    )}

                    {form.trigger === "scroll_element" && (
                      <div>
                        <label style={labelStyle}>CSS Element Selector</label>
                        <input
                          style={inputStyle}
                          value={form.scrollElementSelector || ""}
                          onChange={(e) => setForm({ ...form, scrollElementSelector: e.target.value })}
                          placeholder="#collection or .product-grid"
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Frequency / Display Capping</label>
                      <select
                        style={selectStyle}
                        value={form.frequency}
                        onChange={(e) => setForm({ ...form, frequency: e.target.value as never })}
                      >
                        <option value="every_visit">Every Visit / Page Refresh</option>
                        <option value="once_per_session">Once Per Browser Session</option>
                        <option value="once_per_day">Once Per 24 Hours</option>
                        <option value="once_per_x_days">Once Every X Days</option>
                        <option value="once_ever">Once Ever (Permanent Dismissal)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Device Targeting</label>
                      <select
                        style={selectStyle}
                        value={form.deviceTarget}
                        onChange={(e) => setForm({ ...form, deviceTarget: e.target.value as never })}
                      >
                        <option value="all">All Devices (Desktop + Tablet + Mobile)</option>
                        <option value="desktop">Desktop Only (≥ 1024px)</option>
                        <option value="mobile">Mobile Only (&lt; 768px)</option>
                        <option value="tablet">Tablet Only (768px – 1023px)</option>
                        <option value="mobile_tablet">Mobile & Tablet (&lt; 1024px)</option>
                        <option value="desktop_tablet">Desktop & Tablet (≥ 768px)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Campaign Start Date (Optional)</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={form.startDate ? form.startDate.slice(0, 10) : ""}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Campaign End Date (Optional)</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={form.endDate ? form.endDate.slice(0, 10) : ""}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: STYLING & DESIGN */}
              {activeTab === "styling" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Background Color</label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="color"
                          value={form.bgColor || "#FFFFFF"}
                          onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                          style={{ width: 36, height: 36, padding: 0, border: "none", cursor: "pointer", borderRadius: 4 }}
                        />
                        <input
                          style={inputStyle}
                          value={form.bgColor || "#FFFFFF"}
                          onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Heading Color</label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="color"
                          value={form.headingColor || "#2A0F3A"}
                          onChange={(e) => setForm({ ...form, headingColor: e.target.value })}
                          style={{ width: 36, height: 36, padding: 0, border: "none", cursor: "pointer", borderRadius: 4 }}
                        />
                        <input
                          style={inputStyle}
                          value={form.headingColor || "#2A0F3A"}
                          onChange={(e) => setForm({ ...form, headingColor: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Accent Color</label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="color"
                          value={form.accentColor || "#C5A880"}
                          onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                          style={{ width: 36, height: 36, padding: 0, border: "none", cursor: "pointer", borderRadius: 4 }}
                        />
                        <input
                          style={inputStyle}
                          value={form.accentColor || "#C5A880"}
                          onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Animation Style</label>
                      <select
                        style={selectStyle}
                        value={form.animation}
                        onChange={(e) => setForm({ ...form, animation: e.target.value })}
                      >
                        <option value="scale">Subtle Scale / Pop</option>
                        <option value="fade">Smooth Fade</option>
                        <option value="slide-up">Slide Up From Bottom</option>
                        <option value="slide-down">Slide Down From Top</option>
                        <option value="slide-right">Slide In From Left</option>
                        <option value="zoom">Zoom Focus</option>
                        <option value="none">No Animation</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Overlay Opacity</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        style={inputStyle}
                        value={form.overlayOpacity}
                        onChange={(e) => setForm({ ...form, overlayOpacity: parseFloat(e.target.value) || 0.55 })}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Backdrop Blur (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        style={inputStyle}
                        value={form.overlayBlur || 4}
                        onChange={(e) => setForm({ ...form, overlayBlur: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.closeOnOverlayClick !== false}
                        onChange={(e) => setForm({ ...form, closeOnOverlayClick: e.target.checked })}
                      />
                      Close on Backdrop Click
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.closeOnEscape !== false}
                        onChange={(e) => setForm({ ...form, closeOnEscape: e.target.checked })}
                      />
                      Close on Escape Key
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Live Preview */}
          <div
            style={{
              background: "#1E1822",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#C5A880", textTransform: "uppercase", marginBottom: 12 }}>
              Live Modal Preview ({previewDevice.toUpperCase()})
            </div>

            <div
              style={{
                width: previewDevice === "mobile" ? 360 : previewDevice === "tablet" ? 640 : "100%",
                maxWidth: "100%",
                maxHeight: "82vh",
                overflowY: "auto",
                background: form.bgColor || "#fff",
                color: form.textColor || "#1F1A24",
                borderRadius: form.borderRadius || 16,
                padding: form.padding || 28,
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                position: "relative",
                transition: "width 0.3s ease",
              }}
            >
              {/* Close icon */}
              {form.showCloseButton !== false && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.06)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                  }}
                >
                  ✕
                </div>
              )}

              {/* Media Preview */}
              {form.mediaType === "image" && form.imageUrl && (
                <div style={{ marginBottom: 16, borderRadius: 8, overflow: "hidden" }}>
                  <img src={form.imageUrl} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
                </div>
              )}

              {form.mediaType === "video" && form.videoUrl && (
                <div style={{ marginBottom: 16, padding: "20px 10px", background: "#000", color: "#fff", borderRadius: 8, textAlign: "center", fontSize: 12 }}>
                  🎥 Video Player: {form.videoUrl}
                </div>
              )}

              {/* Content preview */}
              {form.eyebrow && (
                <span style={{ display: "inline-block", padding: "3px 8px", background: "rgba(197, 168, 128, 0.15)", color: form.accentColor || "#C5A880", borderRadius: 100, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", marginBottom: 8 }}>
                  {form.eyebrow}
                </span>
              )}

              <h3
                dangerouslySetInnerHTML={{ __html: form.heading || "Popup Heading" }}
                style={{ margin: "0 0 8px", fontSize: 20, color: form.headingColor || "#2A0F3A", fontFamily: "Georgia, serif" }}
              />

              {form.subtitle && <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: form.accentColor || "#C5A880" }}>{form.subtitle}</p>}
              {form.text && <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.6, color: form.textColor || "#555" }}>{form.text}</p>}

              {form.highlightText && (
                <div style={{ padding: "8px 12px", background: "rgba(42, 15, 58, 0.04)", border: "1px dashed rgba(197, 168, 128, 0.6)", borderRadius: 6, marginBottom: 14, fontSize: 11, fontWeight: 700, color: "var(--purple, #2A0F3A)" }}>
                  {form.highlightText}
                </div>
              )}

              {/* Buttons preview */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {(form.buttons || []).map((btn, i) => (
                  <button
                    key={i}
                    style={{
                      padding: "9px 18px",
                      background: btn.style === "secondary" ? "#C5A880" : btn.style === "outline" ? "transparent" : "var(--purple, #2A0F3A)",
                      color: btn.style === "outline" ? "var(--purple, #2A0F3A)" : "#fff",
                      border: btn.style === "outline" ? "1px solid var(--purple, #2A0F3A)" : "none",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                      cursor: "default",
                    }}
                  >
                    {btn.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STANDALONE PREVIEW MODAL
// ═══════════════════════════════════════════════════════════════

function PreviewModal({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: `min(${popup.width || 540}px, 92vw)`,
          maxHeight: "85vh",
          overflowY: "auto",
          background: popup.bgColor || "#fff",
          color: popup.textColor || "#1F1A24",
          borderRadius: popup.borderRadius || 16,
          padding: popup.padding || 28,
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.06)",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {popup.mediaType === "image" && popup.imageUrl && (
          <img src={popup.imageUrl} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 8, marginBottom: 16 }} />
        )}

        {popup.eyebrow && (
          <span style={{ display: "inline-block", padding: "4px 10px", background: "rgba(197, 168, 128, 0.15)", color: popup.accentColor || "#C5A880", borderRadius: 100, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", marginBottom: 8 }}>
            {popup.eyebrow}
          </span>
        )}

        <h3
          dangerouslySetInnerHTML={{ __html: popup.heading }}
          style={{ margin: "0 0 10px", fontSize: popup.headingSize || 22, color: popup.headingColor || "#2A0F3A", fontFamily: "Georgia, serif" }}
        />

        {popup.subtitle && <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: popup.accentColor || "#C5A880" }}>{popup.subtitle}</p>}
        {popup.text && <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6, color: popup.textColor || "#555" }}>{popup.text}</p>}

        {popup.highlightText && (
          <div style={{ padding: "8px 12px", background: "rgba(42, 15, 58, 0.04)", border: "1px dashed rgba(197, 168, 128, 0.6)", borderRadius: 6, marginBottom: 16, fontSize: 12, fontWeight: 700, color: "var(--purple, #2A0F3A)" }}>
            {popup.highlightText}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {(popup.buttons || []).map((btn, i) => (
            <button
              key={i}
              style={{
                padding: "10px 20px",
                background: btn.style === "secondary" ? "#C5A880" : btn.style === "outline" ? "transparent" : "var(--purple, #2A0F3A)",
                color: btn.style === "outline" ? "var(--purple, #2A0F3A)" : "#fff",
                border: btn.style === "outline" ? "1px solid var(--purple, #2A0F3A)" : "none",
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {btn.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
