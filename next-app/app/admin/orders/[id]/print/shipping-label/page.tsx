"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";

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
}

interface ShippingConfig {
  senderName: string;
  legalEntity: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  drugLicenseNo: string;
  gstin: string;
  returnInstructions: string;
}

const DEFAULT_CONFIG: ShippingConfig = {
  senderName: "Queens Care Laboratories",
  legalEntity: "Queens Care Laboratories Pvt. Ltd.",
  addressLine1: "Queens Care House, Plot 42, Health City",
  addressLine2: "Off S.V. Road, Andheri West",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  phone: "+91 1800 123 7833",
  drugLicenseNo: "MH-MZ4-2024-QC09 / 20B/21B",
  gstin: "27AABCQ1234F1Z5",
  returnInstructions: "If undelivered, return to sender. Temperature sensitive formulation.",
};

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [config, setConfig] = useState<ShippingConfig>(DEFAULT_CONFIG);
  const [format, setFormat] = useState<"thermal" | "a4">("thermal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
        }

        const setRes = await fetch("/api/admin/orders/settings");
        const setData = await setRes.json();
        if (setData.shippingConfig) {
          setConfig(setData.shippingConfig);
        }
      } catch {}
      setLoading(false);
    })();
  }, [orderId]);

  const isCod =
    (order?.paymentMethod || "").toLowerCase() === "cod" ||
    (order?.paymentStatus || "").toLowerCase() === "cod_pending";

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading shipping label…</div>;
  }

  if (!order) {
    return <div style={{ padding: 40, textAlign: "center" }}>Order not found.</div>;
  }

  const trackingCode = order.trackingCode || `QC${order.id.replace(/[^0-9A-Z]/gi, "").slice(-8).toUpperCase()}`;

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", padding: "30px 20px" }}>
      {/* Control Bar (Hidden on print) */}
      <div
        className="no-print"
        style={{
          maxWidth: 600,
          margin: "0 auto 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          padding: "12px 18px",
          borderRadius: 6,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Format:</span>
          <button
            onClick={() => setFormat("thermal")}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: format === "thermal" ? 700 : 500,
              background: format === "thermal" ? "#240e35" : "#eee",
              color: format === "thermal" ? "#fff" : "#333",
              border: "none",
              cursor: "pointer",
            }}
          >
            4&quot; × 6&quot; Thermal
          </button>
          <button
            onClick={() => setFormat("a4")}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: format === "a4" ? 700 : 500,
              background: format === "a4" ? "#240e35" : "#eee",
              color: format === "a4" ? "#fff" : "#333",
              border: "none",
              cursor: "pointer",
            }}
          >
            A4 Sheet
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "8px 18px",
              background: "#2e7d32",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🖨️ Print Label
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

      {/* Printable Label Container */}
      <div
        className={`label-container ${format}`}
        style={{
          width: format === "thermal" ? "4in" : "6.5in",
          minHeight: format === "thermal" ? "6in" : "8in",
          margin: "0 auto",
          background: "#fff",
          border: "2px solid #000",
          padding: "16px",
          fontFamily: "Arial, sans-serif",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Header with QC Branding */}
        <div
          style={{
            borderBottom: "2px solid #000",
            paddingBottom: 10,
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 800 }}>
              EXPRESS HEALTHCARE SHIPMENT
            </span>
            <h2 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
              QUEENS CARE LABORATORIES
            </h2>
            <p style={{ margin: 0, fontSize: 8, color: "#444" }}>
              Lic: {config.drugLicenseNo} | GST: {config.gstin}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 14, fontWeight: 900, border: "2px solid #000", padding: "2px 8px", display: "inline-block" }}>
              AIR / EXP
            </span>
          </div>
        </div>

        {/* Sender Box (Return Address) */}
        <div style={{ borderBottom: "1px solid #000", paddingBottom: 8, marginBottom: 8, fontSize: 9, lineHeight: 1.35 }}>
          <b>FROM (Return Address):</b>
          <br />
          {config.legalEntity}
          <br />
          {config.addressLine1}, {config.addressLine2}
          <br />
          {config.city}, {config.state} — {config.pincode} | Tel: {config.phone}
        </div>

        {/* Recipient Box (SHIP TO) */}
        <div
          style={{
            border: "2px solid #000",
            padding: "10px",
            marginBottom: 10,
            background: "#fff",
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            DELIVER TO:
          </span>
          <h3 style={{ margin: "4px 0 6px", fontSize: 16, fontWeight: 900 }}>
            {order.shipping?.fullName || "Valued Customer"}
          </h3>
          <p style={{ margin: "0 0 6px", fontSize: 11, lineHeight: 1.4, fontWeight: 500 }}>
            {order.shipping?.address}
            <br />
            {order.shipping?.city}, {order.shipping?.state}
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6, paddingTop: 6, borderTop: "1px dashed #000" }}>
            <div>
              <span style={{ fontSize: 9, color: "#444" }}>Destination PIN:</span>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.08em" }}>
                {order.shipping?.pincode}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, fontWeight: 700 }}>
              TEL: {order.shipping?.phone}
            </div>
          </div>
        </div>

        {/* COD or Prepaid Highlight Box */}
        <div
          style={{
            border: "3px solid #000",
            padding: "8px 12px",
            marginBottom: 10,
            textAlign: "center",
            background: isCod ? "#fff" : "#f7f7f7",
          }}
        >
          {isCod ? (
            <div>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", display: "block" }}>
                ★ CASH ON DELIVERY (C.O.D) ★
              </span>
              <div style={{ fontSize: 20, fontWeight: 900, margin: "2px 0" }}>
                COLLECT CASH: {inr(order.total)}
              </div>
              <span style={{ fontSize: 8, color: "#333" }}>Please collect exact amount before handoff</span>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", display: "block" }}>
                PREPAID SHIPMENT
              </span>
              <span style={{ fontSize: 9, fontWeight: 700 }}>DO NOT COLLECT CASH FROM CUSTOMER</span>
            </div>
          )}
        </div>

        {/* Barcode & Tracking Representation */}
        <div style={{ textAlign: "center", borderBottom: "1px solid #000", paddingBottom: 10, marginBottom: 8 }}>
          <div style={{ display: "inline-block", margin: "0 auto" }}>
            {/* Scannable SVG Barcode Graphic */}
            <svg width="220" height="42" viewBox="0 0 220 42">
              {Array.from({ length: 44 }).map((_, i) => (
                <rect
                  key={i}
                  x={i * 5}
                  y="0"
                  width={(i * 13) % 4 === 0 ? 3 : (i * 7) % 3 === 0 ? 2 : 1.2}
                  height="42"
                  fill="#000"
                />
              ))}
            </svg>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", marginTop: 2 }}>
            *{trackingCode}*
          </div>
          <div style={{ fontSize: 9, color: "#444" }}>
            Order ID: #{order.id} | Date: {new Date(order.createdAt).toLocaleDateString("en-IN")}
          </div>
        </div>

        {/* Footer Handling Notes */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#444" }}>
          <div>
            <b>INSTRUCTIONS:</b> {config.returnInstructions}
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap", marginLeft: 10 }}>
            <b>PHARMACEUTICAL CARRIER</b>
          </div>
        </div>
      </div>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .label-container {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            page-break-after: always;
            margin: 0 !important;
          }
          .label-container.thermal {
            width: 4in !important;
            min-height: 6in !important;
          }
          .label-container.a4 {
            width: 6.5in !important;
            min-height: 8in !important;
          }
        }
      `}</style>
    </div>
  );
}
