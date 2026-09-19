"use client";

import { useState } from "react";

type DeliveryResult = {
  serviceable: boolean;
  pincode: string;
  zone?: string;
  deliveryAvailable: boolean;
  estimatedDays?: number;
  estimatedDate?: string;
  deliveryLabel?: string;
  shippingCharge?: number;
  freeShippingEnabled?: boolean;
  freeShippingThreshold?: number;
  freeShippingMessage?: string;
  codAvailable?: boolean;
  sameDayAvailable?: boolean;
  handlingCharge?: number;
  message?: string;
};

export default function DeliveryCalculator({ productPrice = 0 }: { productPrice?: number }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkDelivery = async () => {
    if (!pincode || pincode.length < 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/delivery?pincode=${pincode}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Unable to check delivery");
      }
    } catch {
      setError("Network error — please try again");
    }
    setLoading(false);
  };

  const freeShipping = result?.freeShippingEnabled && productPrice >= (result.freeShippingThreshold || 1500);

  return (
    <div
      style={{
        border: "1px solid #E8DFD0",
        padding: "12px 14px",
        background: "#FAF8F5",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", letterSpacing: ".04em", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span>🚚</span>
          <span>Check Delivery Speed</span>
        </span>
        <span style={{ fontSize: 11, color: "#776D80", fontWeight: 500 }}>
          Direct Laboratory Fulfillment
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: result || error ? 8 : 0 }}>
        <input
          type="text"
          value={pincode}
          onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter 6-digit Pincode"
          onKeyDown={e => e.key === "Enter" && checkDelivery()}
          style={{
            flex: 1,
            height: 36,
            padding: "0 12px",
            border: "1px solid #D1D5DB",
            borderRadius: 4,
            fontSize: 13,
            background: "#fff",
            color: "#1E1638",
            fontFamily: "var(--font-body, inherit)",
          }}
        />
        <button
          onClick={checkDelivery}
          disabled={loading || pincode.length < 6}
          style={{
            height: 36,
            padding: "0 16px",
            background: "#2A0F3A",
            color: "#D4AF37",
            border: "1px solid #D4AF37",
            borderRadius: 4,
            cursor: loading || pincode.length < 6 ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
            opacity: pincode.length < 6 ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
        >
          {loading ? "Checking…" : "Verify"}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 11.5, color: "#DC2626", margin: "4px 0 0", fontWeight: 500 }}>{error}</p>
      )}

      {result && (
        <div style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6, paddingTop: 6, borderTop: "1px solid #EFEAE3" }}>
          {!result.serviceable ? (
            <p style={{ color: "#DC2626", margin: 0, fontWeight: 600 }}>
              ✕ Standard delivery is currently unserviceable to {result.pincode}.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#166534" }}>
                <span>✓</span>
                <span>Express Serviceable to {result.pincode}</span>
                {result.deliveryLabel && (
                  <span style={{ color: "#2A0F3A", fontWeight: 600 }}>· {result.deliveryLabel}</span>
                )}
                {result.estimatedDate && (
                  <span style={{ color: "#554A60", fontWeight: 500 }}> (Est. by {result.estimatedDate})</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", color: "#64748B", fontSize: 11 }}>
                {freeShipping ? (
                  <span style={{ color: "#166534", fontWeight: 600 }}>🚚 Free Delivery Eligible</span>
                ) : result.shippingCharge !== undefined && result.shippingCharge > 0 ? (
                  <span>Shipping: ₹{result.shippingCharge}</span>
                ) : null}
                {result.codAvailable && (
                  <span>· 💵 Cash on Delivery Available</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
