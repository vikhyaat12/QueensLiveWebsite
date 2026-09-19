"use client";

import { useEffect, useState, use } from "react";

interface OrderLine {
  id?: string;
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  name?: string;
  sku?: string;
  product?: {
    name?: string;
    price?: number;
    slug?: string;
  };
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

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
        }
      } catch {}
      setLoading(false);
    })();
  }, [orderId]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Generating packing slip…</div>;
  }

  if (!order) {
    return <div style={{ padding: 40, textAlign: "center" }}>Order not found.</div>;
  }

  const lines = order.lines || [];
  const totalUnits = lines.reduce((acc, l) => acc + (l.quantity || 1), 0);

  return (
    <div style={{ background: "#f5f6f8", minHeight: "100vh", padding: "30px 20px" }}>
      {/* Control Actions (No-print) */}
      <div
        className="no-print"
        style={{
          maxWidth: 800,
          margin: "0 auto 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          padding: "12px 20px",
          borderRadius: 6,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Packing Slip — Order #{order.id}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "8px 18px",
              background: "#240e35",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🖨️ Print Packing Slip
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable Sheet (A4 Sheet Style) */}
      <div
        className="slip-container"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "#fff",
          padding: "40px",
          border: "1px solid #e0e0e0",
          fontFamily: "Arial, sans-serif",
          color: "#222",
          boxSizing: "border-box",
        }}
      >
        {/* Header Letterhead */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #240e35", paddingBottom: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#240e35", letterSpacing: "-0.02em" }}>
              QUEENS CARE LABORATORIES
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#555", lineHeight: 1.4 }}>
              Queens Care House, Plot 42, Health City, Mumbai 400001
              <br />
              Drug Lic: MH-MZ4-2024-QC09 | GSTIN: 27AABCQ1234F1Z5
              <br />
              Support: care@queenscare.in | Toll-free: +91 1800 123 7833
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#240e35" }}>
              PACKING SLIP
            </span>
            <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 700 }}>
              Order #{order.id}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#666" }}>
              Date: {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Customer & Shipping Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28, fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 4, background: "#fafafa" }}>
            <b style={{ fontSize: 13, display: "block", marginBottom: 6, color: "#240e35" }}>SHIP TO:</b>
            <p style={{ margin: 0, fontWeight: 700 }}>{order.shipping?.fullName || "Customer"}</p>
            <p style={{ margin: "4px 0" }}>{order.shipping?.address}</p>
            <p style={{ margin: "4px 0" }}>
              {order.shipping?.city}, {order.shipping?.state} — {order.shipping?.pincode}
            </p>
            <p style={{ margin: "6px 0 0", color: "#555" }}>Phone: {order.shipping?.phone}</p>
          </div>

          <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 4, background: "#fafafa" }}>
            <b style={{ fontSize: 13, display: "block", marginBottom: 6, color: "#240e35" }}>ORDER & DISPATCH METRICS:</b>
            <p style={{ margin: "2px 0" }}>Payment Method: <b style={{ textTransform: "uppercase" }}>{order.paymentMethod || "COD"}</b></p>
            <p style={{ margin: "2px 0" }}>Payment Status: <b style={{ textTransform: "uppercase" }}>{order.paymentStatus || "pending"}</b></p>
            <p style={{ margin: "2px 0" }}>Tracking Code: <b style={{ fontFamily: "monospace" }}>{order.trackingCode || "PENDING"}</b></p>
            <p style={{ margin: "2px 0" }}>Total Line Items: <b>{lines.length} items ({totalUnits} units)</b></p>
          </div>
        </div>

        {/* Itemized Picking Table */}
        <div style={{ marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f0edf3", borderBottom: "2px solid #240e35" }}>
                <th style={{ padding: "8px 10px", textAlign: "left", width: "40px" }}>#</th>
                <th style={{ padding: "8px 10px", textAlign: "left" }}>Product Formulation</th>
                <th style={{ padding: "8px 10px", textAlign: "left", width: "120px" }}>SKU / Batch</th>
                <th style={{ padding: "8px 10px", textAlign: "center", width: "70px" }}>Qty</th>
                <th style={{ padding: "8px 10px", textAlign: "center", width: "60px" }}>Pick [✓]</th>
                <th style={{ padding: "8px 10px", textAlign: "right", width: "90px" }}>Unit Price</th>
                <th style={{ padding: "8px 10px", textAlign: "right", width: "90px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const name = line.product?.name || line.name || "Formulation";
                const sku = line.sku || line.product?.slug || line.productId || "QC-MED";
                const qty = line.quantity || 1;
                const price = line.unitPrice || line.product?.price || 0;
                const totalLine = qty * price;

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px", color: "#666" }}>{idx + 1}</td>
                    <td style={{ padding: "10px" }}>
                      <b>{name}</b>
                    </td>
                    <td style={{ padding: "10px", fontFamily: "monospace", fontSize: 11, color: "#555" }}>
                      {sku}
                    </td>
                    <td style={{ padding: "10px", textAlign: "center", fontWeight: 700 }}>{qty}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <div style={{ width: 16, height: 16, border: "1px solid #777", margin: "0 auto" }} />
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>{inr(price)}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{inr(totalLine)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 30 }}>
          <div style={{ width: 280, fontSize: 12, lineHeight: 1.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>Subtotal:</span>
              <span>{inr(order.subtotal || order.total)}</span>
            </div>
            {order.discount ? (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#2e7d32" }}>
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}:</span>
                <span>- {inr(order.discount)}</span>
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>Shipping Fee:</span>
              <span>{order.shippingFee ? inr(order.shippingFee) : "FREE"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "2px solid #222", marginTop: 4, fontWeight: 900, fontSize: 14 }}>
              <span>Total Invoice Amount:</span>
              <span>{inr(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Pharmacist Signoff & QC Verification Box */}
        <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 4, background: "#fcfcfc" }}>
          <b style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 10, color: "#240e35" }}>
            PHARMACEUTICAL QUALITY & PACKAGING SIGN-OFF
          </b>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, fontSize: 11 }}>
            <div>
              <p style={{ margin: "0 0 24px", color: "#555" }}>Picked By:</p>
              <div style={{ borderBottom: "1px solid #000", width: "90%" }} />
              <span style={{ fontSize: 9, color: "#777" }}>Warehouse Executive / Date</span>
            </div>

            <div>
              <p style={{ margin: "0 0 24px", color: "#555" }}>Inspected & Verified By:</p>
              <div style={{ borderBottom: "1px solid #000", width: "90%" }} />
              <span style={{ fontSize: 9, color: "#777" }}>Registered Pharmacist Stamp</span>
            </div>

            <div style={{ lineHeight: 1.8 }}>
              <div>[ ] Batch & Expiry Verified</div>
              <div>[ ] Tamper Seal Affixed</div>
              <div>[ ] Patient Leaflet Included</div>
            </div>
          </div>
        </div>

        {/* Return & Care Notice */}
        <p style={{ fontSize: 9, color: "#777", textAlign: "center", marginTop: 24, margin: "24px 0 0" }}>
          This document is generated by Queens Care Laboratories fulfillment system. Pharmaceutical items must be kept in clean, cool conditions.
          For returns or verification inquiries, reach out to care@queenscare.in within 48 hours of receipt.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            padding: 0 !important;
          }
          .slip-container {
            border: none !important;
            padding: 20px !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
