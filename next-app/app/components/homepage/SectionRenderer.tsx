"use client";

import Link from "next/link";
import Marquee from "../Marquee";
import UniversalMarquee from "../UniversalMarquee";
import DoctorCharacter from "../DoctorCharacter";
import ScienceResultsCard from "../ScienceResultsCard";
import DrQueensAssistantBanner from "../DrQueensAssistantBanner";
import CinematicHeroStage from "../CinematicHeroStage";
import VideoLightboxModal from "../VideoLightboxModal";
import React, { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import type { HomeShared } from "./shared";

type SectionRendererProps = {
  sec: Record<string, unknown>;
  idx: number;
  shared: HomeShared;
};

export default function SectionRenderer({ sec, idx, shared }: SectionRendererProps) {
  const {
    loading, products, search, setSearch, wish, toggleWish, add, setQuizOpen,
    testimonials, testimonialIndex, setTestimonialIndex, subscribe, shown, getHpContent, blogPosts,
  } = shared;

  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("Queens Care Laboratories — Our Story");
  const [marketplaces, setMarketplaces] = useState<Array<{ id?: string; label: string; url: string; platform?: string; customIconUrl?: string }>>([]);
  const [collSort, setCollSort] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/social-links")
      .then((r) => (r.ok ? r.json() : { links: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.links)) {
          const mkts = data.links.filter((l: Record<string, unknown>) => l.category === "marketplace" || ["amazon", "flipkart", "meesho", "myntra", "ajio", "tata1mg", "pharmeasy", "netmeds", "apollo247", "indiamart", "jiomart", "custom_marketplace"].includes(String(l.platform)));
          if (mkts.length > 0) setMarketplaces(mkts);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

    const type = String(sec.type || "custom");
    const rawContent = sec.content;
    const c = (typeof rawContent === "string" ? JSON.parse(rawContent) : (rawContent as Record<string, unknown>)) || getHpContent(type);

    const secStyle: React.CSSProperties = {
      ...(c.backgroundColor ? { backgroundColor: String(c.backgroundColor) } : {}),
      ...(c.textColor ? { color: String(c.textColor) } : {}),
      ...(c.padding ? { padding: String(c.padding) } : {}),
      ...(c.textAlign ? { textAlign: String(c.textAlign) as React.CSSProperties["textAlign"] } : {}),
      ...(c.maxWidth ? { maxWidth: String(c.maxWidth), margin: "0 auto" } : {}),
      ...(c.sectionRadius ? { borderRadius: String(c.sectionRadius), overflow: "hidden" } : {}),
    };
    const headingStyle: React.CSSProperties = {
      ...(c.headingFontSize ? { fontSize: String(c.headingFontSize) } : {}),
      ...(c.headingFontWeight ? { fontWeight: Number(c.headingFontWeight) } : {}),
      ...(c.headingLetterSpacing ? { letterSpacing: String(c.headingLetterSpacing) } : {}),
    };
    const bodyStyle: React.CSSProperties = {
      ...(c.bodyFontSize ? { fontSize: String(c.bodyFontSize) } : {}),
      ...(c.bodyLineHeight ? { lineHeight: String(c.bodyLineHeight) } : {}),
    };
    const btnStyle: React.CSSProperties = {
      ...(c.buttonBg ? { background: String(c.buttonBg) } : {}),
      ...(c.buttonColor ? { color: String(c.buttonColor) } : {}),
      ...(c.buttonRadius ? { borderRadius: String(c.buttonRadius) } : {}),
    };

    switch (type) {
      case "hero": {
        const heroBg = c.backgroundColor || c.heroBackground;
        const heroImage = c.heroImage || c.imageUrl;
        const heroVis = getHpContent("heroVisual");
        return (
          <>
            <section
            className="hero"
            key={sec.id ? String(sec.id) : `hero-${idx}`}
            style={{
              background: heroBg
                ? String(heroBg)
                : "radial-gradient(circle at 75% 35%, rgba(212, 175, 55, 0.1) 0%, transparent 48%), linear-gradient(135deg, #FAF8F5 0%, #F5F0EB 45%, #EDE9FE 100%)",
              position: "relative",
              overflow: "hidden",
              padding: "32px 5% 24px",
              ...secStyle,
            }}
          >
            <div className="hero-copy" style={{ maxWidth: 490, zIndex: 3, padding: "30px 0 20px" }}>
              <p
                className="qc-eyebrow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "#F3F0FF",
                  color: "#5B21B6",
                  border: "1px solid #DDD6FE",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  width: "fit-content",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                <span>✦</span> {String(c.eyebrow || "CLINICAL RIGOR & TARGETED WELLNESS")}
              </p>
              <h1
                className="qc-heading-display"
                style={{
                  fontSize: "clamp(34px, 4.2vw, 54px)",
                  fontWeight: 700,
                  lineHeight: 1.12,
                  letterSpacing: "-0.025em",
                  color: c.headingColor ? String(c.headingColor) : "#1E1638",
                  margin: "0 0 16px",
                }}
              >
                <span>Better Health.</span>{" "}
                <span style={{ display: "inline-block", fontStyle: "italic", color: "#8A6A45" }}>Brighter Tomorrows.</span>
              </h1>
              <p
                className="qc-body-lead"
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "#475569",
                  maxWidth: 440,
                  margin: "0 0 24px",
                  ...bodyStyle,
                }}
              >
                {String(
                  c.subtitle ||
                    "Scientifically formulated, lab-tested nutraceuticals and targeted bioactives developed with practicing physicians."
                )}
              </p>
              <div
                className="hero-ctas"
                style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginBottom: 26 }}
              >
                <a
                  href={String(c.ctaLink || "#collection")}
                  className="qc-btn qc-btn-primary"
                  style={{
                    boxShadow: "0 8px 24px rgba(42, 15, 58, 0.28)",
                    textDecoration: "none",
                  }}
                >
                  <span>{String(c.ctaText || "Explore Formulations")}</span>
                  <span>→</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const u = String(c.heroVideoUrl || c.videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
                    setVideoUrl(u);
                    setVideoTitle(String(c.heroVideoTitle || c.videoTitle || "Queens Care Laboratories — Clinical Science"));
                    setVideoOpen(true);
                  }}
                  className="qc-btn qc-btn-secondary"
                  style={{ textDecoration: "none" }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#EDE9FE",
                      color: "#6D28D9",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                    }}
                  >
                    ▶
                  </span>
                  <span>{String(c.secondaryText || "Watch Formulation Science")}</span>
                </button>
              </div>

              {/* 4 Official Clinical Trust Signals */}
              <div
                className="hero-trust-badges"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 10,
                  maxWidth: 440,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(30, 22, 56, 0.1)",
                }}
              >
                {[
                  {
                    title: "Batch-Tested",
                    sub: "Before Release",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    ),
                  },
                  {
                    title: "Ingredient Labels",
                    sub: "Fully Transparent",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                    ),
                  },
                  {
                    title: "Heavy Metal",
                    sub: "Tested · Clean",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>
                    ),
                  },
                  {
                    title: "Customer",
                    sub: "Care Support",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                    ),
                  },
                ].map((b, bi) => (
                  <div key={bi} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#FFFFFF",
                        border: "1px solid rgba(30, 22, 56, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 5px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      {b.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#1E293B",
                        lineHeight: 1.2,
                        display: "block",
                      }}
                    >
                      {b.title}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "#64748B",
                        display: "block",
                        marginTop: 1,
                      }}
                    >
                      {b.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cinematic Hero Visual Stage Matching Reference 1:1 */}
            <div
              className="hero-cinematic-stage-wrap"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                margin: "0",
                zIndex: 4,
                pointerEvents: "none",
              }}
            >
              <CinematicHeroStage
                onOpenQuiz={() => setQuizOpen(true)}
                productSlug={String(c.productSlug || "liko-q-suspension")}
                productName={String(c.productName || "Liko Q — Lycopene, Vitamins & Minerals")}
                productImage={String(c.heroProductImage || c.productImage || "/images/hero/likoq-hero-staged.webp")}
                doctorImage={String(c.doctorImage || "/images/hero/dr-queens-hd.webp")}
                mobileDoctorImage={String(c.mobileDoctorImage || "/images/hero/dr-queens-hd.webp")}
                doctorSize={typeof c.doctorSize === "number" ? c.doctorSize : 1.0}
                doctorPositionX={typeof c.doctorPositionX === "number" ? c.doctorPositionX : 0}
                doctorPositionY={typeof c.doctorPositionY === "number" ? c.doctorPositionY : 0}
                doctorAnimEnabled={c.doctorAnimEnabled !== false}
                doctorAnimIntensity={typeof c.doctorAnimIntensity === "number" ? c.doctorAnimIntensity : 1.0}
                parallaxAmount={typeof c.parallaxAmount === "number" ? c.parallaxAmount : 14}
                productScale={typeof c.productScale === "number" ? c.productScale : 1.0}
                productRotation={typeof c.productRotation === "number" ? c.productRotation : 0}
                productPositionX={typeof c.productPositionX === "number" ? c.productPositionX : 0}
                productPositionY={typeof c.productPositionY === "number" ? c.productPositionY : 0}
                product3DEnabled={c.product3DEnabled !== false}
                particleCanvasEnabled={c.particleCanvasEnabled !== false}
                introAnimationEnabled={c.introAnimationEnabled !== false}
                idleAnimationEnabled={c.idleAnimationEnabled !== false}
                speechBubbleEnabled={c.speechBubbleEnabled !== false}
                floatingBenefits={Array.isArray(c.floatingBenefits) ? c.floatingBenefits : undefined}
                brandSignature={typeof c.brandSignature === "object" ? c.brandSignature : undefined}
              />
            </div>
          </section>
          <VideoLightboxModal
            isOpen={videoOpen}
            onClose={() => setVideoOpen(false)}
            videoUrl={videoUrl}
            title={videoTitle}
          />
        </>
      );
    }

      /* "heroVisual" (360° Pharmaceutical Inspection) removed from customer flow —
         the section type remains reserved for Admin compatibility. 3D inspection
         remains available on product detail pages where it aids evaluation. */

      case "trust": {
        return (
          <section
            className="trust-section"
            key={sec.id ? String(sec.id) : `trust-${idx}`}
            style={{
              padding: "48px 0",
              background: "linear-gradient(180deg, #FAFBFD 0%, #F1F5F9 100%)",
              borderTop: "1px solid #E2E8F0",
              borderBottom: "1px solid #E2E8F0",
              ...secStyle,
            }}
          >
            <div style={{ maxWidth: 1400, width: "94%", margin: "0 auto", textAlign: "center" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  color: "#64748B",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 20,
                }}
              >
                QUALITY CARE, WIDER REACH, A HEALTHIER INDIA
              </span>

              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  border: "1px solid #E2E8F0",
                  padding: "28px 36px",
                  boxShadow: "0 8px 30px rgba(30,22,56,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 28,
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 22, textAlign: "left" }}>
                  <picture>
                    <source srcSet="/images/reference/trust-globe-hd.webp" type="image/webp" />
                    <img
                      src="/images/reference/trust-globe-india.png"
                      alt="India Coverage"
                      style={{ width: 130, height: 130, objectFit: "contain", filter: "drop-shadow(0 8px 20px rgba(59,130,246,0.18))" }}
                    />
                  </picture>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 850, color: "#1E1638", margin: 0, lineHeight: 1.25 }}>
                      Available Across India
                    </h3>
                    <p style={{ fontSize: 13.5, color: "#64748B", margin: "6px 0 0", maxWidth: 440, lineHeight: 1.55 }}>
                      Our formulations reach customers nationwide — direct from Queens Care and through verified pharmacy platforms.
                    </p>
                  </div>
                </div>

                {/* Partner Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {(marketplaces.length > 0
                    ? marketplaces.map((m) => ({
                        name: m.label || m.platform || "Marketplace",
                        url: m.url || "#",
                        color:
                          m.platform === "pharmeasy" ? "#0EA5E9" :
                          m.platform === "tata1mg" ? "#DC2626" :
                          m.platform === "netmeds" ? "#16A34A" :
                          m.platform === "amazon" ? "#EA580C" :
                          m.platform === "flipkart" ? "#2563EB" :
                          m.platform === "apollo247" ? "#0D9488" : "#2A0F3A",
                      }))
                    : []
                  ).map((p) => (
                    <a
                      key={p.name}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "10px 18px",
                        background: "#F8FAFC",
                        borderRadius: 999,
                        border: "1.5px solid #E2E8F0",
                        fontSize: 13,
                        fontWeight: 700,
                        color: p.color,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.08)";
                        e.currentTarget.style.borderColor = p.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                      }}
                    >
                      <span>{p.name}</span>
                      <span style={{ fontSize: 10, opacity: 0.6 }}>↗</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* 3 Guarantee Badges */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 16,
                  width: "100%",
                }}
              >
                {[
                  { icon: "🛡️", title: "100% Original Products", sub: "Direct & Verified Supply" },
                  { icon: "🚚", title: "Fast & Secure Delivery", sub: "Across India" },
                  { icon: "🔄", title: "Easy Returns", sub: "Hassle-free Support" },
                ].map((g) => (
                  <div
                    key={g.title}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      textAlign: "left",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                  >
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "#F5F3FF",
                        color: "#6D28D9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {g.icon}
                    </span>
                    <div>
                      <b style={{ fontSize: 13.5, color: "#1E1638", display: "block" }}>{g.title}</b>
                      <span style={{ fontSize: 11.5, color: "#64748B", display: "block", marginTop: 2 }}>{g.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      // Add marquee ticker after trust section
      case "marquee": {
        const marqueeItems: string[] = Array.isArray(c.items) ? c.items as string[] : ["Clinical intelligence", "Made with soul", "Science-backed formulas", "Traceable ingredients", "Designed with doctors"];
        return (
          <Marquee key={sec.id ? String(sec.id) : `marquee-${idx}`} items={marqueeItems} separator={String(c.separator || "✦")} speed={Number(c.speed) || 24} />
        );
      }

      case "collection": {
        const selectedIds: string[] = Array.isArray(c.selectedProductIds) ? (c.selectedProductIds as string[]) : [];
        const catFilter: string[] = Array.isArray(c.selectedCategoryFilter) ? (c.selectedCategoryFilter as string[]) : [];
        const collectionProducts = (() => {
          if (selectedIds.length > 0) {
            const idSet = new Set(selectedIds);
            return products.filter((p) => idSet.has(p.id));
          }
          if (catFilter.length > 0) {
            const catSet = new Set(catFilter);
            return products.filter((p) => catSet.has(p.category));
          }
          return shown;
        })();

        const REFERENCE_CATEGORIES = [
          { name: "All Products", desc: "Explore everything", icon: "⊞", color: "#7C3AED", bg: "#EDE9FE", query: "" },
          { name: "Immunity", desc: "Stronger You", icon: "🛡️", color: "#0284C7", bg: "#E0F2FE", query: "Immunity" },
          { name: "Women's Health", desc: "Care at Every Stage", icon: "💗", color: "#DB2777", bg: "#FCE7F3", query: "Women's Health" },
          { name: "Digestive Health", desc: "Happier Gut", icon: "🌿", color: "#16A34A", bg: "#DCFCE7", query: "Digestive" },
          { name: "Respiratory Care", desc: "Breathe Better", icon: "🫁", color: "#0D9488", bg: "#CCFBF1", query: "Respiratory" },
          { name: "Skin & Hair", desc: "Natural Confidence", icon: "✨", color: "#D97706", bg: "#FEF3C7", query: "Skin" },
          { name: "Bone & Joint", desc: "Move with Confidence", icon: "🦴", color: "#4F46E5", bg: "#EEF2FF", query: "Bone" },
          { name: "Children's Health", desc: "Growing Stronger", icon: "👶", color: "#EA580C", bg: "#FFEDD5", query: "Children" },
        ];

        return (
          <section
            className="collection section"
            id="collection"
            key={sec.id ? String(sec.id) : `collection-${idx}`}
            style={{ padding: "36px 0 60px", background: "#FAFBFD", ...secStyle }}
          >
            {/* Reference Horizontal Category Carousel */}
            <div style={{ maxWidth: 1400, width: "94%", margin: "0 auto 36px", padding: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#FFFFFF",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  borderRadius: 22,
                  padding: "12px 16px",
                  boxShadow: "0 4px 20px rgba(30, 22, 56, 0.04)",
                  overflowX: "auto",
                }}
              >
                <button
                  type="button"
                  aria-label="Previous Category"
                  onClick={() => {
                    const el = document.getElementById("qc-cat-track");
                    if (el) el.scrollBy({ left: -240, behavior: "smooth" });
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    fontSize: 16,
                    color: "#475569",
                  }}
                >
                  ‹
                </button>

                <div
                  id="qc-cat-track"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    overflowX: "auto",
                    flex: 1,
                    scrollBehavior: "smooth",
                    scrollbarWidth: "none",
                  }}
                >
                  {REFERENCE_CATEGORIES.map((catItem) => {
                    const isSelected =
                      (catItem.query === "" && search === "") ||
                      (catItem.query !== "" && search.toLowerCase().includes(catItem.query.toLowerCase()));
                    return (
                      <button
                        key={catItem.name}
                        type="button"
                        onClick={() => setSearch(catItem.query)}
                        className="category-pill-card"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "14px 10px",
                          borderRadius: 16,
                          background: isSelected ? "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)" : "#FFFFFF",
                          border: isSelected ? "2px solid #7C3AED" : "1.5px solid #E2E8F0",
                          cursor: "pointer",
                          minWidth: 125,
                          flex: "1 1 0",
                          boxShadow: isSelected ? "0 4px 16px rgba(124, 58, 237, 0.15)" : "0 2px 6px rgba(0,0,0,0.02)",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      >
                        <span
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: isSelected ? "#7C3AED" : catItem.bg,
                            color: isSelected ? "#FFFFFF" : catItem.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          }}
                        >
                          {catItem.icon}
                        </span>
                        <div style={{ textAlign: "center" }}>
                          <b style={{ display: "block", fontSize: 12.5, color: isSelected ? "#5B21B6" : "#0F172A", fontWeight: 700, lineHeight: 1.25 }}>
                            {catItem.name}
                          </b>
                          <span style={{ fontSize: 10, color: isSelected ? "#7C3AED" : "#64748B", display: "block", marginTop: 2 }}>
                            {catItem.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  aria-label="Next Category"
                  onClick={() => {
                    const el = document.getElementById("qc-cat-track");
                    if (el) el.scrollBy({ left: 240, behavior: "smooth" });
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    fontSize: 16,
                    color: "#475569",
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            {/* Products Catalog — full-width; filtering lives in the category chips above
                and on /shop (search, category, sort). 250px sidebar removed: it showed
                fabricated counts and non-functional controls. */}
            <div
              style={{
                maxWidth: 1400,
                width: "94%",
                margin: "0 auto",
                padding: 0,
              }}
              className="shop-two-column-wrap"
            >
              {/* Products Catalog Area */}
              <div>
                {/* Catalog Toolbar — honest count + working sort (fake tabs/dead toggles removed) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 20,
                    paddingBottom: 12,
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <b style={{ fontSize: 15, color: "#1E1638" }}>
                    {collectionProducts.length} Formulation{collectionProducts.length === 1 ? "" : "s"}
                    {(search || catFilter.length > 0) && " matched"}
                  </b>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label htmlFor="qc-coll-sort" style={{ fontSize: 12, color: "#64748B" }}>Sort by</label>
                    <select
                      id="qc-coll-sort"
                      value={collSort}
                      onChange={(e) => setCollSort(e.target.value as typeof collSort)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 12.5,
                        background: "#FFFFFF",
                        color: "#1E293B",
                        cursor: "pointer",
                      }}
                    >
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Customer Rating</option>
                    </select>
                    <Link
                      href="/shop"
                      style={{ fontSize: 12.5, fontWeight: 700, color: "#5B21B6", textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      View all →
                    </Link>
                  </div>
                </div>

                {loading ? (
                  <p style={{ marginTop: 40, color: "var(--muted)", textAlign: "center" }}>Loading collection…</p>
                ) : (
                  <>
                    {(() => {
                      const sorted = [...collectionProducts].sort((a, b) =>
                        collSort === "price-asc" ? a.price - b.price :
                        collSort === "price-desc" ? b.price - a.price :
                        collSort === "rating" ? (b.rating || 0) - (a.rating || 0) :
                        0
                      );
                      const displayProducts = (!search && catFilter.length === 0) ? sorted.slice(0, 8) : sorted;
                      return (
                        <>
                          <div
                            className="product-grid"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                              gap: 16,
                            }}
                          >
                            {displayProducts.map((product, pIdx) => {
                              const pAny = product as Record<string, unknown>;
                              const cardBadge = String(product.tag || pAny.badge || (product.bestSeller ? "Bestseller" : product.newArrival ? "New" : ""));
                              // Honest pricing: only real Admin-entered MRP is shown; no fabricated strikethroughs.
                              const originalPrice = Number(pAny.originalPrice || pAny.mrp || 0);
                              const hasRealMrp = originalPrice > product.price;
                              const discountPct = hasRealMrp ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;

                              return (
                                <article
                                  key={product.id}
                                  style={{
                                    background: "#FFFFFF",
                                    borderRadius: 18,
                                    border: "1px solid rgba(226, 232, 240, 0.8)",
                                    padding: 0,
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",
                                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
                                  }}
                                >
                                  {/* Top Badge */}
                                  {cardBadge && (
                                    <span
                                      style={{
                                        position: "absolute",
                                        top: 10,
                                        left: 10,
                                        zIndex: 2,
                                        padding: "3px 8px",
                                        borderRadius: 999,
                                        fontSize: 9.5,
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        background:
                                          cardBadge.toLowerCase().includes("bestseller")
                                            ? "#EA580C"
                                            : cardBadge.toLowerCase().includes("new")
                                            ? "#16A34A"
                                            : cardBadge.toLowerCase().includes("popular")
                                            ? "#F59E0B"
                                            : "#7C3AED",
                                        color: "#FFFFFF",
                                      }}
                                    >
                                      {cardBadge}
                                    </span>
                                  )}

                                  {/* Product Image Header */}
                                  <Link href={`/products/${product.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                                    <div
                                      style={{
                                        position: "relative",
                                        width: "100%",
                                        aspectRatio: "1.15 / 1",
                                        background: "linear-gradient(135deg, #FAFBFD 0%, #F1F5F9 100%)",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "14px 14px 0 0",
                                      }}
                                    >
                                      {(() => {
                                        const cleanImgSrc = product.image || String(pAny.thumbnail || "") || "/images/hero/immune-support-bottle-clean.webp";
                                        const hdWebpSrc = cleanImgSrc.includes("/reference/products/")
                                          ? cleanImgSrc.replace("/reference/products/", "/products-hd/").replace(".png", "-hd.webp")
                                          : cleanImgSrc;

                                        return (
                                          <picture style={{ display: "block", width: "100%", height: "100%" }}>
                                            <source srcSet={hdWebpSrc} type="image/webp" />
                                            <img
                                              src={cleanImgSrc}
                                              alt={product.name}
                                              style={{ width: "100%", height: "100%", objectFit: "contain", padding: "10px" }}
                                              onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = "/images/hero/immune-support-bottle-clean.webp";
                                              }}
                                            />
                                          </picture>
                                        );
                                      })()}
                                    </div>
                                  </Link>

                                  {/* Product Body Content */}
                                  <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
                                    <Link href={`/products/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                                      <span style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                                        Queens Care
                                      </span>
                                      <h3
                                        style={{
                                          fontSize: 14.5,
                                          fontWeight: 700,
                                          color: "#0F172A",
                                          margin: "3px 0 2px",
                                          lineHeight: 1.3,
                                        }}
                                      >
                                        {product.name}
                                      </h3>
                                      <p
                                        style={{
                                          fontSize: 11,
                                          color: "#64748B",
                                          margin: "0 0 10px",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {String(pAny.subtitle || product.note || product.category)}
                                      </p>
                                    </Link>

                                  {/* Price & Discount — MRP shown only when genuinely configured */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                      <b style={{ fontSize: 15, color: "#0F172A" }}>
                                        ₹{product.price.toLocaleString("en-IN")}
                                      </b>
                                      {hasRealMrp && (
                                        <span style={{ fontSize: 11.5, color: "#94A3B8", textDecoration: "line-through" }}>
                                          ₹{originalPrice.toLocaleString("en-IN")}
                                        </span>
                                      )}
                                      {discountPct > 0 && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: "#EF4444",
                                            background: "#FEE2E2",
                                            padding: "2px 6px",
                                            borderRadius: 4,
                                          }}
                                        >
                                          {discountPct}% OFF
                                        </span>
                                      )}
                                    </div>

                                    {/* Real Stock & Dispatch Assurance */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, marginBottom: 10, marginTop: 4 }}>
                                      <span style={{ color: (product.stock ?? 25) <= 5 ? "#DC2626" : "#16A34A", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: (product.stock ?? 25) <= 5 ? "#DC2626" : "#22C55E" }} />
                                        {(product.stock ?? 25) <= 5 ? `Only ${product.stock} units left` : "In Stock • Ships in 24h"}
                                      </span>
                                      <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>
                                        <span>★</span>
                                        <span style={{ color: "#1E293B" }}>{(product.rating || 4.8).toFixed(1)}</span>
                                      </div>
                                    </div>

                                    {/* Primary High-Contrast Conversion CTA */}
                                    <div
                                      style={{
                                        marginTop: "auto",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        paddingTop: 8,
                                        borderTop: "1px solid #F1F5F9",
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          add(product);
                                        }}
                                        style={{
                                          flex: 1,
                                          padding: "10px 14px",
                                          borderRadius: 8,
                                          background: "#1E1638",
                                          color: "#FFFFFF",
                                          border: "none",
                                          fontSize: 12.5,
                                          fontWeight: 700,
                                          letterSpacing: "0.02em",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 6,
                                          boxShadow: "0 2px 8px rgba(30, 22, 56, 0.16)",
                                          transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = "#2D2152";
                                          e.currentTarget.style.boxShadow = "0 4px 14px rgba(30, 22, 56, 0.28)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = "#1E1638";
                                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(30, 22, 56, 0.16)";
                                        }}
                                        aria-label={`Add ${product.name} to care bag`}
                                      >
                                        <span>🛍️</span>
                                        <span>Add to Care Bag</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleWish(product.name);
                                        }}
                                        style={{
                                          width: 38,
                                          height: 38,
                                          borderRadius: 8,
                                          background: "#F8FAFC",
                                          border: "1px solid #E2E8F0",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          cursor: "pointer",
                                          fontSize: 15,
                                          color: wish.includes(product.name) ? "#EF4444" : "#64748B",
                                          transition: "all 0.2s",
                                          flexShrink: 0,
                                        }}
                                        aria-label={`Save ${product.name}`}
                                      >
                                        {wish.includes(product.name) ? "♥" : "♡"}
                                      </button>
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}

                    {collectionProducts.length === 0 && products.length > 0 && (
                      <p className="empty" style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                        No results found. Try clearing filters or choosing another category.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        );
      }

      case "science": {
        return (
          <section
            className="science-section"
            id="science"
            key={sec.id ? String(sec.id) : `science-${idx}`}
            style={{ padding: "40px 20px", ...secStyle }}
          >
            <ScienceResultsCard
              title={String(c.heading || "Real Science Real Results")}
              subtitle={String(c.description || "Discover the ingredients, research and care behind every Queens Care product.")}
              ctaText={String(c.ctaText || "Explore Our Science")}
              ctaLink={String(c.ctaLink || "/research-development")}
              videoUrl={String(c.scienceVideoUrl || c.videoUrl || "")}
              badges={Array.isArray(c.badges) ? c.badges : undefined}
              labImage={c.labImage ? String(c.labImage) : undefined}
            />
          </section>
        );
      }

      case "doctor": {
        const dc = c as Record<string, unknown>;
        return (
          <section key={sec.id ? String(sec.id) : `doctor-${idx}`} className="doctor-section" style={{ padding: "80px 24px", background: "linear-gradient(180deg, rgba(40,13,56,0.03) 0%, rgba(212,175,55,0.06) 100%)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <DoctorCharacter
                enabled={dc.enabled !== false}
                position={(dc.position as "left" | "center" | "right") || "center"}
                size={(dc.size as "sm" | "md" | "lg") || "md"}
                animSpeed={Number(dc.animSpeed) || 1}
                greeting={String(dc.greeting || "Hi, I'm Dr. Queens!")}
                subtext={String(dc.subtext || "I help you find the right formulations for your wellness journey.")}
                ctaText={String(dc.ctaText || "Take the Quiz")}
                ctaLink={String(dc.ctaLink || "/recommendations")}
                bgStyle={(dc.bgStyle as "purple" | "gold" | "white" | "gradient" | "transparent") || "gradient"}
                mobileVisible={dc.mobileVisible !== false}
                lottieUrl={String(dc.lottieUrl || "")}
              />
            </div>
          </section>
        );
      }

      case "ritual": {
        const LIFE_STAGE_CARDS = [
          {
            title: "I want to feel more energized.",
            cta: "Explore Energy ➔",
            webp: "/images/wellness/wellness-energy-hd.webp",
            img: "/images/reference/card-energy-reference.png",
            query: "Immunity",
            bg: "#FEF9EE",
            accent: "#D97706",
          },
          {
            title: "I want a calmer evening.",
            cta: "Explore Sleep ➔",
            webp: "/images/wellness/wellness-sleep-hd.webp",
            img: "/images/reference/card-sleep-reference.png",
            query: "Digestive",
            bg: "#F5F3FF",
            accent: "#7C3AED",
          },
          {
            title: "I want to glow from within.",
            cta: "Explore Skin ➔",
            webp: "/images/wellness/wellness-skin-hd.webp",
            img: "/images/reference/card-skin-reference.png",
            query: "Skin",
            bg: "#FFF5F5",
            accent: "#E11D48",
          },
          {
            title: "I want a stronger future for their health.",
            cta: "Explore Kids ➔",
            webp: "/images/wellness/wellness-kids-hd.webp",
            img: "/images/reference/card-kids-reference.png",
            query: "Children",
            bg: "#F0FDF4",
            accent: "#16A34A",
          },
        ];

        return (
          <section
            className="ritual-reference-section"
            key={sec.id ? String(sec.id) : `ritual-${idx}`}
            style={{ padding: "48px 20px", background: "#FAFBFD", ...secStyle }}
          >
            <div style={{ maxWidth: 1400, width: "94%", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display, serif)",
                      fontSize: "clamp(26px, 3.2vw, 36px)",
                      fontWeight: 850,
                      color: "#1E1638",
                      margin: "0 0 6px",
                    }}
                  >
                    Care that meets you where you are.
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                  Wellness for every chapter of life — because a healthier tomorrow starts today.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 18,
                }}
              >
                {LIFE_STAGE_CARDS.map((card) => (
                  <div
                    key={card.title}
                    onClick={() => {
                      setSearch(card.query);
                      const el = document.getElementById("collection");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      background: card.bg,
                      borderRadius: 18,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                      border: "1px solid rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                    className="ritual-card-hover"
                  >
                    <div style={{ padding: "20px 18px 10px" }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-display, serif)",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#1E1638",
                          margin: "0 0 8px",
                          lineHeight: 1.3,
                        }}
                      >
                        {card.title}
                      </h3>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 750,
                          color: card.accent,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {card.cta}
                      </span>
                    </div>

                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 200,
                        overflow: "hidden",
                        marginTop: 4,
                      }}
                    >
                      <picture>
                        <source srcSet={card.webp} type="image/webp" />
                        <img
                          src={card.img}
                          alt={card.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center 20%",
                            display: "block",
                          }}
                        />
                      </picture>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "testimonial": {
        const hasTestimonials = testimonials.length > 0;
        const currentQuote = hasTestimonials
          ? testimonials[testimonialIndex]?.body
          : (c.quote || "Every formulation released by Queens Care Laboratories adheres to rigorous active compound stability, strict batch release standards, and complete ingredient transparency.");
        const currentAuthor = hasTestimonials
          ? testimonials[testimonialIndex]?.name
          : (c.author || "Formulation & Quality Committee");
        const currentAttribution = hasTestimonials
          ? testimonials[testimonialIndex]?.title
          : (c.attribution || "Queens Care Laboratories · Scientific Standards");
        const count = testimonials.length;
        return (
          <section className="quote" key={sec.id ? String(sec.id) : `quote-${idx}`} style={secStyle}>
            <div className="quote-mark">&ldquo;</div>
            <blockquote>{currentQuote}</blockquote>
            <div>
              <b>{currentAuthor}</b>
              <span>{currentAttribution}</span>
              {!hasTestimonials && (
                <div style={{ marginTop: 8 }}>
                  <Link href="/trust" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
                    Read our Trust &amp; Quality Standards →
                  </Link>
                </div>
              )}
            </div>
            {hasTestimonials && count > 1 && (
              <div className="quote-controls">
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() => setTestimonialIndex((i) => (i === 0 ? count - 1 : i - 1))}
                >
                  ←
                </button>
                <span>{String(testimonialIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() => setTestimonialIndex((i) => (i + 1) % count)}
                >
                  →
                </button>
              </div>
            )}
          </section>
        );
      }

      case "newsletter": {
        type JournalArticle = {
          tag: string;
          title: string;
          slug: string;
          img: string;
        };
        const FALLBACK_ARTICLES: JournalArticle[] = [
          { tag: "SCIENCE", title: "The Science Behind Immunity Support", slug: "science-behind-immunity-support", img: "/images/reference/blog-science-hd.jpg" },
          { tag: "WELLNESS", title: "Daily Habits for a Healthier Gut", slug: "daily-habs-healthier-gut", img: "/images/reference/blog-gut-hd.jpg" },
          { tag: "LIFESTYLE", title: "Skincare Science: Real Ingredients, Real Results", slug: "skincare-science-real-ingredients", img: "/images/reference/blog-skin-hd.jpg" },
        ];
        const hasCustomArticles = Array.isArray(c.articles) && c.articles.length > 0;
        const hasDiverseBlogPosts = blogPosts.length > 0 && !blogPosts[0].title.toLowerCase().includes("efficacy report");
        const REFERENCE_ARTICLES: JournalArticle[] = hasCustomArticles
          ? (c.articles as Array<Record<string, string>>).map((a, i) => ({
              tag: String(a.tag || "ARTICLE").toUpperCase(),
              title: String(a.title || "Article"),
              slug: String(a.slug || "article"),
              img: String(a.img || FALLBACK_ARTICLES[i % FALLBACK_ARTICLES.length].img),
            }))
          : hasDiverseBlogPosts
          ? blogPosts.slice(0, 3).map((p, i) => ({
              tag: (p.category || "ARTICLE").toUpperCase(),
              title: p.title,
              slug: p.slug,
              img: p.image && !p.image.includes("unsplash") ? p.image : FALLBACK_ARTICLES[i % FALLBACK_ARTICLES.length].img,
            }))
          : FALLBACK_ARTICLES;

        return (
          <section
            className="journal-reference-section"
            id="journal"
            key={sec.id ? String(sec.id) : `journal-${idx}`}
            style={{ padding: "48px 20px", background: "#FAFBFD", ...secStyle }}
          >
            <div style={{ maxWidth: 1400, width: "94%", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-display, serif)",
                    fontSize: "clamp(24px, 3.2vw, 34px)",
                    fontWeight: 850,
                    color: "#1E1638",
                    margin: 0,
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(c.heading || "Ideas, insights and everyday care.")) }}
                />
                <Link
                  href="/blog"
                  aria-label="View all journal articles"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1E1638",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>View all journal</span> <span>→</span>
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 18,
                }}
              >
                {REFERENCE_ARTICLES.map((art: JournalArticle) => (
                  <Link
                    key={art.title}
                    href={`/blog/${art.slug}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <article
                      style={{
                        background: "#FFFFFF",
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "1px solid #E2E8F0",
                        padding: "12px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          aspectRatio: "16/10",
                          borderRadius: 10,
                          overflow: "hidden",
                          marginBottom: 12,
                        }}
                      >
                        <img
                          src={art.img}
                          alt={art.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          background: "#FEF3C7",
                          color: "#D97706",
                          fontSize: 10,
                          fontWeight: 800,
                          width: "fit-content",
                          marginBottom: 8,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {art.tag}
                      </span>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#1E1638",
                          margin: "0 0 12px",
                          lineHeight: 1.35,
                          flex: 1,
                        }}
                      >
                        {art.title}
                      </h3>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#4F46E5", marginTop: "auto" }}>
                        Read More →
                      </span>
                    </article>
                  </Link>
                ))}

                {/* 4th Card: Reference Dark Newsletter Box */}
                <article
                  style={{
                    background: "linear-gradient(135deg, #1E1638 0%, #110B22 100%)",
                    borderRadius: 16,
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "#FFFFFF",
                    boxShadow: "0 6px 20px rgba(30, 22, 56, 0.2)",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: "0.14em",
                        color: "#D4AF37",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      THE CARE MATTERS
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>
                      A smarter kind of inbox.
                    </h3>
                    <p style={{ fontSize: 11.5, color: "#94A3B8", lineHeight: 1.45, margin: "0 0 16px" }}>
                      Tips, updates and wellness insights — straight to you.
                    </p>
                  </div>

                  <form onSubmit={subscribe} style={{ display: "flex", gap: 6 }}>
                    <input
                      type="email"
                      required
                      aria-label="Your email address"
                      placeholder="Enter your email"
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#FFFFFF",
                        fontSize: 11.5,
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      aria-label="Subscribe"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#D4AF37",
                        color: "#1E1638",
                        border: "none",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      →
                    </button>
                  </form>
                </article>
              </div>
            </div>
          </section>
        );
      }

      case "affiliate": {
        const stats = ((c.stats as Array<Record<string, string>>) || [
          { value: "10%", label: "Commission" },
          { value: "30 Days", label: "Cookie Window" },
          { value: "Direct", label: "Monthly Payouts" }
        ]);
        return (
          <section className="section" key={sec.id ? String(sec.id) : `affiliate-${idx}`} style={{ background: c.backgroundColor ? String(c.backgroundColor) : "var(--paper)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "72px 0", ...secStyle }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
              <div>
                <p className="eyebrow" style={{ color: "var(--gold)" }}>{String(c.eyebrow || "PARTNERSHIP PROGRAMME")}</p>
                <h2 style={{ font: "clamp(28px, 4vw, 42px)/1.15 var(--font-display)", letterSpacing: "-.02em", margin: "12px 0 20px", ...headingStyle }}>
                  {String(c.heading || "Partner with Queens Care Laboratories")}
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--muted)", marginBottom: 28 }}>
                  {String(c.description || "Share science-backed formulations you believe in and earn through your personalized referral link.")}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
                  {stats.map((stat, i) => (
                    <div key={i} style={{ padding: "16px 14px", background: "#fff", border: "1px solid var(--line)" }}>
                      <b style={{ fontSize: 20, color: "var(--purple)", display: "block" }}>{stat.value}</b>
                      <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{stat.label}</span>
                    </div>
                  ))}
                </div>
                <Link href={String(c.ctaLink || "/affiliate")} className="button" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {String(c.ctaText || "BECOME AN AFFILIATE")} <span>→</span>
                </Link>
              </div>
              <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: 4, overflow: "hidden", border: "1px solid var(--line)" }}>
                <img
                  src={String(c.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=85")}
                  alt="Queens Care Laboratory Formulations"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=85"; }}
                />
              </div>
            </div>
          </section>
        );
      }

      case "consult": {
        return (
          <section
            className="ai-assistant-reference-banner"
            key={sec.id ? String(sec.id) : `consult-${idx}`}
            style={{ padding: "36px 20px", ...secStyle }}
          >
            <DrQueensAssistantBanner
              onOpenQuiz={() => setQuizOpen(true)}
              eyebrow={String(c.eyebrow || "Your Health Our Priority")}
              title={String(c.heading || c.title || "Not sure which product is right for you?")}
              description={String(c.description || "Take a short quiz and I'll help you find the best options based on your needs.")}
              ctaText={String(c.ctaText || "Take the Health Quiz")}
            />
          </section>
        );
      }


      case "quiz": {
        return (
          <section className="section" key={sec.id ? String(sec.id) : `quiz-${idx}`} style={{ background: "linear-gradient(180deg, rgba(40,13,56,0.03) 0%, rgba(212,175,55,0.06) 100%)", padding: "72px 0", ...secStyle }}>
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
              <p className="eyebrow" style={{ color: "var(--gold, #D4AF37)" }}>{String(c.eyebrow || "Personalized Consultation")}</p>
              <h2 style={{ font: "clamp(28px, 4vw, 42px)/1.15 var(--font-display)", color: "var(--purple, #2A0F3A)", margin: "12px 0 16px", ...headingStyle }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(c.heading || "Find the exact formulation your routine requires.")) }} />
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--muted, #64748b)", maxWidth: 640, margin: "0 auto 28px" }}>
                {String(c.description || "Answer 4 clinical questions to calculate your personalized bioactive routine.")}
              </p>
              <button
                type="button"
                onClick={() => setQuizOpen(true)}
                className="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 32px",
                  background: "var(--purple, #2A0F3A)",
                  color: "var(--gold, #D4AF37)",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <span>✦ {String(c.ctaText || "Take Formulation Quiz")}</span> <span>→</span>
              </button>
            </div>
          </section>
        );
      }

      case "faq": {
        const FAQ_ITEMS = [
          {
            q: "How is the quality of Queens Care formulations checked?",
            a: "Every batch undergoes quality testing — including potency and purity checks — before release, and full ingredient information is printed on every label."
          },
          {
            q: "Do I require a prescription to order formulations on this website?",
            a: "Our over-the-counter wellness bioactives, dietary supplements, and therapeutic vitamins do not require a prescription. For any specialized clinical formulations requiring doctor authorization, clear verification prompts are provided."
          },
          {
            q: "How fast is shipping and how are formulations protected during transit?",
            a: "Orders dispatch within 24 hours from our Mumbai Central Formulation Hub. Formulations are packed in climate-resilient, tamper-evident protective containers. Metro delivery arrives within 48–72 hours across India."
          },
          {
            q: "What is the Queens Care Authenticity Guarantee and Return Policy?",
            a: "We guarantee 100% authentic formulations sourced directly from our certified production lines. If your sealed package arrives compromised or unsatisfied, we provide a 7-day hassle-free return and replacement protocol."
          },
          {
            q: "Are all active bioactives and excipients 100% disclosed?",
            a: "Yes. Queens Care adheres to full INCI disclosure. Every bioactive concentration, USP grade, molecular carrier, and non-active excipient is published with zero hidden fillers or unlisted binders."
          }
        ];

        return (
          <section
            className="clinical-faq-section"
            id="faq"
            key={sec.id ? String(sec.id) : `faq-${idx}`}
            style={{ padding: "64px 20px", background: "#FAFBFD", borderTop: "1px solid #E2E8F0", ...secStyle }}
          >
            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(30, 22, 56, 0.06)",
                    color: "#1E1638",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  ✦ Clinical Purity &amp; Purchase Assurance
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-display, serif)",
                    fontSize: "clamp(26px, 3.5vw, 36px)",
                    fontWeight: 850,
                    color: "#1E1638",
                    margin: "0 0 10px",
                  }}
                >
                  {String(c.heading || "Frequently Asked Clinical Questions")}
                </h2>
                <p style={{ fontSize: 14.5, color: "#64748B", maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
                  Everything you need to know about our pharmaceutical rigor, batch verification, and direct order fulfillment.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {FAQ_ITEMS.map((item, fIdx) => (
                  <details
                    key={fIdx}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 14,
                      border: "1px solid #E2E8F0",
                      padding: "16px 20px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                  >
                    <summary
                      style={{
                        fontSize: 14.5,
                        fontWeight: 750,
                        color: "#1E1638",
                        cursor: "pointer",
                        listStyle: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        userSelect: "none",
                      }}
                    >
                      <span>{item.q}</span>
                      <span style={{ fontSize: 16, color: "#D4AF37", fontWeight: 700, marginLeft: 12 }}>+</span>
                    </summary>
                    <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "#64748B", margin: "12px 0 0", borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "custom":
      default: {
        return (
          <section key={sec.id ? String(sec.id) : `custom-${idx}`} className="section" style={{ padding: "72px 0", ...secStyle }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
              {c.eyebrow && <p className="eyebrow" style={{ color: "var(--gold)" }}>{String(c.eyebrow)}</p>}
              {c.heading && <h2 style={{ font: "clamp(28px, 4vw, 42px)/1.15 var(--font-display)", margin: "12px 0 20px", ...headingStyle }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(c.heading)) }} />}
              {c.body && <div style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 24, whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(c.body)) }} />}
              {c.mediaUrl && (
                <div style={{ margin: "24px 0", borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)" }}>
                  {c.mediaType === "video" ? (
                    <video src={String(c.mediaUrl)} controls autoPlay muted loop style={{ width: "100%", maxHeight: 500, objectFit: "cover" }} />
                  ) : (
                    <img src={String(c.mediaUrl)} alt={String(c.heading || "Queens Care")} style={{ width: "100%", maxHeight: 500, objectFit: "cover" }} />
                  )}
                </div>
              )}
              {c.ctaText && (
                <Link href={String(c.ctaLink || "#")} className="button" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {String(c.ctaText)} <span>→</span>
                </Link>
              )}
            </div>
          </section>
        );
      }
    }
}
