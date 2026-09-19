"use client";

import React, { useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   Shared admin components — Badge, Table, req helper, types
   Used across all admin panel components.
   ═══════════════════════════════════════════════════════════════ */

export type Tab =
  | "dashboard" | "setup-checklist" | "maintenance" | "operations"
  | "orders" | "products" | "product-edit" | "aplus" | "inventory"
  | "categories" | "customers" | "b2b" | "stores" | "careers"
  | "career-applications" | "doctors" | "employees" | "affiliates"
  | "coupons" | "blog" | "faq" | "reviews" | "media" | "banners"
  | "testimonials" | "settings" | "offers" | "homepage" | "marketing"
  | "payments" | "shipping" | "push" | "pages" | "social-links"
  | "otp-security" | "notifications-matrix" | "data-export"
  | "analytics" | "staff" | "audit-log" | "popups" | "models3d"
  | "billing" | "invoice-designer" | "tax-rules" | "email-templates" | "integrations" | "merchandising" | "whatsapp"
  | "analytics-tracking"
  | "support-inbox" | "support-settings" | "support-tickets" | "support-reports" | "ticket-config"
  | "footer-builder" | "redirects";

export const ENDPOINTS: Record<Tab, string | null> = {
  dashboard: "/api/admin/dashboard",
  whatsapp: "/api/admin/whatsapp",
  inventory: "/api/admin/inventory",
  "setup-checklist": null,
  maintenance: null,
  operations: "/api/admin/orders",
  orders: "/api/admin/orders",
  products: "/api/products?all=true",
  categories: "/api/admin/categories",
  customers: "/api/admin/customers",
  b2b: "/api/admin/b2b",
  stores: "/api/admin/store-locator",
  careers: "/api/admin/careers/page",
  "career-applications": "/api/admin/careers",
  doctors: "/api/admin/doctors",
  employees: "/api/admin/employees",
  affiliates: "/api/admin/affiliates",
  coupons: "/api/admin/coupons",
  blog: "/api/admin/blog",
  faq: "/api/admin/faq",
  reviews: "/api/admin/reviews",
  media: "/api/admin/media",
  banners: "/api/admin/banners",
  testimonials: "/api/admin/testimonials",
  settings: "/api/admin/settings",
  offers: "/api/admin/offers",
  homepage: "/api/admin/homepage",
  marketing: "/api/admin/marketing",
  payments: "/api/admin/payments",
  shipping: "/api/admin/shipping/providers",
  push: "/api/admin/push/history",
  pages: "/api/admin/pages",
  "social-links": "/api/admin/social-links",
  aplus: "/api/admin/aplus",
  "otp-security": "/api/admin/otp/settings",
  "notifications-matrix": "/api/admin/notifications/settings",
  "data-export": "/api/admin/googlesheets",
  "product-edit": null,
  analytics: "/api/analytics",
  staff: "/api/admin/staff",
  "audit-log": "/api/admin/audit-log",
  popups: "/api/popups",
  models3d: "/api/admin/models3d",
  billing: "/api/admin/settings/billing",
  "invoice-designer": null,
  "tax-rules": "/api/admin/tax",
  "email-templates": "/api/admin/email/templates",
  integrations: "/api/admin/integrations",
  merchandising: "/api/admin/promotions",
  "support-inbox": "/api/admin/support/conversations",
  "support-settings": "/api/admin/support/settings",
  "support-tickets": "/api/admin/support/tickets",
  "support-reports": "/api/admin/support/reports",
  "ticket-config": "/api/admin/support/ticket-config",
  "analytics-tracking": "/api/admin/analytics-config",
  "footer-builder": null,
  redirects: "/api/admin/redirects",
};

export const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  return r.json();
};

export function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#d4ad65", submitted: "#2196f3", under_review: "#d4ad65",
    shortlisted: "#9c27b0", interview: "#ff9800", hired: "#4caf50",
    approved: "#4caf50", paid: "#4caf50", active: "#4caf50",
    delivered: "#4caf50", completed: "#2e7d32", confirmed: "#1565c0",
    processing: "#2196f3", shipped: "#2196f3", packed: "#2196f3",
    cancelled: "#b34141", declined: "#b34141", rejected: "#b34141",
    failed: "#b34141", refunded: "#9c27b0", suspended: "#ff9800",
  };
  return (
    <span
      style={{
        padding: "3px 8px", fontSize: 10, textTransform: "uppercase",
        letterSpacing: ".06em", background: colors[status] || "#eee",
        color: ["pending", "suspended", "under_review"].includes(status) ? "#333" : "#fff",
        borderRadius: 3,
      }}
    >
      {status}
    </span>
  );
}

export function Table({
  columns, rows, onEdit, onDelete, onStatusChange, onPreview,
}: {
  columns: { key: string; label: string; render?: (v: unknown, row: Record<string, unknown>) => React.ReactNode }[];
  rows: Record<string, unknown>[];
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onStatusChange?: (row: Record<string, unknown>, status: string) => void;
  onPreview?: (row: Record<string, unknown>) => void;
}) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const perPage = 12;
  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(filtered.length / perPage);
  const visible = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <input
          placeholder="Search…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{ padding: "10px 14px", border: "1px solid var(--line)", flex: 1, maxWidth: 350, fontSize: 13 }}
        />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{filtered.length} records</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
                  {c.label}
                </th>
              ))}
              {(onEdit || onDelete || onStatusChange || onPreview) && (
                <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--line)" }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                {columns.map(c => (
                  <td key={c.key} style={{ padding: "10px 12px" }}>
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
                {(onEdit || onDelete || onStatusChange || onPreview) && (
                  <td style={{ padding: "10px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {onPreview && <button onClick={() => onPreview(row)} style={{ border: "1px solid #c7d2fe", background: "#f5f3ff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "var(--purple)", fontWeight: 600 }}>Preview ↗</button>}
                    {onEdit && <button onClick={() => onEdit(row)} style={{ border: "1px solid var(--line)", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Edit</button>}
                    {onDelete && <button onClick={() => onDelete(row)} style={{ border: "1px solid #e2c3c3", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#b34141" }}>Del</button>}
                    {onStatusChange && <button onClick={() => onStatusChange(row, "approved")} style={{ border: "1px solid #c3e6cb", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#2e7d32" }}>Approve</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Prev</button>
          <span style={{ padding: "6px 12px", fontSize: 12, color: "var(--muted)" }}>Page {page + 1} of {pages}</span>
          <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ── Common input/label styles used by edit forms ─────────── */
export const inputStyle: React.CSSProperties = { padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, width: "100%", boxSizing: "border-box" as const };
export const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--muted)", marginBottom: 4, display: "block" };
