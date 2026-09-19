"use client";

import { useEffect, useState, use } from "react";

interface OrderDetail {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  total: number;
  trackingCode?: string;
  shipping?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  lines?: Array<{
    name?: string;
    quantity?: number;
    unitPrice?: number;
    product?: { name?: string };
  }>;
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function DeliverySignaturePage({ params }: { params: Promise<{ id: string }> }) {
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
    return <div style={{ padding: 40, textAlign: "center" }}>Generating signature sheet…</div>;
  }

  if (!order) {
    return <div style={{ padding: 40, textAlign: "center" }}>Order not found.</div>;
  }

  const isCod =
    (order.paymentMethod || "").toLowerCase() === "cod" ||
    (order.paymentStatus || "").toLowerCase() === "cod_pending";

  const trackingCode = order.trackingCode || `QC${order.id.replace(/[^0-9A-Z]/gi, "").slice(-8).toUpperCase()}`;

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
          Proof of Delivery (POD) & Courier Signature Run Sheet
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
            🖨️ Print POD Sheet
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

      {/* Printable Sheet */}
      <div
        className="pod-container"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "#fff",
          padding: "40px",
          border: "2px solid #000",
          fontFamily: "Arial, sans-serif",
          color: "#000",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #000", paddingBottom: 14, marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 800 }}>
              COURIER DISPATCH & PROOF OF DELIVERY
            </span>
            <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 900 }}>
              QUEENS CARE LABORATORIES
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#444" }}>
              Pharmaceutical Logistics & Secure Chain of Custody
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 14, fontWeight: 900, border: "2px solid #000", padding: "4px 10px", display: "inline-block" }}>
              MANIFEST / POD
            </span>
            <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 700 }}>
              AWB: {trackingCode}
            </p>
          </div>
        </div>

        {/* Order Details Banner */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 16px", background: "#f5f5f5", border: "1px solid #000", marginBottom: 20, fontSize: 11 }}>
          <div>
            <span style={{ color: "#555", display: "block" }}>Order Reference:</span>
            <b style={{ fontSize: 12, fontFamily: "monospace" }}>#{order.id}</b>
          </div>
          <div>
            <span style={{ color: "#555", display: "block" }}>Dispatch Date:</span>
            <b>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</b>
          </div>
          <div>
            <span style={{ color: "#555", display: "block" }}>Destination PIN:</span>
            <b style={{ fontSize: 13 }}>{order.shipping?.pincode || "—"}</b>
          </div>
        </div>

        {/* Consignee Info & Cash Instruction */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Recipient Box */}
          <div style={{ border: "2px solid #000", padding: 14 }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              CONSIGNEE / DELIVER TO:
            </span>
            <h3 style={{ margin: "6px 0", fontSize: 16, fontWeight: 900 }}>
              {order.shipping?.fullName || "Customer"}
            </h3>
            <p style={{ margin: "0 0 6px", fontSize: 12, lineHeight: 1.4 }}>
              {order.shipping?.address}
              <br />
              {order.shipping?.city}, {order.shipping?.state} — {order.shipping?.pincode}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 800 }}>
              PRIMARY CONTACT: {order.shipping?.phone}
            </p>
          </div>

          {/* COD or Prepaid Alert Box */}
          <div
            style={{
              border: "3px solid #000",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              textAlign: "center",
              background: isCod ? "#fff" : "#f7f7f7",
            }}
          >
            {isCod ? (
              <div>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", color: "#c62828" }}>
                  ★ CASH ON DELIVERY ★
                </span>
                <div style={{ fontSize: 22, fontWeight: 900, margin: "6px 0" }}>
                  {inr(order.total)}
                </div>
                <span style={{ fontSize: 9, fontWeight: 700 }}>
                  COLLECT EXACT CASH AMOUNT
                </span>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: 14, fontWeight: 900, display: "block" }}>
                  PREPAID ORDER
                </span>
                <div style={{ fontSize: 18, fontWeight: 900, margin: "6px 0" }}>
                  ₹0 TO COLLECT
                </div>
                <span style={{ fontSize: 9, color: "#444" }}>
                  No payment required upon delivery
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Package Checklist */}
        <div style={{ border: "1px solid #000", padding: "12px 16px", marginBottom: 24, fontSize: 11, background: "#fafafa" }}>
          <b style={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
            DELIVERY EXECUTIVE VERIFICATION CHECKLIST
          </b>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>[ ] External box intact & seal undamaged</div>
            <div>[ ] Customer identity confirmed</div>
            <div>[ ] Cash / OTP verified (if applicable)</div>
          </div>
        </div>

        {/* Signatures Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* Customer Signature Box */}
          <div style={{ border: "2px solid #000", padding: 16 }}>
            <b style={{ fontSize: 12, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              1. CUSTOMER ACKNOWLEDGEMENT (POD)
            </b>
            <p style={{ fontSize: 10, color: "#444", lineHeight: 1.4, margin: "0 0 40px" }}>
              &quot;I hereby acknowledge receipt of the pharmaceutical package in sealed, undamaged condition.&quot;
            </p>

            <div style={{ borderBottom: "1px solid #000", marginBottom: 6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555" }}>
              <span>Customer Signature</span>
              <span>Date: _____ / _____ / 2026</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 10 }}>
              Received by (Printed Name): __________________________
            </div>
          </div>

          {/* Delivery Agent Signature Box */}
          <div style={{ border: "2px solid #000", padding: 16 }}>
            <b style={{ fontSize: 12, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              2. COURIER / DELIVERY EXECUTIVE
            </b>
            <div style={{ fontSize: 11, lineHeight: 1.8, margin: "0 0 16px" }}>
              <div>Courier Partner: ___________________________</div>
              <div>Agent Name / Staff ID: ______________________</div>
              <div>Delivery Time: ________:________ AM / PM</div>
            </div>

            <div style={{ borderBottom: "1px solid #000", marginBottom: 6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555" }}>
              <span>Executive Signature</span>
              <span>Attempt: [✓] Successful</span>
            </div>
          </div>
        </div>

        {/* Remarks Box */}
        <div style={{ border: "1px solid #000", padding: 12, fontSize: 11 }}>
          <b>EXECUTIVE REMARKS / EXCEPTIONS:</b>
          <div style={{ height: 28, borderBottom: "1px dashed #777", marginTop: 4 }} />
        </div>
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
          .pod-container {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            max-width: 100% !important;
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
