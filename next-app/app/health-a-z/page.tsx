/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";
import { addToCart } from "@/lib/client-cart";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  rating?: number;
  reviewCount?: number;
}

interface ConditionTopic {
  id: string;
  name: string;
  icon: string;
  categoryQuery: string;
  lead: string;
  clinicalSummary: string;
  keyFactors: string[];
  doctorNote: string;
}

const TOPICS: ConditionTopic[] = [
  {
    id: "immunity",
    name: "Immunity & Natural Defense",
    icon: "🛡️",
    categoryQuery: "Immunity",
    lead: "Targeted cellular protection, antioxidant shielding, and systemic vitality.",
    clinicalSummary: "Immune defense requires balanced bioactive micronutrients, particularly high-purity Lycopene, Vitamin C, Zinc Gluconate, and essential trace minerals that reinforce innate barrier function and cellular repair.",
    keyFactors: [
      "Daily antioxidant neutralisation against free radical oxidative damage.",
      "Optimal white blood cell activation through chelated zinc and selenium.",
      "Sustained micronutrient replenishment for urban fatigue and seasonal stressors.",
    ],
    doctorNote: "Immunity is not built in a single day—it is a cumulative physiological state nurtured through bioavailable micronutrients and daily restorative rhythm.",
  },
  {
    id: "digestive",
    name: "Digestive Health & Microbiome",
    icon: "🌿",
    categoryQuery: "Digestive",
    lead: "Equilibrium for the gastrointestinal tract, gut flora harmony, and nutrient assimilation.",
    clinicalSummary: "A healthy gut microbiome governs over 70% of systemic immune function and neurotransmitter synthesis. Clinically calibrated prebiotics and botanical digestive enzymes alleviate postprandial bloating and enhance bioavailability.",
    keyFactors: [
      "Optimised gastric motility and smooth digestion without synthetic purgatives.",
      "Support for mucosal lining integrity and natural gut barrier function.",
      "Reduction of oxidative inflammation across the enteric nervous system.",
    ],
    doctorNote: "When digestion is effortless, energy returns to the rest of the body. Focus on gentle, food-state botanicals that respect the natural gut microbiome.",
  },
  {
    id: "womens",
    name: "Women's Health & Hormonal Vitality",
    icon: "💗",
    categoryQuery: "Women's Health",
    lead: "Nutritional calibration for energy, cyclical vitality, and hormonal equilibrium.",
    clinicalSummary: "Female biological cycles require dynamic micronutrient support to mitigate fatigue, promote hemoglobin synthesis, support bone mineral density, and maintain physiological equanimity across every life stage.",
    keyFactors: [
      "Chelated iron and folate balance with high gastrointestinal tolerance.",
      "Phyto-botanicals that assist natural hormonal transitions and emotional calm.",
      "Nutrient density targeting radiant hair, strong nails, and dermal hydration.",
    ],
    doctorNote: "Women often carry multiple life responsibilities while ignoring subtle nutrient depletions. Foundational botanical replenishment restores resilient daily stamina.",
  },
  {
    id: "respiratory",
    name: "Respiratory Care & Clear Airway",
    icon: "🫁",
    categoryQuery: "Respiratory",
    lead: "Bronchial soothe, pulmonary comfort, and defense against urban air particulates.",
    clinicalSummary: "Modern urban atmospheric pollutants and seasonal allergen spikes place acute strain on bronchial cilia and respiratory mucosal linings. Bioactive herbal tinctures support natural expectoration and pulmonary ease.",
    keyFactors: [
      "Clearing of excess bronchial mucus through gentle natural mucolytics.",
      "Calming of airway hyper-responsiveness with anti-inflammatory phyto-actives.",
      "Non-drowsy daytime formula promoting clear, unobstructed diaphragmatic breathing.",
    ],
    doctorNote: "Airway health directly dictates cellular oxygenation and mental clarity. Natural soothing herbs provide relief without antihistaminic grogginess.",
  },
  {
    id: "skin",
    name: "Skin Glow, Dermal Barrier & Hair",
    icon: "✨",
    categoryQuery: "Skin",
    lead: "Deep cellular radiance, collagen matrix integrity, and keratin nourishment.",
    clinicalSummary: "True skin luminescence is generated from within. High-potency active antioxidants, biotin, and micro-nutrient complexes protect dermal fibroblast integrity against UV photoaging and environmental pollutants.",
    keyFactors: [
      "Promotion of natural Type I & III collagen synthesis for elasticity.",
      "Melanin pathway balance to attenuate hyperpigmentation and dullness.",
      "Biotin and zinc synergy for follicular strength and decreased hair breakage.",
    ],
    doctorNote: "Topical care is only half the equation. Cellular dermal nourishment from pure internal actives is what creates true, lasting radiance.",
  },
  {
    id: "bone",
    name: "Bone, Joint & Musculoskeletal Mobility",
    icon: "🦴",
    categoryQuery: "Bone",
    lead: "Structural resilience, cartilage flexibility, and bone mineral density.",
    clinicalSummary: "Age-related bone calcium turnover and joint cartilage friction require synergistic calcium carbonate, activated Vitamin D3, and trace magnesium to ensure proper calcium deposition into skeletal architecture rather than soft tissues.",
    keyFactors: [
      "Synergistic calcium and D3 absorption matrix for maximum bone uptake.",
      "Cartilage cushioning and lubrication support for pain-free joint movement.",
      "Reduction of systemic joint stiffness after exertion or prolonged rest.",
    ],
    doctorNote: "Mobility is independence. Early, consistent skeletal care preserves athletic vitality and effortless movement for decades to come.",
  },
  {
    id: "kids",
    name: "Children's Health & Pediatric Nutrition",
    icon: "👶",
    categoryQuery: "Children",
    lead: "Safe, delicious, pediatrician-aligned formulation for growing minds and bodies.",
    clinicalSummary: "Developing pediatric biological systems require pure, bioavailable vitamins and minerals without synthetic food colorings, high-fructose corn syrups, or harsh preservatives. Formulated to foster cognitive focus and seasonal resistance.",
    keyFactors: [
      "Delicious natural fruit flavors ensuring 100% daily child compliance.",
      "Essential brain nutrients: Vitamin A, C, D, and Zinc in precise pediatric ratios.",
      "Hypoallergenic ingredients safe for developing digestive systems.",
    ],
    doctorNote: "Children deserve the cleanest possible nutritional foundation—free of artificial dyes and packed with gentle, verified botanicals.",
  },
];

