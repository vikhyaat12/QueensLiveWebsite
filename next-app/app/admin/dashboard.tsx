"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import BlogEditForm from "./BlogEditForm";
import { BannerEditForm, TestimonialEditForm, OfferEditForm, SettingsEditForm, ReviewEditForm, DoctorEditForm } from "./ContentEditForms";
import { ProductEditFormAdvanced } from "./ProductEditFormAdvanced";
import HomepageSectionEdit from "./HomepageSectionEdit";
import MarketingPanel from "./MarketingPanel";
import LogoManager from "./LogoManager";
import MediaLibrary from "./MediaLibrary";
import PaymentGatewayManager from "./PaymentGatewayManager";
import ShippingManager from "./ShippingManager";
import APlusManager from "./APlusManager";
import EmployeeEditFormAdvanced from "./EmployeeEditFormAdvanced";
import PushNotificationPanel from "./PushNotificationPanel";
import PageManagement from "./PageManagement";
import SocialMediaLinksManager from "./SocialMediaLinksManager";
import CareerApplicationsManager from "./CareerApplicationsManager";
import CareersCMSManager from "./CareersCMSManager";
import OTPSettingsPanel from "./OTPSettingsPanel";
import NotificationSettingsPanel from "./NotificationSettingsPanel";
import DataCenterExportPanel from "./DataCenterExportPanel";
import B2BManagement from "./B2BManagement";
import StoreLocatorManagement from "./StoreLocatorManagement";
import FooterSettingsModal from "./FooterSettingsModal";
import AnalyticsDashboard from "./AnalyticsDashboard";
import BrandLogo from "../components/BrandLogo";
import OrderDetailPanel from "./components/OrderDetailPanel";
import PopupManagementPanel from "./components/PopupManagementPanel";
import DashboardPanel from "./components/DashboardPanel";
import OrderManager from "./components/OrderManager";
import StaffManagementPanel from "./components/StaffManagementPanel";
import AuditLogPanel from "./components/AuditLogPanel";
import { CategoryEditForm, EmployeeEditForm, CouponEditForm, FAQEditForm, AffiliateEditForm, WithdrawalsSection } from "./components/EditForms";
import { Badge, Table, req, ENDPOINTS } from "./components/shared";
import type { Tab } from "./components/shared";

