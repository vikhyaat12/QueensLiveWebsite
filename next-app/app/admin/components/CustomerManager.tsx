"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: "active" | "disabled" | "deactivated";
  isActive?: boolean;
  orderCount: number;
  totalSpend: number;
  createdAt: string;
};

type CustomerDetail = {
  user: Customer & { tokenVersion?: number };
  orders: Array<Record<string, unknown>>;
  addresses: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
};

export default function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled" | "deactivated">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals state
  const [actionCustomer, setActionCustomer] = useState<Customer | null>(null);
  const [modalType, setModalType] = useState<"disable" | "enable" | "deactivate" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (statusFilter !== "all") q.set("status", statusFilter);
      const res = await fetch(`/api/admin/customers?${q.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  const openCustomerDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      const data = await res.json();
      if (res.ok) {
        setCustomerDetail(data);
      }
    } catch {}
    setDetailLoading(false);
  };

  const executeStatusChange = async () => {
    if (!actionCustomer || !modalType) return;
    setActionLoading(true);
    try {
      if (modalType === "deactivate") {
        const res = await fetch(`/api/admin/customers/${actionCustomer.id}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
          setFeedbackMessage({
            text: `Customer deactivated safely. ${data.historicalOrdersPreserved || 0} historical orders preserved.`,
            type: "success",
          });
          loadCustomers();
          if (selectedCustomerId === actionCustomer.id) openCustomerDetail(actionCustomer.id);
        } else {
          setFeedbackMessage({ text: data.error || "Failed to deactivate customer.", type: "error" });
        }
      } else {
        const newStatus = modalType === "disable" ? "disabled" : "active";
        const res = await fetch(`/api/admin/customers/${actionCustomer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (res.ok) {
          setFeedbackMessage({
            text: `Customer account ${newStatus === "disabled" ? "disabled" : "re-enabled"} successfully.`,
            type: "success",
          });
          loadCustomers();
          if (selectedCustomerId === actionCustomer.id) openCustomerDetail(actionCustomer.id);
        } else {
          setFeedbackMessage({ text: data.error || "Failed to update status.", type: "error" });
        }
      }
    } catch {
      setFeedbackMessage({ text: "A network error occurred.", type: "error" });
    }
    setActionLoading(false);
    setModalType(null);
    setActionCustomer(null);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        (c.phone && c.phone.includes(s)) ||
        c.id.toLowerCase().includes(s)
      );
    });
  }, [customers, statusFilter, search]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Top Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ font: "22px var(--font-display, Georgia, serif)", margin: "0 0 4px", color: "var(--purple, #240e35)" }}>
            Customer Accounts
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted, #666)" }}>
            Manage registered customer profiles, account security, order histories, and addresses.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/api/admin/export?dataset=customers"
            download
            style={{
              padding: "9px 15px",
              background: "#fff",
              border: "1px solid var(--purple, #240e35)",
              color: "var(--purple, #240e35)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📥 Export Customers
          </a>
        </div>
      </div>

      {feedbackMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: feedbackMessage.type === "success" ? "#e8f5e9" : "#ffebee",
            border: `1px solid ${feedbackMessage.type === "success" ? "#c8e6c9" : "#ffcdd2"}`,
            color: feedbackMessage.type === "success" ? "#2e7d32" : "#c62828",
          }}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, background: "#f0edf4", padding: 4, borderRadius: 6 }}>
          {(["all", "active", "disabled", "deactivated"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: statusFilter === st ? 700 : 500,
                background: statusFilter === st ? "#fff" : "transparent",
                color: statusFilter === st ? "var(--purple, #240e35)" : "#555",
                cursor: "pointer",
                boxShadow: statusFilter === st ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                textTransform: "capitalize",
              }}
            >
              {st} {st === "all" ? `(${customers.length})` : `(${customers.filter((c) => c.status === st).length})`}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="search"
              placeholder="🔍 Search name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--line, #e6e4ea)",
                borderRadius: 4,
                fontSize: 13,
                width: 240,
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                background: "var(--purple, #240e35)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>
          <a
            href="/api/admin/export?dataset=customers"
            download
            style={{
              padding: "8px 14px",
              background: "#faf9fc",
              color: "var(--purple, #240e35)",
              border: "1px solid var(--line, #e6e4ea)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📥 Export (.CSV)</span>
          </a>
        </div>
      </div>

      {/* Main Customers Table */}
      <div style={{ background: "#fff", border: "1px solid var(--line, #e6e4ea)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#faf9fc", borderBottom: "1px solid var(--line, #e6e4ea)", color: "var(--muted, #666)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>
              <th style={{ padding: "12px 18px" }}>Customer</th>
              <th style={{ padding: "12px 18px" }}>Status</th>
              <th style={{ padding: "12px 18px" }}>Orders</th>
              <th style={{ padding: "12px 18px" }}>Total Spend</th>
              <th style={{ padding: "12px 18px" }}>Joined Date</th>
              <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "40px 18px", textAlign: "center", color: "var(--muted, #888)" }}>
                  Loading customers…
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "40px 18px", textAlign: "center", color: "var(--muted, #888)" }}>
                  No customer accounts match your search or filter.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: "1px solid var(--line, #f0edf4)",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#faf8fc")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fff")}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <b style={{ color: "var(--purple, #240e35)", display: "block", fontSize: 13.5 }}>{c.name}</b>
                    <span style={{ fontSize: 12, color: "var(--muted, #666)" }}>{c.email}</span>
                    {c.phone && <span style={{ fontSize: 11, color: "#888", display: "block" }}>📞 {c.phone}</span>}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 14,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                        background:
                          c.status === "active"
                            ? "#e8f5e9"
                            : c.status === "disabled"
                            ? "#ffebee"
                            : "#f5f5f5",
                        color:
                          c.status === "active"
                            ? "#2e7d32"
                            : c.status === "disabled"
                            ? "#c62828"
                            : "#666",
                        border: `1px solid ${
                          c.status === "active"
                            ? "#c8e6c9"
                            : c.status === "disabled"
                            ? "#ffcdd2"
                            : "#e0e0e0"
                        }`,
                      }}
                    >
                      {c.status || "active"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 600 }}>
                    {c.orderCount} order{c.orderCount === 1 ? "" : "s"}
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 700, color: "var(--purple, #240e35)" }}>
                    {inr(c.totalSpend)}
                  </td>
                  <td style={{ padding: "14px 18px", color: "var(--muted, #666)", fontSize: 12 }}>
                    {new Date(c.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        onClick={() => openCustomerDetail(c.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#f4edf8",
                          border: "1px solid #dfd3e7",
                          color: "var(--purple, #240e35)",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Details
                      </button>

                      {c.status === "active" ? (
                        <button
                          onClick={() => {
                            setActionCustomer(c);
                            setModalType("disable");
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "#fff",
                            border: "1px solid #f0b4b4",
                            color: "#b34141",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Disable
                        </button>
                      ) : c.status === "disabled" ? (
                        <button
                          onClick={() => {
                            setActionCustomer(c);
                            setModalType("enable");
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "#fff",
                            border: "1px solid #b7dfb9",
                            color: "#2e7d32",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Enable
                        </button>
                      ) : null}

                      {c.status !== "deactivated" && (
                        <button
                          onClick={() => {
                            setActionCustomer(c);
                            setModalType("deactivate");
                          }}
                          style={{
                            padding: "6px 10px",
                            background: "#fff",
                            border: "1px solid #ddd",
                            color: "#666",
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                          title="Safe account deactivation & anonymization"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomerId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => {
            setSelectedCustomerId(null);
            setCustomerDetail(null);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              height: "100%",
              background: "#fff",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.2)",
              padding: "28px 32px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", color: "#b8860b", fontWeight: 700 }}>
                  Customer Profile
                </span>
                <h3 style={{ font: "24px var(--font-display, Georgia, serif)", margin: "4px 0 2px", color: "var(--purple, #240e35)" }}>
                  {customerDetail?.user.name || "Customer Detail"}
                </h3>
                <span style={{ fontSize: 12, color: "#888" }}>ID: {selectedCustomerId}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#666" }}
              >
                ✕
              </button>
            </div>

            {detailLoading || !customerDetail ? (
              <p style={{ color: "#888", padding: "40px 0", textAlign: "center" }}>Loading customer records…</p>
            ) : (
              <div style={{ display: "grid", gap: 24 }}>
                {/* Account Details Box */}
                <div style={{ padding: 18, background: "#fbf9fc", border: "1px solid #eee", borderRadius: 6, display: "grid", gap: 10, fontSize: 13 }}>
                  <div><b>Email:</b> {customerDetail.user.email}</div>
                  <div><b>Mobile:</b> {customerDetail.user.phone || "Not provided"}</div>
                  <div><b>Account Status:</b> <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{customerDetail.user.status || "active"}</span></div>
                  <div><b>Member Since:</b> {new Date(customerDetail.user.createdAt).toLocaleString("en-IN")}</div>
                  <div><b>Session Token Version:</b> {customerDetail.user.tokenVersion || 1}</div>
                </div>

                {/* Orders Section */}
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--purple, #240e35)" }}>
                    Order History ({customerDetail.orders.length})
                  </h4>
                  {customerDetail.orders.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#888" }}>No orders placed yet.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {customerDetail.orders.map((ord) => (
                        <div
                          key={String(ord.id)}
                          style={{
                            padding: "10px 14px",
                            background: "#fff",
                            border: "1px solid #eee",
                            borderRadius: 4,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 12,
                          }}
                        >
                          <div>
                            <b style={{ color: "var(--purple, #240e35)" }}>#{String(ord.id).slice(0, 14)}</b>
                            <span style={{ display: "block", color: "#888", fontSize: 11 }}>
                              {new Date(String(ord.createdAt)).toLocaleDateString("en-IN")} · Status: <b>{String(ord.status)}</b>
                            </span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <b style={{ color: "var(--purple, #240e35)" }}>{inr(Number(ord.total))}</b>
                            <span style={{ display: "block", color: "#666", fontSize: 11 }}>{String(ord.paymentMethod || "COD").toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved Addresses */}
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--purple, #240e35)" }}>
                    Saved Delivery Addresses ({customerDetail.addresses.length})
                  </h4>
                  {customerDetail.addresses.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#888" }}>No saved addresses.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {customerDetail.addresses.map((addr) => (
                        <div key={String(addr.id)} style={{ padding: "10px 14px", background: "#fff", border: "1px solid #eee", borderRadius: 4, fontSize: 12 }}>
                          <b>{String(addr.fullName)}</b> ({String(addr.label || "Home")})
                          <p style={{ margin: "4px 0 0", color: "#666" }}>
                            {String(addr.address)}, {String(addr.city)}, {String(addr.state)} - {String(addr.pincode)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Account Activity / Audit Trail */}
                {customerDetail.activity.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--purple, #240e35)" }}>
                      Recent Activity & Audit
                    </h4>
                    <div style={{ display: "grid", gap: 6 }}>
                      {customerDetail.activity.map((act, i) => (
                        <div key={i} style={{ padding: "8px 12px", background: "#faf9fc", border: "1px solid #f0edf4", borderRadius: 4, fontSize: 11.5 }}>
                          <b>{String(act.action)}</b>: {String(act.details)}
                          <span style={{ display: "block", color: "#888", fontSize: 10, marginTop: 2 }}>
                            {new Date(String(act.createdAt)).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modals for Destructive Actions */}
      {modalType && actionCustomer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => {
            if (!actionLoading) {
              setModalType(null);
              setActionCustomer(null);
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "#fff",
              borderRadius: 8,
              padding: "26px 28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ font: "20px var(--font-display, Georgia, serif)", margin: "0 0 12px", color: "var(--purple, #240e35)" }}>
              {modalType === "disable"
                ? "Disable Customer Account"
                : modalType === "enable"
                ? "Re-enable Customer Account"
                : "Safe Customer Deactivation"}
            </h3>

            {modalType === "disable" && (
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: "0 0 20px" }}>
                Are you sure you want to disable <b>{actionCustomer.name}</b> ({actionCustomer.email})?
                <br /><br />
                This customer will immediately be blocked from logging in, accessing account APIs, and placing orders. All existing authenticated sessions will be invalidated.
              </p>
            )}

            {modalType === "enable" && (
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: "0 0 20px" }}>
                Re-enable the account for <b>{actionCustomer.name}</b> ({actionCustomer.email})?
                <br /><br />
                The customer will regain normal access to log in, checkout, and view their order history.
              </p>
            )}

            {modalType === "deactivate" && (
              <div>
                <div style={{ padding: "12px 14px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, marginBottom: 14 }}>
                  <b style={{ color: "#b78103", display: "block", fontSize: 12.5, marginBottom: 4 }}>
                    ⚠️ Warning: Historical Orders Preserved
                  </b>
                  <p style={{ margin: 0, fontSize: 12, color: "#6d4c00", lineHeight: 1.4 }}>
                    This customer has <b>{actionCustomer.orderCount}</b> historical order(s).
                    Deleting this account will deactivate and anonymize personal information while legally and operationally preserving all required order records.
                  </p>
                </div>
                <p style={{ fontSize: 12.5, color: "#555", margin: "0 0 20px" }}>
                  All active sessions will be terminated and credentials revoked. This action cannot be undone.
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setActionCustomer(null);
                }}
                disabled={actionLoading}
                style={{
                  padding: "9px 16px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeStatusChange}
                disabled={actionLoading}
                style={{
                  padding: "9px 18px",
                  background: modalType === "enable" ? "#2e7d32" : "#c62828",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: actionLoading ? "wait" : "pointer",
                }}
              >
                {actionLoading
                  ? "Processing…"
                  : modalType === "disable"
                  ? "Disable Account"
                  : modalType === "enable"
                  ? "Re-enable Account"
                  : "Deactivate & Anonymize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