export default function HealthAZPage() {
  const [activeTab, setActiveTab] = useState<string>("immunity");
  const [products, setProducts] = useState<Product[]>([]);
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  }, []);

  const currentTopic = TOPICS.find((t) => t.id === activeTab) || TOPICS[0];

  // Filter products for this topic
  const matchingProducts = products.filter((p) => {
    const q = currentTopic.categoryQuery.toLowerCase();
    return (
      (p.category || "").toLowerCase().includes(q) ||
      (p.name || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  });

  const handleAdd = (slug: string) => {
    addToCart({ productId: slug, quantity: 1 });
    setAddedSlug(slug);
    setTimeout(() => setAddedSlug(null), 3000);
  };

  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <QueensCareHeader activePage="products" />

      <main style={{ flex: 1, padding: "44px 24px 80px", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        {/* Page Hero Header */}
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
            <span>✦</span> Clinical Health Conditions &amp; Wellness Guide
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(30px, 4.2vw, 46px)",
              fontWeight: 800,
              color: "#1E1638",
              margin: "0 0 14px",
            }}
          >
            Health A–Z Directory
          </h1>
          <p style={{ fontSize: 15, color: "#64748B", maxWidth: 680, margin: "0 auto", lineHeight: 1.65 }}>
            Explore evidence-led insights, biological factors, and pharmacist-developed formulations tailored for your unique physiological priorities.
          </p>
        </div>

        {/* Condition Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflowX: "auto",
            padding: "8px 4px 18px",
            marginBottom: 28,
            scrollbarWidth: "none",
          }}
        >
          {TOPICS.map((topic) => {
            const isActive = activeTab === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => setActiveTab(topic.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  borderRadius: 999,
                  background: isActive ? "#1E1638" : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : "#475569",
                  border: isActive ? "1.5px solid #1E1638" : "1.5px solid #E2E8F0",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: isActive ? "0 4px 14px rgba(30, 22, 56, 0.2)" : "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{topic.icon}</span>
                <span>{topic.name.split("&")[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Topic Showcase Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 36,
            background: "#FFFFFF",
            borderRadius: 24,
            border: "1px solid #E2E8F0",
            padding: "40px 36px",
            boxShadow: "0 8px 32px rgba(42, 15, 58, 0.04)",
            marginBottom: 48,
          }}
          className="health-topic-showcase"
        >
          {/* Left: Clinical Information */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 36 }}>{currentTopic.icon}</span>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Clinical Focus Area
                </span>
                <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, color: "#1E1638", margin: 0 }}>
                  {currentTopic.name}
                </h2>
              </div>
            </div>

            <p style={{ fontSize: 15, color: "#1E1638", fontWeight: 600, lineHeight: 1.5, marginBottom: 14 }}>
              {currentTopic.lead}
            </p>

            <p style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.7, marginBottom: 24 }}>
              {currentTopic.clinicalSummary}
            </p>

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1E1638", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>
                Biological &amp; Lifestyle Factors:
              </span>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#475569", fontSize: 13, lineHeight: 1.7 }}>
                {currentTopic.keyFactors.map((kf, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{kf}</li>
                ))}
              </ul>
            </div>

            {/* Doctor Note Plaque */}
            <div
              style={{
                background: "linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%)",
                borderLeft: "4px solid #7C3AED",
                padding: "16px 20px",
                borderRadius: "0 14px 14px 0",
              }}
            >
              <b style={{ display: "block", fontSize: 12, color: "#6D28D9", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                🩺 Dr. Queens Clinical Perspective
              </b>
              <p style={{ fontSize: 12.5, color: "#4C1D95", margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>
                &ldquo;{currentTopic.doctorNote}&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Matched Formulations */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #F1F5F9", paddingBottom: 10 }}>
              <b style={{ fontSize: 15, color: "#1E1638" }}>
                Targeted Formulations ({matchingProducts.length})
              </b>
              <Link href="/#collection" style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", textDecoration: "none" }}>
                View All in Shop →
              </Link>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              {matchingProducts.length > 0 ? (
                matchingProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      background: "#FAFBFD",
                      borderRadius: 16,
                      border: "1.5px solid #E2E8F0",
                      padding: "16px",
                      display: "flex",
                      gap: 18,
                      alignItems: "center",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <Link href={`/products/${product.slug}`} style={{ flexShrink: 0, textDecoration: "none" }}>
                      <div
                        style={{
                          width: 84,
                          height: 84,
                          borderRadius: 12,
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 6,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={product.image || "/images/hero/immune-support-bottle-clean.webp"}
                          alt={product.name}
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                      </div>
                    </Link>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 10, color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>
                        {product.category}
                      </span>
                      <Link href={`/products/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 750, color: "#0F172A", margin: "2px 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {product.name}
                        </h3>
                      </Link>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <b style={{ fontSize: 16, color: "#0F172A" }}>
                          ₹{product.price.toLocaleString("en-IN")}
                        </b>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleAdd(product.slug)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "#1E1638",
                            color: "#FFFFFF",
                            border: "none",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {addedSlug === product.slug ? "Added ✓" : "🛒 Add to Bag"}
                        </button>
                        <Link
                          href={`/products/${product.slug}`}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            background: "#FFFFFF",
                            color: "#475569",
                            border: "1px solid #CBD5E1",
                            fontSize: 11.5,
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748B" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 14 }}>Explore our flagship formulations in the main collection.</p>
                  <Link href="/#collection" className="button" style={{ display: "inline-block", padding: "8px 18px", fontSize: 12 }}>
                    Open Catalog
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Quiz CTA Banner */}
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
            gap: 20,
            border: "1px solid rgba(212, 175, 55, 0.3)",
            boxShadow: "0 10px 30px rgba(42, 15, 58, 0.2)",
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Unsure which formulation is appropriate?
            </span>
            <h2 style={{ fontSize: "clamp(20px, 2.8vw, 26px)", fontWeight: 800, margin: "6px 0 6px" }}>
              Take the 60-Second Health Consultation Quiz
            </h2>
            <p style={{ fontSize: 13.5, color: "#E2E8F0", margin: 0, maxWidth: 540 }}>
              Let our interactive clinical questionnaire calculate your personalized bioactive routine.
            </p>
          </div>

          <Link
            href="/quiz"
            style={{
              padding: "14px 28px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #D4AF37 0%, #C59B27 100%)",
              color: "#1E1638",
              fontWeight: 800,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(212, 175, 55, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Start Consultation Quiz</span> <span>➔</span>
          </Link>
        </div>
      </main>

      <QueensCareFooter />
    </div>
  );
}
