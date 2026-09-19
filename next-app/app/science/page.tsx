/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export default function SciencePage() {
  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <QueensCareHeader activePage="science" />

      <main style={{ flex: 1, padding: "44px 24px 80px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {/* Page Hero */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
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
            <span>🔬</span> Scientific Rigour &amp; Clinical Excellence
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(32px, 4.5vw, 48px)",
              fontWeight: 800,
              color: "#1E1638",
              margin: "0 0 14px",
            }}
          >
            Real Science, Real Results
          </h1>
          <p style={{ fontSize: 16, color: "#64748B", maxWidth: 680, margin: "0 auto", lineHeight: 1.65 }}>
            Every Queens Care formulation is developed at the intersection of pharmaceutical chemistry, botanical pharmacognosy, and rigorous multi-stage analytical validation.
          </p>
        </div>

        {/* 3 Pillars Showcase */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            marginBottom: 48,
          }}
        >
          {[
            {
              icon: "🧪",
              title: "HPLC Analytical Assay Testing",
              desc: "Every raw botanical extract and active pharmaceutical ingredient undergoes High-Performance Liquid Chromatography to verify molecular identity, potency, and purity.",
              badge: "Assay Verified",
            },
            {
              icon: "🏛️",
              title: "Precision Manufacturing Environment",
              desc: "Formulations are produced under controlled, hygiene-managed environments with documented processes at every stage of production.",
              badge: "Controlled Environment",
            },
            {
              icon: "🌱",
              title: "Cellular Bioavailability Matrix",
              desc: "Nutrients are complexed with botanical co-factors and micronutrient synergists to ensure maximum absorption across gastrointestinal membranes without gastric distress.",
              badge: "Max Absorption",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                border: "1.5px solid #E2E8F0",
                padding: "32px 28px",
                boxShadow: "0 4px 20px rgba(42, 15, 58, 0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 32 }}>{item.icon}</span>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#EDE9FE",
                      color: "#6D28D9",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E1638", margin: "0 0 10px", lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Deep Dive Portals Link Banner */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            border: "2px solid #D4AF37",
            padding: "40px",
            boxShadow: "0 10px 30px rgba(42, 15, 58, 0.05)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 36,
            marginBottom: 48,
          }}
          className="science-portals-grid"
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Detailed Laboratory Documentation
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E1638", margin: "6px 0 12px" }}>
              Explore Our Research &amp; Quality Portals
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, margin: "0 0 24px" }}>
              Review our complete chemical assay methodology, stability testing protocols, heavy metal screening certificates, and clinical advisory board credentials.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/research-development"
                style={{
                  padding: "12px 22px",
                  borderRadius: 999,
                  background: "#1E1638",
                  color: "#FFFFFF",
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                R&amp;D Overview →
              </Link>
              <Link
                href="/quality-assurance"
                style={{
                  padding: "12px 20px",
                  borderRadius: 999,
                  background: "#FAFBFD",
                  color: "#1E1638",
                  border: "1px solid #CBD5E1",
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Quality Assurance →
              </Link>
            </div>
          </div>

          <div>
            <div
              style={{
                background: "linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%)",
                borderRadius: 16,
                padding: "24px",
                border: "1px solid #E9D5FF",
              }}
            >
              <b style={{ display: "block", fontSize: 14, color: "#5B21B6", marginBottom: 8 }}>
                🔬 Our Non-Negotiable Purity Standards:
              </b>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#4C1D95", lineHeight: 1.75 }}>
                <li>Zero banned synthetic food colorings (Titanium Dioxide, Tartrazine free).</li>
                <li>Zero harsh binders, synthetic fillers, or unnecessary excipients.</li>
                <li>Batch-specific Certificate of Analysis (CoA) retained for 3 years.</li>
                <li>Inductively Coupled Plasma Mass Spectrometry (ICP-MS) heavy metal screening.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Explore Collection CTA */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/#collection"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 32px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #1E1638 0%, #2A0F3A 100%)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(30, 22, 56, 0.25)",
            }}
          >
            <span>Explore Science-Backed Products</span> <span>➔</span>
          </Link>
        </div>
      </main>

      <QueensCareFooter />
    </div>
  );
}
