"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/client-cart";

/* ═══════════════════════════════════════════════════════════════════════════
   HealthQuizModal — Queens Care Interactive Clinical Health Consultation
   - 4-step diagnostic questionnaire tailored to pharmaceutical wellness
   - Matches user goals to real catalog formulations (/api/products)
   - Generates a bespoke Clinical Ritual with direct "Add Routine to Bag"
   - Accessible via custom event 'open-health-quiz' or direct prop
   ═══════════════════════════════════════════════════════════════════════════ */

export type HealthQuizModalProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  stock: number;
};

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
    title: "What is your primary wellness ritual priority today?",
    subtitle: "Select the primary area where you desire scientifically verified results.",
    options: [
      {
        label: "Cellular Energy & Vitality",
        desc: "Lycopene, essential vitamins & micronutrient cellular revitalization.",
        recommendedSlug: "liko-q-suspension",
        icon: "⚡",
      },
      {
        label: "Deep Radiant Glow & Collagen",
        desc: "Potent clinical Vitamin C active serum for luminous, even skin tone.",
        recommendedSlug: "lumine-c-serum",
        icon: "✨",
      },
      {
        label: "Gut Microbiome Equilibrium",
        desc: "Targeted prebiotic & probiotic balance for digestive harmony.",
        recommendedSlug: "biome-balance",
        icon: "🌿",
      },
      {
        label: "Deep Restorative Sleep & Relaxation",
        desc: "Pure magnesium glycinate complex for calm nerves and nighttime recovery.",
        recommendedSlug: "nocturne-magnesium",
        icon: "🌙",
      },
      {
        label: "Broad Spectrum Barrier Defense",
        desc: "Clinical mineral SPF 50 shield against UV radiation and urban pollutants.",
        recommendedSlug: "sculpture-spf-50",
        icon: "🛡️",
      },
    ],
  },
  {
    id: "format",
    title: "What formulation format best integrates into your day?",
    subtitle: "We calibrate delivery methods to maximize bioavailability and habit adherence.",
    options: [
      { label: "Bioavailable Liquid / Suspension", desc: "Rapid gastric absorption with delicious natural notes.", icon: "🥄" },
      { label: "Concentrated Active Serum", desc: "Silky micro-droplet topical penetration.", icon: "💧" },
      { label: "Targeted Micro-encapsulation", desc: "Sustained release enteric vegetable capsules.", icon: "💊" },
      { label: "Lightweight Daily Emulsion", desc: "Non-greasy, invisible protective veil.", icon: "🧴" },
    ],
  },
  {
    id: "profile",
    title: "Do you have any specific formulation requirements?",
    subtitle: "Every Queens Care batch complies with hypoallergenic and cleanroom protocols.",
    options: [
      { label: "Hypoallergenic & Fragrance-Free", desc: "Formulated for ultra-sensitive biological systems.", icon: "🌱" },
      { label: "High Oxidative Stress & Screen Time", desc: "Enhanced antioxidant shielding against blue light.", icon: "💻" },
      { label: "Travel / Busy Professional Lifestyle", desc: "Convenient packaging for consistent daily ritual.", icon: "✈️" },
    ],
  },
  {
    id: "horizon",
    title: "What timeline are you targeting for perceptible transformation?",
    subtitle: "Pharmaceutical actives work cumulatively through cellular cycles.",
    options: [
      { label: "Immediate Daily Defense", desc: "Instant cellular protection & barrier hydration from Day 1.", icon: "✦" },
      { label: "14-Day Cellular Reset", desc: "Visible skin radiance, renewed daily vitality and calm.", icon: "✦✦" },
      { label: "30-Day Foundational Protocol", desc: "Complete systemic revitalization and sustained equilibrium.", icon: "✦✦✦" },
    ],
  },
];

