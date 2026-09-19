"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface OrderLine {
  id?: string;
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  name?: string;
  image?: string;
  product?: {
    name?: string;
    image?: string;
    price?: number;
    slug?: string;
  };
}

interface OrderHistoryItem {
  id?: string;
  status: string;
  note?: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  couponCode?: string;
  total: number;
  trackingCode?: string;
  lines?: OrderLine[];
  shipping?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

const LIFECYCLE_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        if (res.status === 401) {
          router.push("/account");
          return;
        }
        if (res.status === 404) {
          if (active) setError("Order not found or you do not have permission to view it.");
          if (active) setLoading(false);
          return;
        }
        const data = await res.json();
        if (active && data.order) {
          setOrder(data.order);
          setHistory(data.history || []);
        } else if (active) {
          setError(data.error || "Unable to load order details.");
        }
      } catch {
        if (active) setError("A network error occurred while fetching order details.");
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [orderId, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper, #faf9f6)", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--muted, #666)" }}>Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper, #faf9f6)", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", background: "#fff", padding: 32, borderRadius: 8, border: "1px solid var(--line, #e6e4ea)" }}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>⚠️</span>
          <h2 style={{ font: "22px var(--font-display, serif)", margin: "0 0 10px", color: "var(--purple, #240e35)" }}>
            Unable to View Order
          </h2>
          <p style={{ fontSize: 13, color: "var(--muted, #666)", lineHeight: 1.6, marginBottom: 20 }}>
            {error || "This order could not be found."}
          </p>
          <Link
            href="/account/orders"
            style={{
              padding: "10px 20px",
              background: "var(--purple, #240e35)",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ← Back to Your Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = (order.status || "pending").toLowerCase();
  const isCancelled = currentStatus === "cancelled";
  const isRejected = currentStatus === "rejected";
  const isRefunded = currentStatus === "refunded";
  const isTerminal = isCancelled || isRejected || isRefunded;

  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === currentStatus);
  const effectiveStepIndex = currentStepIndex !== -1 ? currentStepIndex : 0;

  const lines = order.lines || [];
  const subtotal = order.subtotal !== undefined ? order.subtotal : order.total;
  const discount = order.discount || 0;
  const shippingFee = order.shippingFee || 0;
  const total = order.total;

  return (
    <div className="order-detail-page" style={{ minHeight: "100vh", background: "var(--paper, #faf9f6)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Navigation Breadcrumb */}
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted, #666)", marginBottom: 20 }}>
          <Link href="/account" style={{ color: "inherit", textDecoration: "none" }}>
            Account
          </Link>
          <span>/</span>
          <Link href="/account/orders" style={{ color: "inherit", textDecoration: "none" }}>
            Orders
          </Link>
          <span>/</span>
          <span style={{ color: "var(--purple, #240e35)", fontWeight: 600 }}>#{order.id.slice(0, 16)}</span>
        </div>

        {/* Order Header */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            border: "1px solid var(--line, #e6e4ea)",
            padding: "24px 28px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
              Queens Care Laboratories
            </span>
            <h1 style={{ font: "28px var(--font-display, serif)", margin: "4px 0 6px", color: "var(--purple, #240e35)" }}>
              Order #{order.id}
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted, #666)" }}>
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href={`/account/orders/${encodeURIComponent(order.id)}/invoice`}
              style={{
                padding: "9px 16px",
                background: "var(--purple, #240e35)",
                color: "#fff",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>📄</span> View Tax Invoice
            </Link>

            <a
              href={`/api/orders/${encodeURIComponent(order.id)}/invoice/pdf?download=1`}
              style={{
                padding: "9px 16px",
                background: "#f3eef8",
                border: "1px solid var(--purple, #240e35)",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--purple, #240e35)",
              }}
            >
              <span>📥</span> Download PDF
            </a>

            <button
              onClick={handlePrint}
              style={{
                padding: "9px 16px",
                background: "#fff",
                border: "1px solid var(--line, #ccc)",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--ink, #222)",
              }}
            >
              <span>🖨️</span> Print Order
            </button>

            <Link
              href="/#contact"
              style={{
                padding: "9px 16px",
                background: "var(--purple, #240e35)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Need Help? Support
            </Link>
          </div>
        </div>

        {/* Live Order Tracking Progress */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            border: "1px solid var(--line, #e6e4ea)",
            padding: "24px 28px",
            marginBottom: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ font: "18px var(--font-display, serif)", margin: 0, color: "var(--purple, #240e35)" }}>
              Shipment Status
            </h3>
            {order.trackingCode && (
              <span style={{ fontSize: 12, color: "var(--muted, #666)", background: "#f5f5f5", padding: "4px 10px", borderRadius: 4 }}>
                Tracking Code: <b style={{ fontFamily: "monospace" }}>{order.trackingCode}</b>
              </span>
            )}
          </div>

          {isTerminal ? (
            <div
              style={{
                padding: 16,
                background: isCancelled ? "#fff5f5" : "#fbf2f2",
                border: "1px solid #ffcdd2",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>🛑</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#c62828", textTransform: "capitalize" }}>
                  Order {currentStatus}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                  {history.find((h) => h.status === currentStatus)?.note ||
                    "This order has been ended and is no longer being processed."}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Stepper Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${LIFECYCLE_STEPS.length}, 1fr)`,
                  position: "relative",
                  gap: 4,
                  alignItems: "flex-start",
                }}
              >
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isCompleted = idx <= effectiveStepIndex;
                  const isCurrent = idx === effectiveStepIndex;

                  return (
                    <div key={step.key} style={{ textAlign: "center", position: "relative" }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          margin: "0 auto 8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          background: isCompleted ? "var(--purple, #240e35)" : "#f0f0f0",
                          color: isCompleted ? "#fff" : "#999",
                          border: isCurrent ? "3px solid var(--gold, #d4af37)" : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        {isCompleted && idx < effectiveStepIndex ? "✓" : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCompleted ? "var(--purple, #240e35)" : "#888",
                          display: "block",
                          lineHeight: 1.2,
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Timeline History */}
          {history.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px dashed var(--line, #e6e4ea)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted, #666)", display: "block", marginBottom: 12 }}>
                Milestone Updates
              </span>
              <div style={{ display: "grid", gap: 8 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 12 }}>
                    <span style={{ color: "var(--muted, #888)", fontFamily: "monospace", minWidth: 140 }}>
                      {new Date(h.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span style={{ fontWeight: 600, textTransform: "capitalize", color: "var(--purple, #240e35)" }}>
                      {h.status.replace(/_/g, " ")}
                    </span>
                    {h.note && <span style={{ color: "#555" }}>— {h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Grid: Products + Shipping/Payment Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Order Items List */}
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              border: "1px solid var(--line, #e6e4ea)",
              padding: "24px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <h3 style={{ font: "18px var(--font-display, serif)", margin: "0 0 16px", color: "var(--purple, #240e35)" }}>
              Formulations Ordered ({lines.length})
            </h3>

            <div style={{ display: "grid", gap: 16 }}>
              {lines.map((item, index) => {
                const name = item.product?.name || item.name || "Formulation";
                const image = item.product?.image || item.image || "/uploads/logos/queens-care-official-original.png";
                const unitPrice = item.unitPrice || item.product?.price || 0;
                const qty = item.quantity || 1;
                const lineTotal = unitPrice * qty;

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      paddingBottom: 16,
                      borderBottom: index !== lines.length - 1 ? "1px solid var(--line, #f0f0f0)" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        position: "relative",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "#f9f8fa",
                        flexShrink: 0,
                        border: "1px solid var(--line, #eee)",
                      }}
                    >
                      <Image src={image} alt={name} fill style={{ objectFit: "contain", padding: 4 }} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--purple, #240e35)" }}>
                        {name}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--muted, #666)" }}>
                        Quantity: <b>{qty}</b> × {inr(unitPrice)}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--purple, #240e35)" }}>
                        {inr(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Address & Price Breakdown */}
          <div style={{ display: "grid", gap: 20 }}>
            {/* Delivery Address Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid var(--line, #e6e4ea)",
                padding: "20px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <h3 style={{ font: "16px var(--font-display, serif)", margin: "0 0 12px", color: "var(--purple, #240e35)" }}>
                Delivery Address
              </h3>
              {order.shipping ? (
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink, #333)" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{order.shipping.fullName || "Valued Customer"}</p>
                  <p style={{ margin: "4px 0" }}>{order.shipping.address}</p>
                  <p style={{ margin: "4px 0" }}>
                    {order.shipping.city}, {order.shipping.state} — {order.shipping.pincode}
                  </p>
                  <p style={{ margin: "6px 0 0", color: "var(--muted, #666)", fontSize: 12 }}>
                    Phone: {order.shipping.phone}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "var(--muted, #666)", margin: 0 }}>
                  Standard Delivery Address
                </p>
              )}
            </div>

            {/* Price Breakdown Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid var(--line, #e6e4ea)",
                padding: "20px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <h3 style={{ font: "16px var(--font-display, serif)", margin: "0 0 14px", color: "var(--purple, #240e35)" }}>
                Payment Summary
              </h3>

              <div style={{ display: "grid", gap: 10, fontSize: 13, borderBottom: "1px solid var(--line, #f0f0f0)", paddingBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted, #666)" }}>Subtotal</span>
                  <span>{inr(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#2e7d32" }}>
                    <span>
                      Discount {order.couponCode ? `(${order.couponCode})` : ""}
                    </span>
                    <span>- {inr(discount)}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted, #666)" }}>Shipping Fee</span>
                  <span>{shippingFee === 0 ? "FREE" : inr(shippingFee)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted, #666)" }}>GST / Taxes</span>
                  <span>Inclusive</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--purple, #240e35)" }}>Grand Total</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: "var(--purple, #240e35)" }}>{inr(total)}</span>
              </div>

              <div style={{ marginTop: 14, padding: "10px 12px", background: "#fbfafc", borderRadius: 6, fontSize: 12 }}>
                <span style={{ color: "var(--muted, #666)", display: "block" }}>Payment Method</span>
                <b style={{ textTransform: "uppercase", color: "var(--purple, #240e35)" }}>
                  {order.paymentMethod || "COD"} • {order.paymentStatus || "pending"}
                </b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .order-detail-page {
            padding: 0 !important;
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
