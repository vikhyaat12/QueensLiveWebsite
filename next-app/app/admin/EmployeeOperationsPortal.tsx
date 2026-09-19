"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface OrderItem {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  trackingCode?: string;
  prescriptionUrl?: string;
  prescriptionStatus?: "pending" | "approved" | "rejected";
  prescriptionNote?: string;
  shipping?: {
    fullName?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    pincode?: string;
    address?: string;
  };
  lines?: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock?: number;
  category?: string;
}

interface HandoverNote {
  id: string;
  author: string;
  timestamp: string;
  text: string;
  shift: "Morning" | "Evening" | "Night";
}

export default function EmployeeOperationsPortal({
  currentUser,
}: {
  currentUser?: { name?: string; role?: string; email?: string };
}) {
  const [activeSubTab, setActiveSubTab] = useState<"fulfillment" | "prescriptions" | "inventory" | "handover">("fulfillment");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Prescription modal state
  const [selectedOrderForRx, setSelectedOrderForRx] = useState<OrderItem | null>(null);
  const [rxPharmacistNote, setRxPharmacistNote] = useState("");

  // Handover notes
  const [handoverNotes, setHandoverNotes] = useState<HandoverNote[]>([
    {
      id: "note-1",
      author: currentUser?.name || "Senior Pharmacist",
      timestamp: new Date().toLocaleDateString("en-IN") + " 10:00 AM",
      text: "All Delhivery express batches dispatched for morning pickup. Cold-chain packs checked at 4°C.",
      shift: "Morning",
    },
  ]);
  const [newNoteText, setNewNoteText] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/admin/orders").then((r) => r.json()).catch(() => ({ orders: [] })),
        fetch("/api/products?all=true").then((r) => r.json()).catch(() => ({ products: [] })),
      ]);
      if (Array.isArray(ordersRes.orders)) setOrders(ordersRes.orders);
      if (Array.isArray(productsRes.products)) setProducts(productsRes.products);
    } catch (e) {
      console.error("Operations portal data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, trackingCode?: string) => {
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (trackingCode !== undefined) payload.trackingCode = trackingCode;
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setActionMessage(`Order #${orderId.slice(-6)} updated to status: ${newStatus.toUpperCase()}`);
        setTimeout(() => setActionMessage(null), 4000);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, trackingCode: trackingCode || o.trackingCode } : o))
        );
      }
    } catch {
      setActionMessage("Error updating order status.");
    }
  };

  const handlePrescriptionDecision = async (orderId: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: decision,
          pharmacistNote: rxPharmacistNote,
        }),
      });
      if (res.ok) {
        setActionMessage(`Prescription marked as ${decision.toUpperCase()}`);
        setTimeout(() => setActionMessage(null), 4000);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  prescriptionStatus: decision,
                  prescriptionNote: rxPharmacistNote,
                }
              : o
          )
        );
        setSelectedOrderForRx(null);
        setRxPharmacistNote("");
      }
    } catch {
      setActionMessage("Error saving prescription decision.");
    }
  };

  const handleStockUpdate = async (productId: string, newStock: number) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, stock: newStock }),
      });
      if (res.ok) {
        setActionMessage("Stock updated successfully.");
        setTimeout(() => setActionMessage(null), 3000);
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
        );
      }
    } catch {
      setActionMessage("Failed to update stock.");
    }
  };

  const handleAddHandoverNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const note: HandoverNote = {
      id: "note-" + Date.now(),
      author: currentUser?.name || "Staff Member",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " Today",
      text: newNoteText.trim(),
      shift: "Evening",
    };
    setHandoverNotes([note, ...handoverNotes]);
    setNewNoteText("");
  };

  // Operational metrics
  const metrics = useMemo(() => {
    const toPack = orders.filter((o) => o.status === "confirmed" || o.status === "paid").length;
    const toShip = orders.filter((o) => o.status === "packed").length;
    const pendingRx = orders.filter((o) => o.prescriptionUrl && o.prescriptionStatus !== "approved").length;
    const lowStockCount = products.filter((p) => (p.stock ?? 10) <= 5).length;
    return { toPack, toShip, pendingRx, lowStockCount };
  }, [orders, products]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "all" || o.status.toLowerCase() === statusFilter.toLowerCase();
      const q = searchTerm.toLowerCase().trim();
      const matchQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.shipping?.fullName?.toLowerCase().includes(q) ||
        o.shipping?.city?.toLowerCase().includes(q) ||
        o.trackingCode?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, statusFilter, searchTerm]);

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E1638 0%, #2A0F3A 100%)",
          borderRadius: 14,
          padding: "24px 28px",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          boxShadow: "0 4px 16px rgba(42, 15, 58, 0.08)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Employee Operations Command Center
            </h2>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(212, 175, 55, 0.2)",
                color: "#D4AF37",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Live Fulfillment
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255, 255, 255, 0.75)" }}>
            High-efficiency fulfillment, cold-chain packing, pharmacist dispensing checks, and dispatch controls.
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#D4AF37" }}>
            {currentUser?.name || "Operations Team"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
            Role: {currentUser?.role?.toUpperCase() || "STAFF"}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: "10px 16px",
            background: "#ECFDF5",
            color: "#065F46",
            border: "1px solid #A7F3D0",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✓ {actionMessage}
        </div>
      )}

      {/* 4 Operational KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            borderLeft: "4px solid #F59E0B",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>
            Orders to Pack
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1F2937", marginTop: 4 }}>
            {metrics.toPack}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            Confirmed &amp; Paid batches
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            borderLeft: "4px solid #3B82F6",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>
            Ready to Dispatch
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1F2937", marginTop: 4 }}>
            {metrics.toShip}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            Packed with labels attached
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            borderLeft: "4px solid #8B5CF6",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>
            Rx Pending Review
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1F2937", marginTop: 4 }}>
            {metrics.pendingRx}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            Awaiting pharmacist sign-off
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            borderLeft: "4px solid #EF4444",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>
            Low Stock Alerts
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1F2937", marginTop: 4 }}>
            {metrics.lowStockCount}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            Formulations &le; 5 units in storage
          </div>
        </div>
      </div>

      {/* Operational Sub-Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid #E5E7EB",
          marginBottom: 24,
        }}
      >
        {[
          { id: "fulfillment", label: "📦 Fulfillment Pipeline", count: orders.length },
          { id: "prescriptions", label: "⚕️ Pharmacist Prescription Review", count: metrics.pendingRx },
          { id: "inventory", label: "🏷️ Inventory Quick Adjuster", count: products.length },
          { id: "handover", label: "📋 Shift Handover & Log", count: handoverNotes.length },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              style={{
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "3px solid #2A0F3A" : "3px solid transparent",
                color: isActive ? "#2A0F3A" : "#6B7280",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: 999,
                    fontSize: 11,
                    background: isActive ? "#F3E8FF" : "#F3F4F6",
                    color: isActive ? "#581C87" : "#6B7280",
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: FULFILLMENT PIPELINE ─── */}
      {activeSubTab === "fulfillment" && (
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", padding: "20px" }}>
          {/* Controls Bar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search by Order ID, Patient name, City, Pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  fontSize: 13,
                  width: 320,
                  outline: "none",
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  fontSize: 13,
                  background: "#FFFFFF",
                  outline: "none",
                }}
              >
                <option value="all">All Lifecycle Stages</option>
                <option value="pending">Pending Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed (Ready for Dispatch)</option>
                <option value="shipped">In Transit (Shipped)</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadData}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                background: "#F9FAFB",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ↻ Refresh Orders
            </button>
          </div>

          {/* Orders Table */}
          {loading ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>Loading fulfillment data...</p>
          ) : filteredOrders.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>No matching orders found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Order ID &amp; Date</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Patient / Destination</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Items</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Total</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Current Status</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Print Slips</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Status Update</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#2A0F3A" }}>#{ord.id.slice(-8)}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#1F2937" }}>
                          {ord.shipping?.fullName || "Valued Customer"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                          {ord.shipping?.city ? `${ord.shipping.city}, ${ord.shipping.state || ""}` : "No address logged"}
                        </div>
                        {ord.shipping?.phone && (
                          <div style={{ fontSize: 11, color: "#4B5563" }}>📞 {ord.shipping.phone}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 12, color: "#374151" }}>
                          {ord.lines?.map((l, i) => (
                            <div key={i}>
                              {l.quantity}x {l.name || l.productId}
                            </div>
                          )) || "1 item"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#111827" }}>
                        ₹{Number(ord.total || 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background:
                              ord.status === "delivered"
                                ? "#D1FAE5"
                                : ord.status === "shipped"
                                ? "#DBEAFE"
                                : ord.status === "packed"
                                ? "#E0E7FF"
                                : ord.status === "confirmed"
                                ? "#FEF3C7"
                                : "#FEE2E2",
                            color:
                              ord.status === "delivered"
                                ? "#065F46"
                                : ord.status === "shipped"
                                ? "#1E40AF"
                                : ord.status === "packed"
                                ? "#3730A3"
                                : ord.status === "confirmed"
                                ? "#92400E"
                                : "#991B1B",
                          }}
                        >
                          {ord.status}
                        </span>
                        {ord.trackingCode && (
                          <div style={{ fontSize: 11, color: "#4B5563", marginTop: 4 }}>
                            AWB: <code>{ord.trackingCode}</code>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link
                            href={`/admin/orders/${ord.id}/print/packing-slip`}
                            target="_blank"
                            title="Print Packing Slip"
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: "#F3F4F6",
                              color: "#374151",
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: "none",
                              border: "1px solid #E5E7EB",
                            }}
                          >
                            📄 Slip
                          </Link>
                          <Link
                            href={`/admin/orders/${ord.id}/print/shipping-label`}
                            target="_blank"
                            title="Print Shipping Label"
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: "#F3F4F6",
                              color: "#374151",
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: "none",
                              border: "1px solid #E5E7EB",
                            }}
                          >
                            🏷️ Label
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <select
                          value={ord.status}
                          onChange={(e) => {
                            const newSt = e.target.value;
                            if (newSt === "shipped") {
                              const awb = prompt("Enter courier AWB / Tracking number for dispatch:", ord.trackingCode || "");
                              if (awb !== null) {
                                handleUpdateOrderStatus(ord.id, newSt, awb);
                              }
                            } else {
                              handleUpdateOrderStatus(ord.id, newSt);
                            }
                          }}
                          style={{
                            padding: "6px 8px",
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                            fontSize: 12,
                            background: "#FFFFFF",
                            outline: "none",
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="packed">Mark Packed</option>
                          <option value="shipped">Mark Shipped</option>
                          <option value="delivered">Mark Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: PHARMACIST PRESCRIPTION REVIEW ─── */}
      {activeSubTab === "prescriptions" && (
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                Pharmacist Prescription Verification Desk
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>
                Under Schedule H and pharmacy compliance regulations, verify uploaded prescriptions before order release.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {orders.filter((o) => o.prescriptionUrl).length === 0 ? (
              <p style={{ padding: "30px", color: "#6B7280", textAlign: "center", gridColumn: "1 / -1" }}>
                ✓ No prescriptions pending review at this time. All uploaded patient files are verified.
              </p>
            ) : (
              orders
                .filter((o) => o.prescriptionUrl)
                .map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      padding: 16,
                      background: ord.prescriptionStatus === "approved" ? "#F0FDF4" : "#FFFFFF",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#2A0F3A" }}>Order #{ord.id.slice(-6)}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background:
                            ord.prescriptionStatus === "approved"
                              ? "#DCFCE7"
                              : ord.prescriptionStatus === "rejected"
                              ? "#FEE2E2"
                              : "#FEF3C7",
                          color:
                            ord.prescriptionStatus === "approved"
                              ? "#15803D"
                              : ord.prescriptionStatus === "rejected"
                              ? "#B91C1C"
                              : "#B45309",
                        }}
                      >
                        {ord.prescriptionStatus ? ord.prescriptionStatus.toUpperCase() : "PENDING REVIEW"}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 12 }}>
                      <div>Patient: <strong>{ord.shipping?.fullName || "Unspecified"}</strong></div>
                      <div>Uploaded: {new Date(ord.createdAt).toLocaleDateString()}</div>
                    </div>

                    {ord.prescriptionUrl && (
                      <div style={{ marginBottom: 12 }}>
                        <a
                          href={ord.prescriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            background: "#F3F4F6",
                            color: "#1F2937",
                            borderRadius: 4,
                            fontSize: 12,
                            textDecoration: "none",
                            fontWeight: 600,
                            border: "1px solid #D1D5DB",
                          }}
                        >
                          👁️ View Prescription Document
                        </a>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderForRx(ord);
                          setRxPharmacistNote(ord.prescriptionNote || "");
                        }}
                        style={{
                          flex: 1,
                          padding: "7px 12px",
                          background: "#2A0F3A",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Record Sign-Off Decision
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Review Modal */}
          {selectedOrderForRx && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 16,
              }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  maxWidth: 480,
                  width: "100%",
                  padding: 24,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "#1F2937" }}>
                  Pharmacist Prescription Decision
                </h3>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                  Order #{selectedOrderForRx.id.slice(-6)} • Patient: {selectedOrderForRx.shipping?.fullName}
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Pharmacist Clinical Notes / Reason
                  </label>
                  <textarea
                    rows={3}
                    value={rxPharmacistNote}
                    onChange={(e) => setRxPharmacistNote(e.target.value)}
                    placeholder="e.g. Verified doctor registration and dosage form matches prescribed course."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #D1D5DB",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForRx(null)}
                    style={{
                      padding: "8px 16px",
                      background: "#F3F4F6",
                      color: "#374151",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrescriptionDecision(selectedOrderForRx.id, "rejected")}
                    style={{
                      padding: "8px 16px",
                      background: "#DC2626",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reject Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrescriptionDecision(selectedOrderForRx.id, "approved")}
                    style={{
                      padding: "8px 16px",
                      background: "#16A34A",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Approve &amp; Release
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: INVENTORY QUICK ADJUSTER ─── */}
      {activeSubTab === "inventory" && (
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", padding: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
              Formulation Inventory &amp; Stock Count
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>
              Quick warehouse adjustment without opening full product catalog editor.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Formulation</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Category</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Price (MRP)</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Current Units</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Stock Status</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stock = p.stock ?? 15;
                  const isLow = stock <= 5;
                  const isOut = stock === 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1F2937" }}>{p.name}</td>
                      <td style={{ padding: "12px 14px", color: "#6B7280" }}>{p.category || "General"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 700 }}>₹{p.price}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: isOut ? "#DC2626" : isLow ? "#D97706" : "#059669" }}>
                          {stock} units
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isOut ? "#FEE2E2" : isLow ? "#FEF3C7" : "#DCFCE7",
                            color: isOut ? "#991B1B" : isLow ? "#92400E" : "#166534",
                          }}
                        >
                          {isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "OPTIMAL"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(p.id, Math.max(0, stock - 5))}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: "#F3F4F6",
                              border: "1px solid #D1D5DB",
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(p.id, stock + 10)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: "#F3F4F6",
                              border: "1px solid #D1D5DB",
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(p.id, stock + 50)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: "#2A0F3A",
                              color: "#FFFFFF",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            +50 Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SHIFT HANDOVER & LOG ─── */}
      {activeSubTab === "handover" && (
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", padding: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
              Operations Shift Handover Log
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>
              Internal operational notes between warehouse packing, dispatch teams, and pharmacist shifts.
            </p>
          </div>

          <form onSubmit={handleAddHandoverNote} style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Record handover note (e.g. 40 units of Liko-Q packed, carrier courier pickup scheduled at 4 PM)..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: 6,
                background: "linear-gradient(135deg, #D4AF37 0%, #B45309 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
              }}
            >
              Add Note
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {handoverNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  background: "#FAF8F5",
                  border: "1px solid #EAE6DF",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#2A0F3A" }}>{note.author}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "#E0E7FF",
                        color: "#3730A3",
                        fontWeight: 700,
                      }}
                    >
                      {note.shift} Shift
                    </span>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{note.timestamp}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
