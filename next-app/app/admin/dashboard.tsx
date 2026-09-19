"use client";

import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import BrandLogo from "../components/BrandLogo";
import DashboardPanel from "./components/DashboardPanel";
import OrderManager from "./components/OrderManager";
import { BannerEditForm, TestimonialEditForm, OfferEditForm, SettingsEditForm, ReviewEditForm, DoctorEditForm } from "./ContentEditForms";
import { CategoryEditForm, CouponEditForm, FAQEditForm, AffiliateEditForm, WithdrawalsSection } from "./components/EditForms";
import { Badge, Table, req, ENDPOINTS } from "./components/shared";
import type { Tab } from "./components/shared";

function PanelSkeleton() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ height: 32, width: "25%", background: "#F1F5F9", borderRadius: 6 }} />
      <div style={{ height: 90, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div style={{ height: 80, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <div style={{ height: 80, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <div style={{ height: 80, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }} />
      </div>
      <div style={{ height: 240, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }} />
    </div>
  );
}

// ─── CODE-SPLIT LAZY PANELS (Loaded on-demand for instant navigation) ───
const BlogEditForm = lazy(() => import("./BlogEditForm"));
const ProductEditFormAdvanced = lazy(() => import("./ProductEditFormAdvanced").then((m) => ({ default: m.ProductEditFormAdvanced })));
const HomepageSectionEdit = lazy(() => import("./HomepageSectionEdit"));
const MarketingPanel = lazy(() => import("./MarketingPanel"));
const LogoManager = lazy(() => import("./LogoManager"));
const LoginExperiencePanel = lazy(() => import("./LoginExperiencePanel"));
const MediaLibrary = lazy(() => import("./MediaLibrary"));
const Model3DLibraryManager = lazy(() => import("./Model3DLibraryManager"));
const PaymentGatewayManager = lazy(() => import("./PaymentGatewayManager"));
const ShippingManager = lazy(() => import("./ShippingManager"));
const APlusManager = lazy(() => import("./APlusManager"));
const InventoryManager = lazy(() => import("./InventoryManager"));
const EmployeeEditFormAdvanced = lazy(() => import("./EmployeeEditFormAdvanced"));
const OurPeopleCMSManager = lazy(() => import("./OurPeopleCMSManager"));
const PushNotificationPanel = lazy(() => import("./PushNotificationPanel"));
const PageManagement = lazy(() => import("./PageManagement"));
const RedirectManagementPanel = lazy(() => import("./RedirectManagementPanel"));
const SocialMediaLinksManager = lazy(() => import("./SocialMediaLinksManager"));
const CareerApplicationsManager = lazy(() => import("./CareerApplicationsManager"));
const CareersCMSManager = lazy(() => import("./CareersCMSManager"));
const OTPSettingsPanel = lazy(() => import("./OTPSettingsPanel"));
const NotificationSettingsPanel = lazy(() => import("./NotificationSettingsPanel"));
const DataCenterExportPanel = lazy(() => import("./DataCenterExportPanel"));
const B2BManagement = lazy(() => import("./B2BManagement"));
const StoreLocatorManagement = lazy(() => import("./StoreLocatorManagement"));
const FooterBuilder = lazy(() => import("./FooterBuilder"));
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard"));
const BillingSettingsPanel = lazy(() => import("./BillingSettingsPanel"));
const AnalyticsSettingsPanel = lazy(() => import("./AnalyticsSettingsPanel"));
const InvoiceDesigner = lazy(() => import("./InvoiceDesigner"));
const TaxManagementPanel = lazy(() => import("./TaxManagementPanel").then((m) => ({ default: m.TaxManagementPanel })));
const BulkProductOperationsPanel = lazy(() => import("./BulkProductOperationsPanel"));
const PopupManagementPanel = lazy(() => import("./components/PopupManagementPanel"));
const CustomerManager = lazy(() => import("./components/CustomerManager"));
const StaffManagementPanel = lazy(() => import("./components/StaffManagementPanel"));
const AuditLogPanel = lazy(() => import("./components/AuditLogPanel"));
const MaintenanceCenter = lazy(() => import("./MaintenanceCenter"));
const SetupChecklistPanel = lazy(() => import("./SetupChecklistPanel"));
const EmployeeOperationsPortal = lazy(() => import("./EmployeeOperationsPortal"));
const EmailManagerPanel = lazy(() => import("./EmailManagerPanel"));
const IntegrationsManagerPanel = lazy(() => import("./IntegrationsManagerPanel"));
const UniversalMerchandisingPanel = lazy(() => import("./UniversalMerchandisingPanel"));
const WhatsAppSettingsPanel = lazy(() => import("./components/WhatsAppSettingsPanel"));
const AdminSupportInbox = lazy(() => import("./components/AdminSupportInbox"));
const AdminSupportSettings = lazy(() => import("./components/AdminSupportSettings"));
const AdminTicketCenter = lazy(() => import("./components/AdminTicketCenter"));
const SupportReportsPanel = lazy(() => import("./components/SupportReportsPanel"));
const TicketConfigPanel = lazy(() => import("./components/TicketConfigPanel"));



export default function AdminDashboard({
  currentUser,
  initialTab,
}: {
  currentUser?: { name?: string; role?: string; email?: string };
  initialTab?: Tab;
} = {}) {
  const [tab, setTab] = useState<Tab>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("tab") as Tab | null;
      if (t) return t;
    }
    return currentUser?.role === "employee" ? "operations" : "dashboard";
  });
  const [tabSearchQuery, setTabSearchQuery] = useState("");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);
  const [showFooterEditor, setShowFooterEditor] = useState(false);
  const [showBulkOps, setShowBulkOps] = useState(false);

  // Client-side in-memory tab data cache for 0ms navigation
  const tabCache = useRef<Record<string, unknown>>({});

  const doRefresh = useCallback(async () => {
    const url = ENDPOINTS[tab];
    if (!url) return;
    try {
      setLoading(true);
      const d = await req(url);
      if (d) {
        tabCache.current[tab] = d;
        setData(d);
      }
    } catch {
      setMessage("Failed to load data.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  // Tab switching with URL history push and state update
  const selectTab = useCallback((newTab: Tab) => {
    setTab(newTab);
    setEditingItem(null);
    setMessage("");
    setIsError(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== newTab) {
        url.searchParams.set("tab", newTab);
        window.history.pushState(null, "", url.toString());
      }
    }
  }, []);

  // Hover prefetching for instant tab open
  const prefetchTab = useCallback((tabKey: string) => {
    const url = ENDPOINTS[tabKey as Tab];
    if (url && !tabCache.current[tabKey]) {
      req(url).then((d) => {
        if (d) tabCache.current[tabKey] = d;
      }).catch(() => {});
    }
  }, []);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("tab") as Tab | null;
      if (t) setTab(t);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Stale-while-revalidate data loading on tab change
  useEffect(() => {
    let cancelled = false;
    const url = ENDPOINTS[tab];
    if (!url) {
      setLoading(false);
      return;
    }

    // If already in cache, serve immediately!
    if (tabCache.current[tab]) {
      setData(tabCache.current[tab] as Record<string, unknown>);
      setLoading(false);
      // Revalidate in background silently
      req(url).then((d) => {
        if (!cancelled && d) {
          tabCache.current[tab] = d;
          setData(d);
        }
      }).catch(() => {});
      return;
    }

    // If not in cache, fetch and populate
    (async () => {
      try {
        setLoading(true);
        const d = await req(url);
        if (!cancelled && d) {
          tabCache.current[tab] = d;
          setData(d);
        }
      } catch {
        if (!cancelled) {
          setMessage("Failed to load data.");
          setIsError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tab]);

  const handleDelete = async (endpoint: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const r = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setIsError(false);
        setMessage("Deleted successfully.");
        doRefresh();
      } else {
        setIsError(true);
        setMessage(d.error || "Failed to delete.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error during delete.");
    }
  };

  const handleStatusUpdate = async (endpoint: string, id: string, status: string) => {
    try {
      const res = await fetch(`${endpoint}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMessage(`Status updated to ${status}.`);
        doRefresh();
      } else {
        setIsError(true);
        setMessage(d.error || "Failed to update status.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error.");
    }
  };

  interface TabItem {
    id: Tab;
    label: string;
    icon: string;
    badge?: string;
  }

  interface TabGroup {
    groupName: string;
    items: TabItem[];
  }

  const TAB_GROUPS: TabGroup[] = [
    {
      groupName: "Executive & Setup",
      items: [
        { id: "dashboard", label: "Executive Dashboard", icon: "📊" },
        { id: "operations", label: "Operations Command", icon: "⚡", badge: "Live" },
        { id: "setup-checklist", label: "Setup Checklist", icon: "✅" },
        { id: "maintenance", label: "Website Health", icon: "🩺" },
      ],
    },
    {
      groupName: "Orders & Fulfillment",
      items: [
        { id: "orders", label: "Orders & Slips", icon: "📦" },
        { id: "shipping", label: "Shipping & Couriers", icon: "🚚" },
        { id: "customers", label: "Customer Accounts", icon: "👥" },
      ],
    },
    {
      groupName: "Customer Care & Support",
      items: [
        { id: "support-inbox", label: "Chat Support Inbox", icon: "💬", badge: "Live" },
        { id: "support-tickets", label: "Support Tickets", icon: "🎫" },
        { id: "support-reports", label: "Support Reports", icon: "📊" },
        { id: "support-settings", label: "Support Settings", icon: "⚙️" },
        { id: "ticket-config", label: "Ticket Configuration", icon: "🧾" },
      ],
    },
    {
      groupName: "Catalog & Content",
      items: [
        { id: "products", label: "Products Catalog", icon: "🏷️" },
        { id: "inventory", label: "Inventory Center", icon: "📦", badge: "Live" },
        { id: "aplus", label: "A+ Clinical Content", icon: "✨" },
        { id: "categories", label: "Categories", icon: "📁" },
        { id: "reviews", label: "Verified Reviews", icon: "⭐" },
      ],
    },
    {
      groupName: "Storefront & Visual CMS",
      items: [
        { id: "merchandising", label: "Merchandising & Tickers", icon: "✨", badge: "Universal" },
        { id: "homepage", label: "Homepage Builder", icon: "🏠" },
        { id: "footer-builder", label: "Footer Builder", icon: "🦶", badge: "CMS" },
        { id: "banners", label: "Promotional Banners", icon: "🎯" },
        { id: "popups", label: "Storefront Popups", icon: "🪟" },
        { id: "pages", label: "Custom Pages", icon: "📑" },
        { id: "redirects", label: "URL & 301 Redirects", icon: "🔀", badge: "SEO" },
        { id: "blog", label: "Health & Care Blog", icon: "📝" },
        { id: "faq", label: "Clinical FAQs", icon: "❓" },
        { id: "testimonials", label: "Testimonials", icon: "💬" },
        { id: "media", label: "Media Library", icon: "🖼️" },
        { id: "models3d", label: "3D Product Models", icon: "💎" },
        { id: "social-links", label: "Social Media Links", icon: "🔗" },
        { id: "whatsapp", label: "WhatsApp Desk", icon: "💬", badge: "Live" },
      ],
    },
    {
      groupName: "Finance & Regulatory",
      items: [
        { id: "billing", label: "Billing & Regulatory", icon: "💰" },
        { id: "tax-rules", label: "Tax & GST Rules", icon: "⚖️" },
        { id: "invoice-designer", label: "Invoice Designer", icon: "📄" },
        { id: "payments", label: "Payment Gateways", icon: "💳" },
        { id: "coupons", label: "Coupons & Discounts", icon: "🎫" },
      ],
    },
    {
      groupName: "Growth, Doctors & B2B",
      items: [
        { id: "doctors", label: "Doctors & Clinics", icon: "⚕️" },
        { id: "b2b", label: "B2B Enquiries", icon: "🏢" },
        { id: "affiliates", label: "Affiliate Partners", icon: "🤝" },
        { id: "marketing", label: "Marketing Campaigns", icon: "📣" },
        { id: "analytics", label: "Analytics & CRO", icon: "📈" },
        { id: "analytics-tracking", label: "Analytics & Tracking", icon: "🎯" },
        { id: "push", label: "Push Notifications", icon: "📱" },
        { id: "stores", label: "Store Locator", icon: "📍" },
      ],
    },
    {
      groupName: "Platform, Staff & Security",
      items: [
        { id: "employees", label: "Employee Directory", icon: "👤" },
        { id: "staff", label: "Staff & Role Access", icon: "🛡️" },
        { id: "careers", label: "Careers CMS", icon: "💼" },
        { id: "career-applications", label: "Applications", icon: "📁" },
        { id: "integrations", label: "Integrations Control", icon: "🔌" },
        { id: "otp-security", label: "OTP & Security", icon: "🔐" },
        { id: "notifications-matrix", label: "Order Notifications", icon: "🔔" },
        { id: "email-templates", label: "Email Notifications", icon: "✉️" },
        { id: "data-export", label: "Data Export & Backup", icon: "💾" },
        { id: "audit-log", label: "Audit Log", icon: "📜" },
        { id: "settings", label: "System Settings", icon: "⚙️" },
      ],
    },
  ];

  const ALL_TABS: TabItem[] = TAB_GROUPS.flatMap(g => g.items);

  const filteredGroups = TAB_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(item => {
      if (!tabSearchQuery.trim()) return true;
      const q = tabSearchQuery.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        g.groupName.toLowerCase().includes(q)
      );
    }),
  })).filter(g => g.items.length > 0);

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

  return (
    <main className="portal" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 0, minHeight: "100vh" }}>
      <nav style={{ background: "var(--purple)", color: "#fff", padding: "20px 0 0", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ padding: "0 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ marginBottom: 10 }}><BrandLogo inverse showText overrideHeight={30} overrideMobileHeight={22} overrideMaxWidth={135} /></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 11, color: "#d7cddd", margin: 0, letterSpacing: "0.02em" }}>Business OS</p>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 4,
                background: currentUser?.role === "employee" ? "#0284c7" : "var(--gold)",
                color: currentUser?.role === "employee" ? "#fff" : "#180524",
                letterSpacing: "0.06em",
              }}
            >
              {currentUser?.role || "Admin"}
            </span>
          </div>
        </div>

        {/* Tab Search Filter */}
        <div style={{ padding: "12px 14px 6px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={tabSearchQuery}
              onChange={(e) => setTabSearchQuery(e.target.value)}
              placeholder="Search sections…"
              style={{
                width: "100%",
                padding: "6px 24px 6px 26px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: 4,
                color: "#fff",
                fontSize: 11,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, opacity: 0.6, pointerEvents: "none" }}>🔍</span>
            {tabSearchQuery && (
              <button
                onClick={() => setTabSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: 10,
                  cursor: "pointer",
                  padding: 2,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categorized Tab List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {filteredGroups.map(group => (
            <div key={group.groupName} style={{ marginBottom: 12 }}>
              <div
                style={{
                  padding: "4px 18px 4px",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.45)",
                }}
              >
                {group.groupName}
              </div>
              {group.items.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTab(t.id)}
                  onMouseEnter={() => prefetchTab(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "7px 18px",
                    border: "none",
                    background: tab === t.id ? "rgba(255, 255, 255, 0.14)" : "transparent",
                    color: tab === t.id ? "#fff" : "#dfd4e6",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: tab === t.id ? 600 : 400,
                    textAlign: "left",
                    borderLeft: tab === t.id ? "3px solid var(--gold)" : "3px solid transparent",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </span>
                  {t.badge && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: "var(--gold)",
                        color: "#180524",
                        padding: "1px 5px",
                        borderRadius: 3,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <div style={{ padding: "16px 18px", fontSize: 11, color: "rgba(255, 255, 255, 0.5)", textAlign: "center" }}>
              No matching sections found.
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255, 255, 255, 0.12)", fontSize: 11, color: "#a99cab" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: "#fff", fontSize: 11 }}>{currentUser?.name || "Queens Staff"}</span>
            <span style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.5)" }}>v2.4</span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.4)" }}>
            Queens Care Labs © 2026
          </div>
        </div>
      </nav>

      <div style={{ padding: "24px 32px", overflowY: "auto", background: "#fdfcfb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>{ALL_TABS.find(t => t.id === tab)?.icon || "📊"}</span>
              <h2 style={{ margin: 0, font: "26px var(--font-display)", letterSpacing: "-.03em", color: "var(--purple)" }}>
                {editingItem ? `Edit ${editingItem._type || tab}` : ALL_TABS.find(t => t.id === tab)?.label}
              </h2>
            </div>
            {message && (
              <p
                style={{
                  margin: "8px 0 0",
                  padding: "8px 12px",
                  background: isError ? "#fde8e8" : "#e9f7e9",
                  fontSize: 12,
                  color: isError ? "#b34141" : "#2e7d32",
                  border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
                  borderRadius: 4,
                }}
              >
                {message}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                background: "#fff",
                color: "var(--purple)",
                border: "1px solid var(--line)",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span>Storefront</span>
              <span style={{ fontSize: 10 }}>↗</span>
            </a>
            <button
              onClick={() => selectTab("setup-checklist")}
              onMouseEnter={() => prefetchTab("setup-checklist")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                background: tab === "setup-checklist" ? "var(--purple)" : "#fff",
                color: tab === "setup-checklist" ? "#fff" : "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>✅ Setup Guide</span>
            </button>
            <button
              onClick={() => selectTab("maintenance")}
              onMouseEnter={() => prefetchTab("maintenance")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                background: tab === "maintenance" ? "var(--purple)" : "#fff",
                color: tab === "maintenance" ? "#fff" : "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>🩺 Health</span>
            </button>
            {editingItem && (
              <button
                onClick={() => { setEditingItem(null); setMessage(""); setIsError(false); }}
                style={{ padding: "6px 14px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12, borderRadius: 4 }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={doRefresh}
              style={{ padding: "6px 14px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12, borderRadius: 4 }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div
            style={{
              height: 3,
              width: "100%",
              background: "linear-gradient(90deg, var(--purple, #2A0F3A), var(--gold, #D4AF37), var(--purple, #2A0F3A))",
              backgroundSize: "200% 100%",
              borderRadius: 2,
              marginBottom: 12,
            }}
          />
        )}
        <Suspense fallback={<PanelSkeleton />}>
          <>
            {/* ─── DASHBOARD ─── */}
            {tab === "dashboard" && (
              <DashboardPanel data={data} doRefresh={doRefresh} />
            )}

            {/* ─── PRODUCT EDIT FORM ─── */}
            {tab === "products" && editingItem && (
              <ProductEditFormAdvanced item={editingItem} onSave={() => { setEditingItem(null); setMessage("Product saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── PRODUCTS TABLE ─── */}
            {tab === "products" && !editingItem && (
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                  <button onClick={() => setEditingItem({ _type: "product", isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, borderRadius: 4 }}>+ Add Product</button>
                  <button
                    onClick={() => setShowBulkOps(!showBulkOps)}
                    style={{
                      padding: "8px 14px",
                      background: showBulkOps ? "var(--purple)" : "#f8fafc",
                      color: showBulkOps ? "#fff" : "var(--purple)",
                      border: "1px solid var(--purple)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>📊 {showBulkOps ? "Hide Bulk Operations" : "Bulk CSV & Excel Operations"}</span>
                  </button>
                  <a
                    href="/shop"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 14px",
                      background: "#fff",
                      color: "var(--purple)",
                      border: "1px solid var(--purple)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>👁️ View Shop</span>
                    <span>↗</span>
                  </a>
                </div>

                {showBulkOps && (
                  <BulkProductOperationsPanel onRefreshCatalog={doRefresh} />
                )}
                <Table
                  columns={[
                    { key: "name", label: "Product" },
                    { key: "category", label: "Category" },
                    { key: "price", label: "Price", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
                    { key: "stock", label: "Stock", render: (v, row) => <span style={{ color: Number(v) < Number(row.lowStockThreshold || 10) ? "#b34141" : "inherit" }}>{String(v)}</span> },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={(data?.products as Record<string, unknown>[]) || []}
                  onPreview={(row) => window.open(`/products/${row.slug}`, "_blank")}
                  onEdit={(row) => setEditingItem({ ...row, _type: "product" })}
                  onDelete={(row) => {
                    if (confirm("Delete this product?")) {
                      (async () => {
                        try {
                          const res = await fetch(`/api/products/${encodeURIComponent(String(row.slug || row.id))}`, { method: "DELETE" });
                          const d = await res.json().catch(() => ({}));
                          if (res.ok) {
                            setMessage("Product deleted.");
                            setIsError(false);
                            doRefresh();
                          } else {
                            setMessage(d.error || "Failed to delete product.");
                            setIsError(true);
                          }
                        } catch {
                          setMessage("Network error.");
                          setIsError(true);
                        }
                      })();
                    }
                  }}
                />
              </div>
            )}

            {/* ─── INVENTORY CONTROL CENTER ─── */}
            {tab === "inventory" && (
              <InventoryManager />
            )}

            {/* ─── A+ CONTENT MANAGER ─── */}
            {tab === "aplus" && (
              <APlusManager />
            )}

            {/* ─── CATEGORIES TABLE ─── */}
            {tab === "categories" && !editingItem?.categoryEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "category", categoryEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Category</button>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "slug", label: "Slug" },
                    { key: "sort", label: "Sort" },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.categories as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "category", categoryEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/categories", String(row.id))}
                />
              </div>
            )}
            {tab === "categories" && editingItem?.categoryEdit && (
              <CategoryEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Category saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── ORDERS TABLE ─── */}
            {tab === "orders" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["all", "pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled", "rejected", "refunded"].map((s) => (
                      <button key={s} onClick={() => (window as unknown as Record<string, string>).__orderFilter = s} style={{ padding: "4px 10px", fontSize: 11, borderRadius: 3, border: "1px solid var(--line)", background: "#fff", cursor: "pointer", textTransform: "capitalize", fontWeight: 600 }} className="order-filter-btn" data-status={s}>{s}</button>
                    ))}
                  </div>
                  <a href="/api/admin/export?dataset=orders" download style={{ padding: "8px 14px", background: "var(--purple)", color: "#fff", borderRadius: 4, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span>📥 Export Orders CSV</span>
                  </a>
                </div>
                <OrderManager orders={(data?.orders as Record<string, unknown>[]) || []} onUpdate={doRefresh} />
              </div>
            )}

            {/* ─── CUSTOMERS ─── */}
            {tab === "customers" && <CustomerManager />}

            {/* ─── B2B ─── */}
            {tab === "b2b" && <B2BManagement />}

            {/* ─── STORE LOCATOR ─── */}
            {tab === "stores" && <StoreLocatorManagement />}

            {/* ─── CAREERS CMS ─── */}
            {tab === "careers" && (
              <CareersCMSManager />
            )}

            {/* ─── CAREER APPLICATIONS ─── */}
            {tab === "career-applications" && (
              <CareerApplicationsManager />
            )}

            {/* ─── DOCTORS ─── */}
            {tab === "doctors" && !editingItem?.doctorEdit && (
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <button
                    onClick={() => setEditingItem({ _type: "doctor", doctorEdit: true, isNew: true, status: "approved", verified: true, visible: true })}
                    style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}
                  >
                    + Add Doctor / Specialist
                  </button>
                  <a
                    href="/doctors"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 14px",
                      background: "#fff",
                      color: "var(--purple)",
                      border: "1px solid var(--purple)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>👁️ Preview Doctor Portal</span>
                    <span>↗</span>
                  </a>
                </div>
                <Table
                  columns={[
                    { key: "name", label: "Name", render: (v, row) => (
                      <div>
                        <b>{String(v || "—")}</b>
                        {row.qualification ? <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>{String(row.qualification)}</span> : null}
                      </div>
                    )},
                    { key: "regNumber", label: "Medical Reg #", render: (v, row) => String(v || row.councilRegNo || "—") },
                    { key: "specialty", label: "Specialty", render: (v) => String(v || "—") },
                    { key: "clinic", label: "Clinic / Affiliation", render: (v) => String(v || "—") },
                    { key: "verified", label: "Verified", render: (v) => v ? <span style={{ color: "#2e7d32", fontWeight: 700 }}>✓ Verified</span> : <span style={{ color: "var(--muted)" }}>—</span> },
                    { key: "visible", label: "Visible", render: (v) => v !== false ? "✓" : "✗" },
                    { key: "status", label: "Status", render: (v) => <Badge status={String(v)} /> },
                  ]}
                  rows={((data.doctors as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "doctor", doctorEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/doctors", String(row.id))}
                  onStatusChange={(row, s) => { handleStatusUpdate("/api/admin/doctors", String(row.id), s); }}
                />
              </div>
            )}
            {tab === "doctors" && editingItem?.doctorEdit && (
              <DoctorEditForm
                item={editingItem}
                onSave={() => { setEditingItem(null); setMessage("Doctor profile saved."); setIsError(false); doRefresh(); }}
              />
            )}

            {/* ─── EMPLOYEES & OUR PEOPLE CMS ─── */}
            {tab === "employees" && !editingItem?.employeeEdit && (
              <OurPeopleCMSManager
                onEditEmployee={(emp) => setEditingItem({ ...emp, _type: "employee", employeeEdit: true })}
                onAddEmployee={() => setEditingItem({ _type: "employee", employeeEdit: true, isNew: true })}
                onRefresh={() => doRefresh()}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />
            )}
            {tab === "employees" && editingItem?.employeeEdit && (
              <EmployeeEditFormAdvanced
                item={editingItem}
                onSave={() => {
                  setEditingItem(null);
                  setMessage("Employee saved successfully.");
                  setIsError(false);
                  doRefresh();
                }}
                onCancel={() => setEditingItem(null)}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />
            )}

            {/* ─── AFFILIATES ─── */}
            {tab === "affiliates" && !editingItem?.affiliateEdit && (
              <div>
                <h3 style={{ font: "20px var(--font-display)", margin: "0 0 16px" }}>Affiliate Partners</h3>
                <Table
                  columns={[
                    { key: "affiliateCode", label: "Code", render: (v) => <code style={{ fontWeight: 600 }}>{String(v)}</code> },
                    { key: "user", label: "User", render: (v, row) => <span>{String((v as Record<string, unknown>)?.name || (row.user as Record<string, unknown>)?.email || "—")}</span> },
                    { key: "status", label: "Status", render: (v) => <Badge status={String(v)} /> },
                    { key: "commissionRate", label: "Rate", render: (v) => `${Number(v || 10)}%` },
                    { key: "totalSales", label: "Sales", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
                    { key: "totalCommission", label: "Commission", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
                    { key: "wallet", label: "Wallet", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
                  ]}
                  rows={((data.affiliates as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "affiliate", affiliateEdit: true })}
                  onStatusChange={(row, s) => { handleStatusUpdate("/api/admin/affiliates", String(row.id), s); }}
                />

                <h3 style={{ font: "20px var(--font-display)", margin: "32px 0 16px" }}>Withdrawal Requests</h3>
                <WithdrawalsSection onStatusUpdate={doRefresh} />
              </div>
            )}
            {tab === "affiliates" && editingItem?.affiliateEdit && (
              <AffiliateEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Affiliate updated."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── COUPONS ─── */}
            {tab === "coupons" && !editingItem?.couponEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "coupon", couponEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Create Coupon</button>
                <Table
                  columns={[
                    { key: "code", label: "Code", render: (v) => <b>{String(v)}</b> },
                    { key: "type", label: "Type" },
                    { key: "discount", label: "Discount", render: (v, row) => row.type === "percentage" ? `${v}%` : `₹${Number(v).toLocaleString("en-IN")}` },
                    { key: "minOrder", label: "Min Order", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
                    { key: "usedCount", label: "Used" },
                    { key: "isActive", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.coupons as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "coupon", couponEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/coupons", String(row.id))}
                />
              </div>
            )}
            {tab === "coupons" && editingItem?.couponEdit && (
              <CouponEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Coupon saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── BLOG ─── */}
            {tab === "blog" && !editingItem?.blogEdit && (
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <button onClick={() => setEditingItem({ _type: "blog", blogEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Create Post</button>
                  <a
                    href="/blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 14px",
                      background: "#fff",
                      color: "var(--purple)",
                      border: "1px solid var(--purple)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>👁️ View Journal</span>
                    <span>↗</span>
                  </a>
                </div>
                <Table
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "category", label: "Category" },
                    { key: "author", label: "Author", render: (v) => String(v || "—") },
                    { key: "featured", label: "Featured", render: (v) => v ? "⭐" : "—" },
                    { key: "published", label: "Status", render: (v) => <Badge status={v ? "approved" : "draft"} /> },
                    { key: "createdAt", label: "Date", render: (v) => new Date(String(v)).toLocaleDateString("en-IN") },
                  ]}
                  rows={((data.posts as Record<string, unknown>[]) || [])}
                  onPreview={(row) => window.open(`/blog/${row.slug}`, "_blank")}
                  onEdit={(row) => setEditingItem({ ...row, _type: "blog", blogEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/blog", String(row.id || row.slug))}
                />
              </div>
            )}
            {tab === "blog" && editingItem?.blogEdit && (
              <BlogEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Post saved."); setIsError(false); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

            {/* ─── FAQ ─── */}
            {tab === "faq" && !editingItem?.faqEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "faq", faqEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add FAQ</button>
                <Table
                  columns={[
                    { key: "question", label: "Question" },
                    { key: "category", label: "Category" },
                    { key: "sort", label: "Sort" },
                    { key: "visible", label: "Visible", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.faqs as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "faq", faqEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/faq", String(row.id))}
                />
              </div>
            )}
            {tab === "faq" && editingItem?.faqEdit && (
              <FAQEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("FAQ saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── REVIEWS ─── */}
            {tab === "reviews" && !editingItem?.reviewEdit && (
              <div>
                <button
                  onClick={() => setEditingItem({ _type: "review", reviewEdit: true, isNew: true, rating: 5, verified: true, visible: true })}
                  style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}
                >
                  + Add Review
                </button>
                <Table
                  columns={[
                    { key: "product", label: "Product", render: (v, row) => String((v as Record<string, unknown>)?.name || row.productSlug || row.productId || "—") },
                    { key: "user", label: "Customer", render: (v, row) => String((v as Record<string, unknown>)?.name || row.customerName || row.author || "—") },
                    { key: "rating", label: "Rating", render: (v) => "★".repeat(Number(v || 5)) },
                    { key: "title", label: "Title" },
                    { key: "visible", label: "Visible", render: (v) => v !== false ? "✓" : "✗" },
                  ]}
                  rows={((data.reviews as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "review", reviewEdit: true })}
                  onDelete={(row) => { req(`/api/admin/reviews?reviewId=${row.id}`, { method: "DELETE" }); setMessage("Review deleted."); doRefresh(); }}
                />
              </div>
            )}
            {tab === "reviews" && editingItem?.reviewEdit && (
              <ReviewEditForm
                item={editingItem}
                products={((data.products as Record<string, unknown>[]) || [])}
                onSave={() => { setEditingItem(null); setMessage("Review saved."); setIsError(false); doRefresh(); }}
              />
            )}

            {/* ─── BANNERS ─── */}
            {tab === "banners" && !editingItem?.bannerEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "banner", bannerEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Banner</button>
                <Table
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "position", label: "Position" },
                    { key: "sort", label: "Sort" },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.banners as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "banner", bannerEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/banners", String(row.id))}
                />
              </div>
            )}
            {tab === "banners" && editingItem?.bannerEdit && (
              <BannerEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Banner saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── TESTIMONIALS ─── */}
            {tab === "testimonials" && !editingItem?.testimonialEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "testimonial", testimonialEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Testimonial</button>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "title", label: "Title" },
                    { key: "body", label: "Review", render: (v) => <span style={{ maxWidth: 300, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v)}</span> },
                    { key: "rating", label: "Rating" },
                    { key: "visible", label: "Visible", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.testimonials as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "testimonial", testimonialEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/testimonials", String(row.id))}
                />
              </div>
            )}
            {tab === "testimonials" && editingItem?.testimonialEdit && (
              <TestimonialEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Testimonial saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── OFFERS ─── */}
            {tab === "offers" && !editingItem?.offerEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "offer", offerEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Offer</button>
                <Table
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "type", label: "Type" },
                    { key: "discount", label: "Discount" },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.offers as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "offer", offerEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/offers", String(row.id))}
                />
              </div>
            )}
            {tab === "offers" && editingItem?.offerEdit && (
              <OfferEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Offer saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── OTP & SECURITY ─── */}
            {tab === "otp-security" && (
              <OTPSettingsPanel />
            )}

            {/* ─── ORDER NOTIFICATIONS & TEMPLATES ─── */}
            {tab === "notifications-matrix" && (
              <NotificationSettingsPanel />
            )}

            {/* ─── DATA CENTER & EXPORTS ─── */}
            {tab === "data-export" && (
              <DataCenterExportPanel />
            )}

            {/* ─── MEDIA ─── */}
            {tab === "media" && (
              <MediaLibrary />
            )}

            {/* ─── SETTINGS ─── */}
            {tab === "settings" && !editingItem?.settingEdit && (
              <div>
                <LoginExperiencePanel onSave={doRefresh} />
                <LogoManager onSave={doRefresh} />
                <button onClick={() => setEditingItem({ _type: "setting", settingEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Setting</button>
                <Table
                  columns={[
                    { key: "key", label: "Key" },
                    { key: "group", label: "Group" },
                    { key: "value", label: "Value", render: (v) => <code style={{ fontSize: 11 }}>{JSON.stringify(v).slice(0, 80)}</code> },
                    { key: "updatedAt", label: "Updated", render: (v) => new Date(String(v)).toLocaleDateString("en-IN") },
                  ]}
                  rows={((data.settings as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "setting", settingEdit: true })}
                />
              </div>
            )}
            {tab === "settings" && editingItem?.settingEdit && (
              <SettingsEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Setting saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── HOMEPAGE SECTIONS ─── */}
            {tab === "homepage" && !editingItem?.hpEdit && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ font: "20px var(--font-display)", color: "#2A0F3A", margin: "0 0 4px" }}>Homepage Content & 3D Manager</h3>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Manage, reorder, show/hide, or edit all public homepage sections, copy, media, and 3D visual parameters.</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "8px 14px",
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
                      <span>👁️ Preview Live Homepage</span>
                      <span>↗</span>
                    </a>
                    <button
                      onClick={() => setTab("footer-builder")}
                      style={{
                        padding: "8px 14px",
                        background: "#fff",
                        color: "var(--purple)",
                        border: "1px solid var(--purple)",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>⚙️ Footer CMS</span>
                    </button>
                    <button
                      onClick={() =>
                        setEditingItem({
                          _type: "homepage",
                          hpEdit: true,
                          isNew: true,
                          type: "custom",
                          title: "New Custom Section",
                          sort: ((data.sections as Record<string, unknown>[]) || []).length,
                          active: true,
                          visible: true,
                        })
                      }
                      style={{ padding: "8px 16px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                    >
                      + Add New Section
                    </button>
                  </div>
                </div>

                <Table
                  columns={[
                    {
                      key: "title",
                      label: "Section Title",
                      render: (v, row) => (
                        <div>
                          <b style={{ color: "#2A0F3A", fontSize: 13 }}>{String(v || row.type || "Untitled Section")}</b>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>Type: <code>{({ hero: 'Hero Banner', heroVisual: '3D Visual', trust: 'Trust Strip', collection: 'Product Collection', science: 'Our Science', ritual: 'Ritual Cards', testimonial: 'Testimonial', newsletter: 'Newsletter', consult: 'Consultation', affiliate: 'Affiliate', banner: 'Announcement Bar', custom: 'Custom Section', marquee: 'Marquee / Ticker' } as Record<string,string>)[String(row.type)] || String(row.type)}</code></div>
                        </div>
                      ),
                    },
                    {
                      key: "sort",
                      label: "Order",
                      render: (v, row) => (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, minWidth: 20 }}>{Number(v || 0)}</span>
                          <button
                            type="button"
                            title="Move Up"
                            onClick={async () => {
                              const newSort = Math.max(0, Number(v || 0) - 1);
                              await fetch("/api/admin/homepage", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: row.id, sort: newSort }),
                              });
                              doRefresh();
                            }}
                            style={{ padding: "2px 6px", fontSize: 10, cursor: "pointer", border: "1px solid var(--line)", background: "#fff", borderRadius: 2 }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            onClick={async () => {
                              const newSort = Number(v || 0) + 1;
                              await fetch("/api/admin/homepage", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: row.id, sort: newSort }),
                              });
                              doRefresh();
                            }}
                            style={{ padding: "2px 6px", fontSize: 10, cursor: "pointer", border: "1px solid var(--line)", background: "#fff", borderRadius: 2 }}
                          >
                            ▼
                          </button>
                        </div>
                      ),
                    },
                    {
                      key: "visible",
                      label: "Public Visibility",
                      render: (v, row) => (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 10,
                              fontWeight: 700,
                              background: v !== false && row.active !== false ? "#e8f5e9" : "#ffebee",
                              color: v !== false && row.active !== false ? "#2e7d32" : "#c62828",
                            }}
                          >
                            {v !== false && row.active !== false ? "● VISIBLE" : "○ HIDDEN"}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextVisible = v === false ? true : false;
                              await fetch("/api/admin/homepage", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: row.id, visible: nextVisible }),
                              });
                              doRefresh();
                            }}
                            style={{
                              padding: "3px 8px",
                              fontSize: 11,
                              cursor: "pointer",
                              border: "1px solid var(--line)",
                              borderRadius: 3,
                              background: "#fff",
                              color: "#2A0F3A",
                            }}
                          >
                            {v !== false ? "Hide" : "Unhide"}
                          </button>
                        </div>
                      ),
                    },
                    {
                      key: "id",
                      label: "Actions",
                      render: (_, row) => (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...row, _type: "homepage", hpEdit: true })}
                            style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, background: "var(--purple)", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            title="Duplicate Section"
                            onClick={async () => {
                              const copyPayload = {
                                title: `${String(row.title || row.type)} (Copy)`,
                                type: row.type,
                                content: row.content,
                                sort: Number(row.sort || 0) + 1,
                                active: true,
                                visible: true,
                              };
                              await fetch("/api/admin/homepage", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(copyPayload),
                              });
                              doRefresh();
                            }}
                            style={{ padding: "4px 8px", fontSize: 11, background: "#f5f3ef", color: "#2A0F3A", border: "1px solid var(--line)", borderRadius: 3, cursor: "pointer" }}
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete("/api/admin/homepage", String(row.id))}
                            style={{ padding: "4px 8px", fontSize: 11, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", borderRadius: 3, cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  rows={((data.sections as Record<string, unknown>[]) || [])}
                />
              </div>
            )}
            {tab === "homepage" && editingItem?.hpEdit && (
              <HomepageSectionEdit item={editingItem} onSave={() => { setEditingItem(null); setMessage("Section saved successfully."); setIsError(false); doRefresh(); }} />
            )}
            {tab === "marketing" && (
              <MarketingPanel />
            )}
            {tab === "payments" && (
              <PaymentGatewayManager />
            )}
            {tab === "shipping" && (
              <ShippingManager />
            )}
            {tab === "billing" && (
              <BillingSettingsPanel />
            )}
            {tab === "tax-rules" && (
              <TaxManagementPanel />
            )}
            {tab === "invoice-designer" && (
              <InvoiceDesigner />
            )}
            {tab === "push" && (
              <PushNotificationPanel />
            )}
            {tab === "pages" && (
              <PageManagement />
            )}
            {tab === "redirects" && (
              <RedirectManagementPanel />
            )}
            {tab === "social-links" && (
              <SocialMediaLinksManager />
            )}
            {tab === "footer-builder" && (
              <FooterBuilder />
            )}
            {tab === "analytics" && (
              <AnalyticsDashboard />
            )}
            {tab === "analytics-tracking" && (
              <AnalyticsSettingsPanel />
            )}

            {tab === "staff" && (
              <StaffManagementPanel />
            )}

            {tab === "popups" && (
              <PopupManagementPanel />
            )}

            {tab === "audit-log" && (
              <AuditLogPanel />
            )}

            {tab === "models3d" && (
              <Model3DLibraryManager />
            )}

            {tab === "operations" && (
              <EmployeeOperationsPortal currentUser={currentUser} />
            )}

            {tab === "setup-checklist" && (
              <SetupChecklistPanel onNavigateTab={setTab} />
            )}

            {tab === "maintenance" && (
              <MaintenanceCenter onNavigateTab={setTab} />
            )}

            {tab === "email-templates" && (
              <EmailManagerPanel />
            )}

            {tab === "integrations" && (
              <IntegrationsManagerPanel />
            )}

            {tab === "merchandising" && (
              <UniversalMerchandisingPanel />
            )}

            {tab === "whatsapp" && (
              <WhatsAppSettingsPanel />
            )}

            {tab === "support-inbox" && (
              <AdminSupportInbox currentUser={currentUser} />
            )}

            {tab === "support-tickets" && (
              <AdminTicketCenter currentUser={currentUser} />
            )}

            {tab === "support-reports" && (
              <SupportReportsPanel />
            )}

            {tab === "support-settings" && (
              <AdminSupportSettings />
            )}

            {tab === "ticket-config" && (
              <TicketConfigPanel />
            )}
          </>
        </Suspense>
      </div>
    </main>
  );
}

