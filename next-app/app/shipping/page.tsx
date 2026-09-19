/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export default function ShippingPage() {
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim().length === 6 && /^\d+$/.test(pincode.trim())) {
      setPincodeStatus("✓ Serviceable: Express 24–48hr delivery available with Free Shipping on orders above ₹499.");
    } else {
      setPincodeStatus("Please enter a valid 6-digit Indian postal code.");
    }
  };

  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <QueensCareHeader />

      <main style={{ flex: 1, padding: "44px 24px 80px", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(42, 15, 58, 0.06)",
              color: "#2A0F3A",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <span>🚚</span> Fast &amp; Reliable Pan-India Logistics
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(30px, 4vw, 44px)",
              fontWeight: 800,
              color: "#1E1638",
              margin: "0 0 14px",
            }}
          >
            Shipping &amp; Delivery Policy
          </h1>
          <p style={{ fontSize: 15, color: "#64748B", maxWidth: 640, margin: "0 auto", lineHeight: 1.65 }}>
            Every Queens Care formulation is packed in temperature-controlled cleanroom packaging and dispatched through India&apos;s leading logistics networks.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
            marginBottom: 40,
          }}
        >
          {[
            { icon: "✨", title: "Free Express Shipping", desc: "Enjoy complimentary shipping on all orders over ₹499 across India." },
            { icon: "⚡", title: "Same-Day Dispatch", desc: "Orders confirmed before 2:00 PM IST are dispatched on the same business day." },
            { icon: "🛡️", title: "Tamper-Evident Packaging", desc: "Triple-sealed amber glass & blister safety protecting pharmaceutical bioactivity." },
            { icon: "📍", title: "Real-Time Tracking", desc: "Live SMS and WhatsApp transit notifications with direct courier tracking." },
          ].map((pillar) => (
            <div
              key={pillar.title}
              style={{
                background: "#FFFFFF",
                borderRadius: 18,
                border: "1.5px solid #E2E8F0",
                padding: "24px 20px",
                textAlign: "left",
                boxShadow: "0 4px 16px rgba(42, 15, 58, 0.03)",
              }}
            >
              <span style={{ fontSize: 28, display: "block", marginBottom: 12 }}>{pillar.icon}</span>
              <b style={{ fontSize: 15, color: "#1E1638", display: "block", marginBottom: 6 }}>{pillar.title}</b>
              <span style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, display: "block" }}>{pillar.desc}</span>
            </div>
          ))}
        </div>

        {/* Interactive Pincode Checker Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            border: "2px solid #D4AF37",
            padding: "36px 32px",
            boxShadow: "0 8px 30px rgba(42, 15, 58, 0.05)",
            marginBottom: 44,
          }}
        >
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Instant Delivery Estimator
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E1638", margin: "6px 0 10px" }}>
              Check Delivery Timeline for Your Area
            </h2>
            <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 0 24px" }}>
              Enter your 6-digit postal code to check serviceability and estimated delivery window.
            </p>

            <form onSubmit={checkPincode} style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto" }}>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit pincode"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 999,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  borderRadius: 999,
                  background: "#1E1638",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                Check →
              </button>
            </form>

            {pincodeStatus && (
              <div
                style={{
                  marginTop: 18,
                  padding: "12px 18px",
                  borderRadius: 12,
                  background: pincodeStatus.startsWith("✓") ? "#F0FDF4" : "#FEF2F2",
                  color: pincodeStatus.startsWith("✓") ? "#166534" : "#991B1B",
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${pincodeStatus.startsWith("✓") ? "#BBF7D0" : "#FECACA"}`,
                }}
              >
                {pincodeStatus}
              </div>
            )}
          </div>
        </div>

        {/* Detailed SLA Table & Logistics Information */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            border: "1px solid #E2E8F0",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            marginBottom: 44,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E1638", margin: "0 0 16px" }}>
            Standard Delivery Service Level Agreements (SLAs)
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#FAFBFD", borderBottom: "2px solid #E2E8F0" }}>
                  <th style={{ padding: "14px 16px", color: "#1E1638", fontWeight: 700 }}>Destination Zone</th>
                  <th style={{ padding: "14px 16px", color: "#1E1638", fontWeight: 700 }}>Estimated Transit Time</th>
                  <th style={{ padding: "14px 16px", color: "#1E1638", fontWeight: 700 }}>Shipping Cost</th>
                  <th style={{ padding: "14px 16px", color: "#1E1638", fontWeight: 700 }}>Courier Partners</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1E1638" }}>Tier 1 Metro Cities (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata)</td>
                  <td style={{ padding: "14px 16px", color: "#059669", fontWeight: 700 }}>24 to 48 Hours</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>FREE on orders ≥ ₹499 (Flat ₹50 below)</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>Blue Dart Express, Delhivery Air</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1E1638" }}>Tier 2 &amp; Regional State Capitals</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>2 to 4 Business Days</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>FREE on orders ≥ ₹499 (Flat ₹50 below)</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>Delhivery, DTDC, XpressBees</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1E1638" }}>Rest of India, Remote &amp; Island Territories</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>4 to 6 Business Days</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>FREE on orders ≥ ₹499 (Flat ₹50 below)</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>India Post Speed Post, Blue Dart Surface</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Track Order CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, #2A0F3A 0%, #150520 100%)",
            borderRadius: 20,
            padding: "32px",
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
            border: "1px solid rgba(212, 175, 55, 0.3)",
          }}
        >
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
              Already placed an order with Queens Care?
            </h3>
            <p style={{ fontSize: 13.5, color: "#E2E8F0", margin: 0 }}>
              Track your live package status using your Order ID and phone number.
            </p>
          </div>
          <Link
            href="/track-order"
            style={{
              padding: "12px 26px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #D4AF37 0%, #C59B27 100%)",
              color: "#1E1638",
              fontWeight: 800,
              fontSize: 13.5,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Track My Order</span> <span>➔</span>
          </Link>
        </div>
      </main>

      <QueensCareFooter />
    </div>
  );
}
