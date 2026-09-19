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
}

interface QuizOption {
  label: string;
  desc: string;
  icon: string;
  recommendedSlug?: string;
}

interface QuizQuestion {
  id: string;
  title: string;
  subtitle: string;
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "priority",
    title: "What is your primary wellness priority today?",
    subtitle: "Select the area where you desire scientifically verified results.",
    options: [
      {
        label: "Cellular Energy & Vitality",
        desc: "Lycopene, essential vitamins & micronutrient revitalization.",
        recommendedSlug: "liko-q-suspension",
        icon: "⚡",
      },
      {
        label: "Immunity & Natural Defense",
        desc: "Comprehensive immune support with vitamins, minerals & zinc.",
        recommendedSlug: "immune-care-plus",
        icon: "🛡️",
      },
      {
        label: "Gut Microbiome & Digestion",
        desc: "Targeted prebiotic & probiotic equilibrium for daily gut comfort.",
        recommendedSlug: "digestive-balance",
        icon: "🌿",
      },
      {
        label: "Skin Radiance & Hair Health",
        desc: "Active bioactive nutrients for collagen support and natural glow.",
        recommendedSlug: "skinglow-plus",
        icon: "✨",
      },
      {
        label: "Hormonal & Women's Vitality",
        desc: "Formulated specifically for energy, cycle balance and nourishment.",
        recommendedSlug: "womens-vitality",
        icon: "💗",
      },
      {
        label: "Bone, Joint & Structural Strength",
        desc: "High absorption calcium, vitamin D3 and trace minerals for mobility.",
        recommendedSlug: "bone-strength",
        icon: "🦴",
      },
    ],
  },
  {
    id: "format",
    title: "What formulation format best fits your daily routine?",
    subtitle: "We calibrate delivery methods to maximize absorption and consistency.",
    options: [
      { label: "Bioavailable Liquid / Suspension", desc: "Rapid gastric absorption with delicious natural notes.", icon: "🥄" },
      { label: "Daily Tablet / Capsule", desc: "Convenient, precise clinical dosage in vegetable capsules.", icon: "💊" },
      { label: "Concentrated Drops / Syrup", desc: "Flexible dosing ideal for family & pediatric care.", icon: "💧" },
      { label: "No Preference / Doctor Recommended", desc: "Match me to the most effective clinical delivery format.", icon: "🩺" },
    ],
  },
  {
    id: "profile",
    title: "Do you have specific formulation requirements?",
    subtitle: "Every Queens Care batch is quality-checked before it leaves our facility.",
    options: [
      { label: "Hypoallergenic & Gentle", desc: "Formulated for sensitive systems with zero synthetic irritants.", icon: "🌱" },
      { label: "High Screen Time & Urban Stress", desc: "Enhanced antioxidant shielding against free radical oxidative stress.", icon: "💻" },
      { label: "Active Athletic / High Output", desc: "Formulated for fast physical recovery and electrolyte balance.", icon: "🏃" },
      { label: "Standard Everyday Wellness", desc: "Balanced foundational support for long-term health.", icon: "⚖️" },
    ],
  },
  {
    id: "timeline",
    title: "What timeline are you targeting for perceptible transformation?",
    subtitle: "Bioactive compounds work cumulatively through natural biological cycles.",
    options: [
      { label: "Immediate Daily Defense", desc: "Instant cellular protection and vitality boost from Day 1.", icon: "✦" },
      { label: "14-Day Cellular Reset", desc: "Noticeable improvement in vitality, gut lightness and radiant skin.", icon: "✦✦" },
      { label: "30-Day Foundational Protocol", desc: "Complete systemic revitalization and sustained metabolic harmony.", icon: "✦✦✦" },
    ],
  },
];