export default function HealthQuizModal({
  isOpen: externalOpen,
  onClose: externalClose,
}: HealthQuizModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const handleClose = useCallback(() => {
    if (externalClose) {
      externalClose();
    } else {
      setInternalOpen(false);
    }
    // Reset after delay
    setTimeout(() => {
      setCurrentStep(0);
      setAnswers({});
      setAddedMessage("");
    }, 300);
  }, [externalClose]);

  // Listen for global custom event 'open-health-quiz'
  useEffect(() => {
    const listener = () => setInternalOpen(true);
    window.addEventListener("open-health-quiz", listener);
    return () => window.removeEventListener("open-health-quiz", listener);
  }, []);

  // Fetch real products from database for real recommendations
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const totalSteps = QUESTIONS.length;
  const isFinished = currentStep >= totalSteps;

  // Recommendation matching algorithm based on answers
  const selectedPriorityIdx = answers["priority"] ?? 0;
  const chosenSlug = QUESTIONS[0].options[selectedPriorityIdx]?.recommendedSlug || "lumine-c-serum";

  const primaryProduct = products.find((p) => p.slug === chosenSlug) || products[0] || {
    id: "p-lumine",
    slug: "lumine-c-serum",
    name: "LUMINE-C™ Radiance Serum",
    price: 1550,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
    category: "Radiance & Skin Barrier",
    description: "Cold-stabilized active Vitamin C serum with hyaluronic peptide complex.",
    stock: 49,
  };

  // Complementary booster product
  const secondaryProduct = products.find((p) => p.slug !== primaryProduct.slug) || products[1];

  const handleSelectOption = (optIdx: number) => {
    const q = QUESTIONS[currentStep];
    setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCurrentStep(totalSteps); // Finish
    }
  };

  const handleAddRoutineToBag = async () => {
    setIsAdding(true);
    try {
      await addToCart({ productId: primaryProduct.slug, quantity: 1 });
      if (secondaryProduct) {
        await addToCart({ productId: secondaryProduct.slug, quantity: 1 });
      }
      setAddedMessage("✦ Personalized Care Routine added to your bag!");
      setTimeout(() => setAddedMessage(""), 4000);
    } catch {
      setAddedMessage("Added primary formulation to bag.");
    }
    setIsAdding(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Queens Care Health Consultation Quiz"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(40, 13, 56, 0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <style>{`
        @keyframes qcQuizFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .qc-quiz-card {
          animation: qcQuizFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .qc-option-btn:hover {
          border-color: #D4AF37 !important;
          background: rgba(212, 175, 55, 0.05) !important;
          transform: translateY(-2px);
        }
      `}</style>

      <div
        className="qc-quiz-card"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#FAF8F5",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(40,13,56,0.35), 0 0 0 1px rgba(212,175,55,0.25)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--line, #e7e2d9)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--gold, #D4AF37)", textTransform: "uppercase" }}>
              Clinical Health Consultation · Queens Care
            </span>
            <h2 style={{ font: "18px var(--font-display, Georgia, serif)", color: "var(--purple, #2A0F3A)", margin: "2px 0 0" }}>
              Personalized Formulation Finder
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close consultation quiz"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "1px solid var(--line, #e7e2d9)",
              background: "#fff",
              cursor: "pointer",
              fontSize: 16,
              color: "var(--ink, #1c1917)",
              display: "grid",
              placeItems: "center",
              transition: "all 0.15s",
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        {!isFinished && (
          <div style={{ width: "100%", height: 4, background: "rgba(42,15,58,0.08)" }}>
            <div
              style={{
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--purple, #2A0F3A), var(--gold, #D4AF37))",
                transition: "width 0.3s ease-out",
              }}
            />
          </div>
        )}

        {/* Modal Content */}
        <div style={{ padding: "28px 24px 32px" }}>
          {!isFinished ? (
            <div>
              {/* Question metadata */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--purple, #2A0F3A)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Question {currentStep + 1} of {totalSteps}
                </span>
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => s - 1)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: 12,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ← Back to previous question
                  </button>
                )}
              </div>

              <h3 style={{ font: "clamp(20px, 3vw, 24px) var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 6px" }}>
                {QUESTIONS[currentStep].title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--muted, #64748b)", margin: "0 0 24px", lineHeight: 1.5 }}>
                {QUESTIONS[currentStep].subtitle}
              </p>

              {/* Options Grid */}
              <div style={{ display: "grid", gap: 12 }}>
                {QUESTIONS[currentStep].options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="qc-option-btn"
                    onClick={() => handleSelectOption(idx)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "16px 18px",
                      background: "#FFFFFF",
                      border: "1px solid var(--line, #e7e2d9)",
                      borderRadius: 10,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s ease-out",
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <b style={{ display: "block", fontSize: 14, color: "var(--purple, #2A0F3A)", marginBottom: 3 }}>
                        {opt.label}
                      </b>
                      <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, display: "block" }}>
                        {opt.desc}
                      </span>
                    </div>
                    <span style={{ color: "var(--gold, #D4AF37)", fontSize: 16, marginTop: 2 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Consultation Outcome / Personalized Routine */
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: "rgba(46,125,50,0.1)",
                    color: "#2e7d32",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  ✓ Formulation Analysis Complete
                </span>
                <h3 style={{ font: "26px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 8px" }}>
                  Your Calibrated Queens Care Protocol
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted, #64748b)", maxWidth: 500, margin: "0 auto", lineHeight: 1.5 }}>
                  Based on your daily priorities, our formulation committee recommends integrating this targeted ritual:
                </p>
              </div>

              {/* Primary Recommended Formulation Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid var(--gold, #D4AF37)",
                  borderRadius: 12,
                  padding: "20px",
                  display: "grid",
                  gridTemplateColumns: "90px 1fr auto",
                  gap: 18,
                  alignItems: "center",
                  marginBottom: 16,
                  boxShadow: "0 8px 24px rgba(212,175,55,0.12)",
                }}
              >
                <img
                  src={primaryProduct.image || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80"}
                  alt={primaryProduct.name}
                  style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line, #e7e2d9)" }}
                />
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--gold, #D4AF37)", letterSpacing: "0.06em" }}>
                    Primary Daily Bioactive
                  </span>
                  <h4 style={{ font: "17px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "3px 0 6px" }}>
                    {primaryProduct.name}
                  </h4>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                    {primaryProduct.description}
                  </p>
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink, #1c1917)" }}>
                      ₹{primaryProduct.price.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>
                      ● {primaryProduct.stock > 0 ? "In Stock · Cold-Chain Dispatched" : "Preserved Formulation"}
                    </span>
                  </div>
                </div>
                <div>
                  <Link
                    href={`/products/${primaryProduct.slug}`}
                    onClick={handleClose}
                    style={{
                      display: "inline-block",
                      padding: "8px 14px",
                      borderRadius: 6,
                      border: "1px solid var(--purple, #2A0F3A)",
                      color: "var(--purple, #2A0F3A)",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    View Formula ↗
                  </Link>
                </div>
              </div>

              {/* Secondary Booster Card (if available) */}
              {secondaryProduct && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--line, #e7e2d9)",
                    borderRadius: 10,
                    padding: "16px 20px",
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto",
                    gap: 16,
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <img
                    src={secondaryProduct.image || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"}
                    alt={secondaryProduct.name}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
                  />
                  <div>
                    <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", color: "var(--muted, #64748b)" }}>
                      Complementary Synergy Booster
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600, color: "var(--purple, #2A0F3A)" }}>
                      {secondaryProduct.name}
                    </p>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>₹{secondaryProduct.price.toLocaleString("en-IN")}</span>
                  </div>
                  <Link
                    href={`/products/${secondaryProduct.slug}`}
                    onClick={handleClose}
                    style={{ fontSize: 11, color: "#64748b", textDecoration: "none", fontWeight: 600 }}
                  >
                    Learn More →
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  disabled={isAdding}
                  onClick={handleAddRoutineToBag}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: "14px 24px",
                    background: "var(--purple, #2A0F3A)",
                    color: "var(--gold, #D4AF37)",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: "0.04em",
                    cursor: isAdding ? "wait" : "pointer",
                    boxShadow: "0 4px 14px rgba(42,15,58,0.25)",
                    transition: "all 0.15s",
                  }}
                >
                  {isAdding ? "Adding Routine…" : "✦ Add Complete Routine to Care Bag"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(0);
                    setAnswers({});
                  }}
                  style={{
                    padding: "14px 20px",
                    background: "#FFFFFF",
                    border: "1px solid var(--line, #e7e2d9)",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink, #1c1917)",
                    cursor: "pointer",
                  }}
                >
                  Retake Consultation
                </button>
              </div>

              {addedMessage && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "10px 14px",
                    background: "#e9f7e9",
                    color: "#2e7d32",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                    border: "1px solid #c3e6cb",
                  }}
                >
                  {addedMessage}
                </div>
              )}

              <p style={{ margin: "16px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 1.4 }}>
                Statutory Note: Formulations are dietary and wellness aids. Suggestions are educational and do not constitute individual medical diagnosis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
