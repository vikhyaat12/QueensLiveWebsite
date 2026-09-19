"use client";

import Link from "next/link";
import React from "react";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";
import { sanitizeHtml } from "@/lib/sanitize";

export type OurStoryData = {
  title?: string;
  subtitle?: string;
  heroEyebrow?: string;
  heroHeading?: string;
  heroLead?: string;
  heroImage?: string;
  heroVideo?: string;
  originHeading?: string;
  originText?: string;
  stat1Number?: string;
  stat1Label?: string;
  stat2Number?: string;
  stat2Label?: string;
  stat3Number?: string;
  stat3Label?: string;
  sections?: Array<{ heading: string; text: string }>;
  milestones?: Array<{ year: string; title: string; description: string }>;
  ctaHeading?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
  textColor?: string;
};

export default function OurStoryClient({ initialData }: { initialData: OurStoryData }) {
  const d = initialData || {};

  return (
    <div
      style={{
        background: d.backgroundColor || "var(--paper, #FAF8F5)",
        color: d.textColor || "var(--ink, #180524)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <QueensCareHeader activePage="about" />

      <main style={{ flex: 1, maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", width: "100%" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--purple, #2A0F3A)",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
            }}
          >
            ← Return to Queens Care
          </Link>
        </div>

        {/* Hero Section */}
        <section style={{ marginBottom: 60 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".15em",
              color: "var(--gold, #D4AF37)",
              marginBottom: 12,
            }}
          >
            {d.heroEyebrow || "QUEENS CARE LABORATORIES"}
          </p>
          <h1
            style={{
              font: "clamp(34px, 5vw, 56px)/1.1 var(--font-display, serif)",
              letterSpacing: "-.02em",
              color: "var(--purple, #2A0F3A)",
              maxWidth: 850,
              margin: "0 0 24px",
            }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(d.heroHeading || "Born from clinical rigor. <em>Formulated for life.</em>"),
            }}
          />
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              lineHeight: 1.7,
              color: "var(--muted, #666)",
              maxWidth: 780,
              margin: 0,
            }}
          >
            {d.heroLead ||
              "We founded Queens Care Laboratories on a singular conviction: that the products living on your vanity, medicine cabinet, and bedside table should be held to the same unyielding pharmaceutical benchmarks as hospital-grade medicine."}
          </p>
        </section>

        {/* Hero Media */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            maxHeight: 520,
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 60,
            border: "1px solid var(--line, #e2dcd5)",
            background: "#180524",
          }}
        >
          {d.heroVideo ? (
            <video
              src={d.heroVideo}
              controls
              autoPlay
              muted
              loop
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={d.heroImage || "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=85"}
              alt="Queens Care Cleanroom Formulations"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=85";
              }}
            />
          )}
        </div>

        {/* 3 Key Clinical Verification Stats */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginBottom: 80,
          }}
        >
          <div
            style={{
              padding: "28px 24px",
              background: "#fff",
              border: "1px solid var(--line, #e2dcd5)",
              borderRadius: 6,
            }}
          >
            <b style={{ fontSize: 36, color: "var(--purple, #2A0F3A)", display: "block", marginBottom: 6 }}>
              {d.stat1Number || "100%"}
            </b>
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted, #666)" }}>
              {d.stat1Label || "Batch Verified Purity"}
            </span>
          </div>
          <div
            style={{
              padding: "28px 24px",
              background: "#fff",
              border: "1px solid var(--line, #e2dcd5)",
              borderRadius: 6,
            }}
          >
            <b style={{ fontSize: 36, color: "var(--purple, #2A0F3A)", display: "block", marginBottom: 6 }}>
              {d.stat2Number || "GMP / ISO"}
            </b>
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted, #666)" }}>
              {d.stat2Label || "Certified Laboratory"}
            </span>
          </div>
          <div
            style={{
              padding: "28px 24px",
              background: "#fff",
              border: "1px solid var(--line, #e2dcd5)",
              borderRadius: 6,
            }}
          >
            <b style={{ fontSize: 36, color: "var(--purple, #2A0F3A)", display: "block", marginBottom: 6 }}>
              {d.stat3Number || "0.0%"}
            </b>
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted, #666)" }}>
              {d.stat3Label || "Synthetic Diluents"}
            </span>
          </div>
        </section>

        {/* Origin & Founding Narrative */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr",
            gap: 48,
            alignItems: "start",
            marginBottom: 80,
            padding: "48px 0",
            borderTop: "1px solid var(--line, #e2dcd5)",
            borderBottom: "1px solid var(--line, #e2dcd5)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".12em",
                color: "var(--gold, #D4AF37)",
                display: "block",
                marginBottom: 10,
              }}
            >
              Founding Conviction
            </span>
            <h2
              style={{
                font: "clamp(26px, 3.5vw, 36px)/1.2 var(--font-display, serif)",
                color: "var(--purple, #2A0F3A)",
                margin: 0,
              }}
            >
              {d.originHeading || "The Queens Care Origin"}
            </h2>
          </div>
          <div style={{ fontSize: 17, lineHeight: 1.85, color: "var(--ink, #180524)", whiteSpace: "pre-line" }}>
            {d.originText ||
              "In 2023, our founding team of pharmaceutical formulation chemists and clinical investigators observed an alarming divergence: wellness products were flooded with marketing claims but under-dosed actives, while traditional pharmaceuticals felt clinical, impersonal, and distant.\n\nWe set out to unite both worlds — therapeutic purity, precision concentration, and considered daily ritual."}
          </div>
        </section>

        {/* Formulation Principles / Pillars */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".12em",
                color: "var(--gold, #D4AF37)",
              }}
            >
              Our Formulation Pillars
            </span>
            <h2
              style={{
                font: "clamp(26px, 3.5vw, 38px) var(--font-display, serif)",
                color: "var(--purple, #2A0F3A)",
                margin: "10px 0 0",
              }}
            >
              Clinical Intelligence in Every Drop
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {(d.sections || [
              {
                heading: "Pharmaceutical Rigor",
                text: "Every formula begins with double-blind peer-reviewed literature, validated dosing protocols, and stringent heavy-metal assays.",
              },
              {
                heading: "Uncompromising Transparency",
                text: "Full batch disclosure, certificates of analysis on demand, and active ingredient percentages printed clearly on every bottle.",
              },
              {
                heading: "Considered Sensory Ritual",
                text: "Health is sustained by habits. We craft textures, aromas, and packaging that elevate self-care into a moment of intentional pause.",
              },
            ]).map((sec, idx) => (
              <div
                key={idx}
                style={{
                  padding: "32px 28px",
                  background: "#fff",
                  border: "1px solid var(--line, #e2dcd5)",
                  borderRadius: 6,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    font: "18px var(--font-display, serif)",
                    color: "var(--gold, #D4AF37)",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  0{idx + 1}
                </span>
                <h3
                  style={{
                    font: "22px var(--font-display, serif)",
                    color: "var(--purple, #2A0F3A)",
                    margin: "0 0 12px",
                  }}
                >
                  {sec.heading}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--muted, #666)", margin: 0 }}>
                  {sec.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Milestone Timeline */}
        {d.milestones && d.milestones.length > 0 && (
          <section style={{ marginBottom: 80 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".12em",
                  color: "var(--gold, #D4AF37)",
                }}
              >
                Chronology of Progress
              </span>
              <h2
                style={{
                  font: "clamp(26px, 3.5vw, 38px) var(--font-display, serif)",
                  color: "var(--purple, #2A0F3A)",
                  margin: "10px 0 0",
                }}
              >
                The Queens Care Journey
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20,
              }}
            >
              {d.milestones.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "24px 20px",
                    background: "#fff",
                    border: "1px solid var(--line, #e2dcd5)",
                    borderTop: "3px solid var(--purple, #2A0F3A)",
                    borderRadius: 4,
                  }}
                >
                  <b style={{ fontSize: 24, color: "var(--gold, #D4AF37)", display: "block", marginBottom: 6 }}>
                    {m.year}
                  </b>
                  <h4 style={{ font: "17px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 8px" }}>
                    {m.title}
                  </h4>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted, #666)", margin: 0 }}>
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA Banner */}
        <section
          style={{
            padding: "56px 36px",
            background: "var(--purple, #2A0F3A)",
            color: "#fff",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              font: "clamp(26px, 4vw, 40px) var(--font-display, serif)",
              letterSpacing: "-.01em",
              margin: "0 0 16px",
            }}
          >
            {d.ctaHeading || "Experience pharmaceutical-grade personal care."}
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.8)",
              maxWidth: 600,
              margin: "0 auto 28px",
              lineHeight: 1.6,
            }}
          >
            Discover formulations designed with biological precision and therapeutic intent.
          </p>
          <Link
            href={d.ctaLink || "/#collection"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              background: "var(--gold, #D4AF37)",
              color: "#180524",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              borderRadius: 4,
            }}
          >
            {d.ctaText || "Explore Our Formulations"} <span>→</span>
          </Link>
        </section>
      </main>
      <QueensCareFooter />
    </div>
  );
}
