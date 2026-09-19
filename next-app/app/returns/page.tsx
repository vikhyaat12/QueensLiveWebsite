/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export default function ReturnsPage() {
  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <QueensCareHeader />

      <main style={{ flex: 1, padding: "44px 24px 80px", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
        {/* Page Hero */}
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
            <span>🔄</span> 15-Day Care Guarantee
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
            Returns &amp; Refunds Policy
          </h1>
          <p style={{ fontSize: 15, color: "#64748B", maxWidth: 640, margin: "0 auto", lineHeight: 1.65 }}>
            We want you to experience Queens Care formulations with total confidence. If your purchase doesn&apos;t meet your standards, our hassle-free return policy has you covered.
          </p>
        </div>

        {/* 4-Step Return Process Cards */}
        <div style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E1638", textAlign: "center", marginBottom: 24 }}>
            How Our 4-Step Return Process Works
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 18,
            }}
          >
            {[
              {
                step: "01",
                title: "Initiate Request",
                desc: "Visit your Account → Orders page or send your Order ID to our care team via WhatsApp or email.",
              },
              {
                step: "02",
                title: "Free Doorstep Pickup",
                desc: "Our courier partner arranges reverse pickup directly from your doorstep with zero return fee.",
              },
              {
                step: "03",
                title: "Inspection & Verification",
                desc: "Once received at our laboratory facility, our team verifies the batch integrity within 24 hours.",
              },
              {
                step: "04",
                title: "Instant 100% Refund",
                desc: "Full payment is immediately refunded back to your original UPI, NetBanking, or Card within 48 hours.",
              },
            ].map((s) => (
              <div
                key={s.step}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 20,
                  border: "1.5px solid #E2E8F0",
                  padding: "26px 20px",
                  boxShadow: "0 4px 16px rgba(42, 15, 58, 0.03)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "rgba(212, 175, 55, 0.15)",
                    color: "#D4AF37",
                    fontWeight: 850,
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  Step {s.step}
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1E1638", margin: "0 0 8px" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.55 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Guidelines & Eligibility Criteria */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            border: "1px solid #E2E8F0",
            padding: "36px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            marginBottom: 44,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E1638", margin: "0 0 20px" }}>
            Return Conditions &amp; Eligibility
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="return-rules-grid">
            <div>
              <b style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "#059669", marginBottom: 12 }}>
                <span>✓</span> Eligible for Full Refund or Exchange:
              </b>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: "#475569", lineHeight: 1.8 }}>
                <li>Items returned within 15 calendar days from delivery date.</li>
                <li>Products with unopened safety neck-seal and original outer packaging intact.</li>
                <li>Products damaged during courier transit (photos required within 48h of receipt).</li>
                <li>Incorrect product formulation dispatched in error.</li>
                <li>Manufacture quality defects or seal irregularities.</li>
              </ul>
            </div>

            <div>
              <b style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "#DC2626", marginBottom: 12 }}>
                <span>✕</span> Non-Returnable Scenarios:
              </b>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: "#475569", lineHeight: 1.8 }}>
                <li>Formulations with broken inner tamper-evident security foil/seal.</li>
                <li>Requests initiated after 15 calendar days of delivery.</li>
                <li>Products damaged due to improper consumer storage (exposure to direct heat/sunlight).</li>
                <li>Items purchased during final warehouse clearance promotions.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Support Direct Channels */}
        <div
          style={{
            background: "linear-gradient(135deg, #2A0F3A 0%, #150520 100%)",
            borderRadius: 20,
            padding: "36px 32px",
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 24,
            border: "1px solid rgba(212, 175, 55, 0.3)",
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Need Help With a Return?
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 800, margin: "6px 0 8px" }}>
              Our Pharmacist Care Desk is Standing By
            </h3>
            <p style={{ fontSize: 13.5, color: "#E2E8F0", margin: 0 }}>
              Email support at <strong>support@queenscare.in</strong> or speak with a live executive.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/account"
              style={{
                padding: "12px 24px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #D4AF37 0%, #C59B27 100%)",
                color: "#1E1638",
                fontWeight: 800,
                fontSize: 13.5,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Go to My Orders →
            </Link>
            <Link
              href="/contact"
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <QueensCareFooter />
    </div>
  );
}