/* DashboardPanel, OrderManager, StaffManagementPanel, AuditLogPanel — extracted to components/ */
export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [showFooterEditor, setShowFooterEditor] = useState(false);

  const doRefresh = useCallback(async () => {
    try {
      const url = ENDPOINTS[tab];
      if (url) {
        setLoading(true);
        const d = await req(url);
        setData(d || {});
      }
    } catch {
      setMessage("Failed to load data.");
      setIsError(true);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = ENDPOINTS[tab];
        if (url) {
          setLoading(true);
          const d = await req(url);
          if (!cancelled) setData(d || {});
        }
      } catch {
        if (!cancelled) {
          setMessage("Failed to load data.");
          setIsError(true);
        }
      }
      if (!cancelled) setLoading(false);
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

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "products", label: "Products", icon: "🏷️" },
    { id: "aplus", label: "A+ Content", icon: "✨" },
    { id: "categories", label: "Categories", icon: "📁" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "b2b", label: "B2B Leads", icon: "🏢" },
    { id: "stores", label: "Store Locator", icon: "📍" },
    { id: "careers", label: "Careers CMS", icon: "💼" },
    { id: "career-applications", label: "Career Applications", icon: "📁" },
    { id: "doctors", label: "Doctors", icon: "⚕️" },
    { id: "employees", label: "Employees", icon: "👤" },
    { id: "affiliates", label: "Affiliates", icon: "🤝" },
    { id: "coupons", label: "Coupons", icon: "🎫" },
    { id: "blog", label: "Blog", icon: "📝" },
    { id: "faq", label: "FAQ", icon: "❓" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "banners", label: "Banners", icon: "🎯" },
    { id: "testimonials", label: "Testimonials", icon: "💬" },
    { id: "marketing", label: "Marketing", icon: "📣" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "shipping", label: "Shipping", icon: "🚚" },
    { id: "push", label: "Push Notifications", icon: "📱" },
    { id: "otp-security", label: "OTP & Security", icon: "🔐" },
    { id: "notifications-matrix", label: "Order Notifications", icon: "🔔" },
    { id: "data-export", label: "Data Center & Excel", icon: "📊" },
    { id: "media", label: "Media", icon: "🖼️" },
    { id: "staff", label: "Staff", icon: "👥" },
    { id: "audit-log", label: "Audit Log", icon: "📋" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "pages", label: "Pages", icon: "📑" },
    { id: "social-links", label: "Social Links", icon: "🔗" },
    { id: "homepage", label: "Homepage", icon: "🏠" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "popups", label: "Popups", icon: "🪟" },
  ];

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

  return (
    <main className="portal" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, minHeight: "100vh" }}>
      <nav style={{ background: "var(--purple)", color: "#fff", padding: "24px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #ffffff20" }}>
          <div style={{ marginBottom: 12 }}><BrandLogo inverse showText overrideHeight={32} overrideMobileHeight={24} overrideMaxWidth={140} /></div>
          <p style={{ fontSize: 11, color: "#d7cddd", margin: 0 }}>Commerce Command Centre</p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setEditingItem(null); setMessage(""); setIsError(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 20px", border: "none", background: tab === t.id ? "#ffffff15" : "transparent", color: "#fff", cursor: "pointer", fontSize: 12, textAlign: "left", borderLeft: tab === t.id ? "3px solid var(--gold)" : "3px solid transparent" }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #ffffff20", fontSize: 10, color: "#a99cab" }}>Queens Care Labs © 2026</div>
      </nav>

      <div style={{ padding: "30px 36px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, font: "28px var(--font-display)", letterSpacing: "-.03em" }}>{editingItem ? `Edit ${editingItem._type || tab}` : tabs.find(t => t.id === tab)?.label}</h2>
            {message && (
              <p
                style={{
                  margin: "8px 0 0",
                  padding: "8px 12px",
                  background: isError ? "#fde8e8" : "#e9f7e9",
                  fontSize: 12,
                  color: isError ? "#b34141" : "#2e7d32",
                  border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
                }}
              >
                {message}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {editingItem && <button onClick={() => { setEditingItem(null); setMessage(""); setIsError(false); }} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Back to list</button>}
            <button onClick={doRefresh} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>↻ Refresh</button>
          </div>
        </div>

        {loading ? <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p> : (
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
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <button onClick={() => setEditingItem({ _type: "product", isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Add Product</button>
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
            {tab === "customers" && (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                  <a
                    href="/api/admin/export?dataset=customers"
                    download
                    style={{
                      padding: "8px 14px",
                      background: "var(--purple)",
                      color: "#fff",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>📥 Export Customers (.CSV / Excel)</span>
                  </a>
                </div>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "role", label: "Role", render: (v) => <Badge status={String(v)} /> },
                    { key: "createdAt", label: "Joined", render: (v) => new Date(String(v)).toLocaleDateString("en-IN") },
                  ]}
                  rows={((data.customers as Record<string, unknown>[]) || [])}
                />
              </div>
            )}

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

            {/* ─── EMPLOYEES ─── */}
            {tab === "employees" && !editingItem?.employeeEdit && (
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <button onClick={() => setEditingItem({ _type: "employee", employeeEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Add Employee</button>
                  <a
                    href="/employee"
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
                    <span>👁️ Preview Team Page</span>
                    <span>↗</span>
                  </a>
                </div>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "designation", label: "Designation" },
                    { key: "department", label: "Department" },
                    { key: "employeeId", label: "Employee ID" },
                    {
                      key: "active",
                      label: "Status",
                      render: (v, row) => (
                        <button
                          type="button"
                          onClick={async () => {
                            const nextActive = v === false ? true : false;
                            await fetch("/api/admin/employees", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: row.id, active: nextActive }),
                            });
                            doRefresh();
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 4,
                            border: "1px solid " + (v !== false ? "#a5d6a7" : "#ffcdd2"),
                            background: v !== false ? "#e8f5e9" : "#ffebee",
                            color: v !== false ? "#2e7d32" : "#c62828",
                            cursor: "pointer",
                          }}
                          title="Click to toggle Active / Inactive"
                        >
                          {v !== false ? "● ACTIVE" : "○ INACTIVE"}
                        </button>
                      ),
                    },
                    {
                      key: "featured",
                      label: "Featured",
                      render: (v, row) => (
                        <button
                          type="button"
                          onClick={async () => {
                            const nextFeatured = !v;
                            await fetch("/api/admin/employees", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: row.id, featured: nextFeatured }),
                            });
                            doRefresh();
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 4,
                            border: "1px solid " + (v ? "#ffe082" : "#eee"),
                            background: v ? "#fff8e1" : "#fff",
                            color: v ? "#b78103" : "var(--muted)",
                            cursor: "pointer",
                          }}
                          title="Click to toggle Featured on Team Page"
                        >
                          {v ? "⭐ FEATURED" : "☆ Standard"}
                        </button>
                      ),
                    },
                  ]}
                  rows={((data.employees as Record<string, unknown>[]) || [])}
                  onPreview={(row) => window.open(`/employee/${row.slug || row.id}`, "_blank")}
                  onEdit={(row) => setEditingItem({ ...row, _type: "employee", employeeEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/employees", String(row.id))}
                />
              </div>
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
                      onClick={() => setShowFooterEditor(true)}
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
                {showFooterEditor && (
                  <FooterSettingsModal
                    onClose={() => setShowFooterEditor(false)}
                    onSave={doRefresh}
                  />
                )}
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
            {tab === "push" && (
              <PushNotificationPanel />
            )}
            {tab === "pages" && (
              <PageManagement />
            )}
            {tab === "social-links" && (
              <SocialMediaLinksManager />
            )}
            {tab === "analytics" && (
              <AnalyticsDashboard />
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
          </>
        )}
      </div>
    </main>
  );
}