export default function HealthQuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizOption>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  }, []);

  const currentQ = QUESTIONS[step];
  const isFinished = step >= QUESTIONS.length;

  const handleSelect = (option: QuizOption) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setStep(QUESTIONS.length);
    }
  };

  const recommendedSlug = answers["priority"]?.recommendedSlug || "liko-q-suspension";
  const matchedProduct = products.find((p) => p.slug === recommendedSlug) || products[0];

  const handleAdd = (slug: string) => {
    addToCart({ productId: slug, quantity: 1 });
    setAddedSlug(slug);
    setTimeout(() => setAddedSlug(null), 3000);
  };

  const resetQuiz = () => {
    setAnswers({});
    setStep(0);
    setAddedSlug(null);
  };

  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <QueensCareHeader activePage="quiz" />

      <main style={{ flex: 1, padding: "48px 24px 80px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        {!isFinished ? (
          <div>
            {/* Header Banner */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
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
                <span>✦</span> Personalized Health Consultation
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display, serif)",
                  fontSize: "clamp(28px, 4vw, 42px)",
                  fontWeight: 800,
                  color: "#1E1638",
                  margin: "0 0 12px",
                }}
              >
                Find Your Tailored Formulation
              </h1>
              <p style={{ fontSize: 15, color: "#64748B", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
                Answer 4 quick questions about your body, routine, and wellness goals to receive a scientifically calibrated formulation recommendation.
              </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 36, background: "#E2E8F0", height: 6, borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${((step + 1) / QUESTIONS.length) * 100}%`,
                  background: "linear-gradient(90deg, #2A0F3A 0%, #D4AF37 100%)",
                  transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>

            {/* Question Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                border: "1px solid #E2E8F0",
                padding: "36px 32px",
                boxShadow: "0 8px 30px rgba(42, 15, 58, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Step {step + 1} of {QUESTIONS.length}
                </span>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                  >
                    ← Previous Question
                  </button>
                )}
              </div>

              <h2 style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 800, color: "#1E1638", margin: "0 0 8px" }}>
                {currentQ.title}
              </h2>
              <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 28px" }}>
                {currentQ.subtitle}
              </p>

              {/* Options Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: "18px 20px",
                      borderRadius: 16,
                      background: "#FAFBFD",
                      border: "1.5px solid #E2E8F0",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#D4AF37";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(212, 175, 55, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{opt.icon}</span>
                    <div>
                      <b style={{ display: "block", fontSize: 15, color: "#1E1638", marginBottom: 4 }}>{opt.label}</b>
                      <span style={{ display: "block", fontSize: 12.5, color: "#64748B", lineHeight: 1.45 }}>{opt.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Results Stage */
          <div>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#059669",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                ✓ Consultation Analysis Complete
              </span>
              <h1
                style={{
                  fontFamily: "var(--font-display, serif)",
                  fontSize: "clamp(28px, 4vw, 42px)",
                  fontWeight: 800,
                  color: "#1E1638",
                  margin: "0 0 12px",
                }}
              >
                Your Tailored Wellness Protocol
              </h1>
              <p style={{ fontSize: 15, color: "#64748B", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
                Based on your priority of <strong>{answers["priority"]?.label}</strong> and format preference, Dr. Queens recommends the following pharmaceutical-grade formulation:
              </p>
            </div>

            {matchedProduct && (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  border: "2px solid #D4AF37",
                  padding: "36px 32px",
                  boxShadow: "0 12px 40px rgba(42, 15, 58, 0.08)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 36,
                  alignItems: "center",
                  marginBottom: 36,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      position: "relative",
                      maxWidth: 280,
                      margin: "0 auto",
                      aspectRatio: "1/1",
                      background: "radial-gradient(circle, #FFFBEB 0%, #FAF5FF 100%)",
                      borderRadius: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 20,
                    }}
                  >
                    <img
                      src={matchedProduct.image || "/images/hero/immune-support-bottle-clean.webp"}
                      alt={matchedProduct.name}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.12))" }}
                    />
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: "#EDE9FE",
                      color: "#6D28D9",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    {matchedProduct.category} · Clinically Calibrated
                  </span>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1E1638", margin: "0 0 10px", lineHeight: 1.25 }}>
                    {matchedProduct.name}
                  </h2>
                  <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: "0 0 18px" }}>
                    {matchedProduct.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24 }}>
                    <span style={{ fontSize: 30, fontWeight: 850, color: "#1E1638" }}>
                      ₹{matchedProduct.price.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 14, color: "#94A3B8", textDecoration: "line-through" }}>
                      ₹{Math.round(matchedProduct.price * 1.32)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: 4 }}>
                      24% OFF
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => handleAdd(matchedProduct.slug)}
                      style={{
                        flex: "1 1 200px",
                        padding: "14px 28px",
                        borderRadius: 999,
                        background: "#1E1638",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 6px 20px rgba(30, 22, 56, 0.25)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span>🛒</span> {addedSlug === matchedProduct.slug ? "Added to Care Bag! ✓" : "Add to Care Bag"}
                    </button>

                    <Link
                      href={`/products/${matchedProduct.slug}`}
                      style={{
                        padding: "14px 24px",
                        borderRadius: 999,
                        background: "#FAFBFD",
                        color: "#1E1638",
                        border: "1.5px solid #E2E8F0",
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      View Full Details →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Retake CTA */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                type="button"
                onClick={resetQuiz}
                style={{
                  background: "none",
                  border: "1px solid #CBD5E1",
                  borderRadius: 999,
                  padding: "8px 20px",
                  color: "#64748B",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🔄 Retake Consultation Quiz
              </button>
            </div>
          </div>
        )}
      </main>

      <QueensCareFooter />
    </div>
  );
}
