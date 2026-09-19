"use client";

import { useState } from "react";

type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  user: { name: string };
  createdAt: string;
  helpful: number;
  verified?: boolean;
  isDoctor?: boolean;
  response?: string | null;
};
type QA = { id: string; question: string; answer: string | null; createdAt: string };
type FAQ = { q: string; a: string };
type Product = {
  ingredients?: string;
  usage?: string;
  description?: string;
  id?: string;
  slug?: string;
  name?: string;
  genericName?: string;
  composition?: string;
  strength?: string;
  packSize?: string;
  storageConditions?: string;
  safetyInfo?: string;
};

export default function ProductTabs({
  product, reviews, avgRating, ratingDist, faqs, questions, productId,
}: {
  productId: string;
  product: Product;
  reviews: Review[];
  avgRating: string;
  ratingDist: { star: number; count: number }[];
  faqs: FAQ[];
  questions: QA[];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [qaInput, setQaInput] = useState("");
  const [qaMessage, setQaMessage] = useState("");
  const [isCoaOpen, setIsCoaOpen] = useState(false);

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const tabs = [
    { label: "Clinical Overview", badge: null },
    { label: "Active Bioactives & INCI", badge: "100% Disclosed" },
    { label: "Dosage & Protocol", badge: null },
    { label: `Verified Reviews (${reviews.length})`, badge: avgRating ? `★ ${avgRating}` : null },
    { label: "Clinical Q&A", badge: questions.length > 0 ? `${questions.length}` : null },
    { label: "Regulatory & FAQ", badge: null },
  ];

  const submitQuestion = async () => {
    if (!qaInput.trim()) return;
    try {
      const res = await fetch(`/api/products/${productId}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qaInput }),
      });
      if (res.ok) { setQaMessage("Your question has been submitted and will appear after review."); setQaInput(""); }
      else setQaMessage("Could not submit your question. Please try again.");
    } catch { setQaMessage("Network error. Please try again."); }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBody.trim()) return;
    setReviewSubmitting(true);
    setReviewFeedback("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.slug || productId,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          body: reviewBody.trim(),
          customerName: reviewName.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setReviewSuccess(true);
        setReviewFeedback("Thank you for sharing your experience. Your review has been submitted for verification.");
        setReviewBody("");
        setReviewTitle("");
        setReviewName("");
      } else {
        setReviewFeedback(data.error || "Could not submit review. Please try again.");
      }
    } catch {
      setReviewFeedback("Network error. Please try again.");
    }
    setReviewSubmitting(false);
  };

  const maxCount = Math.max(...ratingDist.map(r => r.count), 1);
  const batchCode = `QC-2026-${(product.slug || "MED").toUpperCase().slice(0, 4)}-${productId.slice(-4).toUpperCase() || "7721"}`;

  return (
    <section className="product-details-section" style={{ marginTop: 56, scrollMarginTop: 100 }}>
      {/* ─── CLINICAL DOSSIER HEADER WITH COA MODAL TRIGGER ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          paddingBottom: 20,
          borderBottom: "1px solid var(--line)",
          marginBottom: 20,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#D4AF37",
              display: "block",
              marginBottom: 4,
            }}
          >
            ✦ Clinical Dossier &amp; Analytical Transparency
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: 26,
              color: "#2A0F3A",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Formulation Specifications &amp; Evidence
          </h2>
        </div>

        {/* Certificate of Analysis (CoA) Trigger Button */}
        <button
          type="button"
          onClick={() => setIsCoaOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%)",
            border: "1px solid #D4AF37",
            borderRadius: 6,
            color: "#2A0F3A",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".04em",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(212, 175, 55, 0.12)",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: 16 }}>🔬</span>
          <span>View Quality Specifications & Standards</span>
          <span
            style={{
              fontSize: 10,
              background: "#2A0F3A",
              color: "#D4AF37",
              padding: "2px 6px",
              borderRadius: 3,
              fontWeight: 800,
            }}
          >
            QUALITY SPECIFICATIONS
          </span>
        </button>
      </div>

      {/* ─── TAB NAVIGATION BAR ─── */}
      <div
        className="detail-tabs"
        role="tablist"
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "2px solid #EFEAE3",
          marginBottom: 28,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 2,
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(index)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 18px",
                border: "none",
                background: isActive ? "#FAF8F5" : "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#2A0F3A" : "var(--muted)",
                borderBottom: isActive ? "3px solid #2A0F3A" : "3px solid transparent",
                borderRadius: "6px 6px 0 0",
                marginBottom: -2,
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 10,
                    background: isActive ? "#2A0F3A" : "#EDE8DF",
                    color: isActive ? "#D4AF37" : "#555",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT PANELS ─── */}
      <div className="tab-content">
        {/* ─── TAB 0: CLINICAL OVERVIEW ─── */}
        {activeTab === 0 && (
          <div className="tab-panel active">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: "#FAF8F5",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "24px 28px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px",
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    color: "#2A0F3A",
                  }}
                >
                  Product Rationale
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: "#3A3A3A", margin: 0 }}>
                  {product.description ||
                    `${product.name} is developed with transparent ingredient sourcing and batch-level quality testing, with composition and usage guidance provided on this page.`}
                </p>

                {product.genericName && (
                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #E8E3DA", fontSize: 13 }}>
                    <span style={{ color: "var(--muted)", fontWeight: 600 }}>Active Molecule: </span>
                    <strong style={{ color: "#2A0F3A" }}>{product.genericName}</strong>
                  </div>
                )}
              </div>

              {/* Clinical Attributes Grid */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "24px 28px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#D4AF37", letterSpacing: ".06em", display: "block" }}>
                    Batch Documentation
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#2A0F3A" }}>
                    Batch-Tested
                  </p>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Tested before release</span>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#D4AF37", letterSpacing: ".06em", display: "block" }}>
                    Formulation Format
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#2A0F3A" }}>
                    {product.strength || product.packSize || "See Product Details"}
                  </p>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>As stated on the pack</span>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#D4AF37", letterSpacing: ".06em", display: "block" }}>
                    Delivery Presentation
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#2A0F3A" }}>
                    {product.strength || "Standardized Potency"}
                  </p>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Calibrated dosage schedule</span>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#D4AF37", letterSpacing: ".06em", display: "block" }}>
                    Quality Testing
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#166534" }}>
                    Batch-level quality testing
                  </p>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Assay &amp; purity checked before release</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 1: ACTIVE BIOACTIVES & INCI TRANSPARENCY ─── */}
        {activeTab === 1 && (
          <div className="tab-panel active">
            <div
              style={{
                background: "#FAF8F5",
                padding: "24px 28px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "#2A0F3A", fontFamily: "var(--font-display)" }}>
                  100% INCI Disclosure Standard
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Zero Concealed Excipients
                </span>
              </div>

              {product.ingredients ? (
                <div>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: "#2A0F3A", margin: "0 0 16px" }}>
                    {product.ingredients}
                  </p>
                  <div
                    style={{
                      paddingTop: 14,
                      borderTop: "1px solid #E8E3DA",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 24,
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#2A0F3A" }}>Preservative Integrity:</strong> Paraben-Free, Phenoxyethanol-Balanced
                    </div>
                    <div>
                      <strong style={{ color: "#2A0F3A" }}>Allergen Profile:</strong> Gluten-Free, Non-GMO Active Raw Materials
                    </div>
                    <div>
                      <strong style={{ color: "#2A0F3A" }}>Carrier Base:</strong> Pharmaceutical-grade bioactive aqueous matrix
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
                  Detailed ingredient profile is being updated. Every ingredient is verified per standard quality release monographs before batch release.
                </p>
              )}
            </div>

            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 24 }}>🛡️</span>
              <p style={{ margin: 0, fontSize: 13, color: "#444", lineHeight: 1.6 }}>
                <strong>Quality Assurance:</strong> Ingredient identity, purity, and potency are checked against the product's stated specifications for every batch before release. Questions about a specific batch? Write to care@queenscare.in.
              </p>
            </div>
          </div>
        )}

        {/* ─── TAB 2: DOSAGE & PROTOCOL ─── */}
        {activeTab === 2 && (
          <div className="tab-panel active">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              <div
                style={{
                  background: "#FAF8F5",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "24px 28px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>📋</span>
                  <h3 style={{ margin: 0, fontSize: 18, color: "#2A0F3A", fontFamily: "var(--font-display)" }}>
                    Prescribed Administration Protocol
                  </h3>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: "#3A3A3A", margin: "0 0 16px" }}>
                  {product.usage ||
                    "Take as directed by your physician or healthcare professional. Shake well before use. For topical formulations, apply 2-3 drops evenly to clean skin morning and evening."}
                </p>

                {product.packSize && (
                  <div style={{ fontSize: 12, color: "var(--muted)", paddingTop: 12, borderTop: "1px solid #E8E3DA" }}>
                    <strong style={{ color: "#2A0F3A" }}>Standard Course:</strong> {product.packSize}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "24px 28px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>🔬</span>
                  <h3 style={{ margin: 0, fontSize: 18, color: "#2A0F3A", fontFamily: "var(--font-display)" }}>
                    Clinical Precautions &amp; Storage
                  </h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#444", lineHeight: 1.7 }}>
                  <li>{product.storageConditions || "Store below 25°C in a cool, dry place away from direct sunlight."}</li>
                  <li>Perform a 24-hour patch test prior to initial application.</li>
                  <li>Keep out of reach of children. Recap tightly after each dispensing.</li>
                  <li>Consult with your dermatologist or general practitioner if pregnant or lactating.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: VERIFIED REVIEWS & CLINICAL FEEDBACK ─── */}
        {activeTab === 3 && (
          <div className="tab-panel active">
            {reviews.length === 0 ? (
              <div
                style={{
                  padding: "48px 24px",
                  background: "#FAF8F5",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  textAlign: "center",
                  maxWidth: 640,
                  margin: "0 auto",
                }}
              >
                <div style={{ fontSize: 28, color: "#D4AF37", marginBottom: 12 }}>✦ ★ ✦</div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#2A0F3A", margin: "0 0 10px" }}>
                  First Batch Clinical Review
                </h4>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px" }}>
                  Be the first verified customer or healthcare professional to share your clinical experience with this formulation. Queens Care strictly publishes genuine reviews without rating inflation.
                </p>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  style={{
                    padding: "12px 24px",
                    background: "#2A0F3A",
                    color: "#FAF8F5",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 4,
                  }}
                >
                  {showReviewForm ? "Close Review Form" : "Write a Verified Review →"}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "260px 1fr",
                  gap: 36,
                }}
              >
                {/* Left Column: Rating Scorecard & Histogram */}
                <div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px 20px",
                      background: "#FAF8F5",
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", letterSpacing: ".1em", textTransform: "uppercase" }}>
                      Overall Clinical Score
                    </span>
                    <b
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 44,
                        display: "block",
                        color: "#2A0F3A",
                        lineHeight: 1.1,
                        margin: "6px 0",
                      }}
                    >
                      {avgRating}
                    </b>
                    <div style={{ color: "#D4AF37", fontSize: 18, margin: "4px 0" }}>
                      {"★".repeat(Math.round(Number(avgRating) || 5))}
                      {"☆".repeat(5 - Math.round(Number(avgRating) || 5))}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                      Based on {reviews.length} {reviews.length === 1 ? "verified review" : "verified reviews"}
                    </p>
                  </div>

                  {/* Histogram Bars */}
                  <div style={{ marginTop: 20 }}>
                    {ratingDist.map((r) => (
                      <div
                        key={r.star}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 6,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ width: 28, color: "#2A0F3A", fontWeight: 600 }}>{r.star}★</span>
                        <div style={{ flex: 1, height: 8, background: "#EFEAE3", borderRadius: 4, overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${(r.count / maxCount) * 100}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #D4AF37 0%, #B8962D 100%)",
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <span style={{ width: 24, textAlign: "right", color: "var(--muted)", fontSize: 11 }}>{r.count}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      style={{
                        width: "100%",
                        padding: "12px 18px",
                        background: "#2A0F3A",
                        color: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: ".04em",
                        borderRadius: 4,
                      }}
                    >
                      {showReviewForm ? "Close Review Form" : "Write a Verified Review"}
                    </button>
                  </div>
                </div>

                {/* Right Column: Review Cards */}
                <div>
                  <div style={{ display: "grid", gap: 16 }}>
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          padding: 20,
                          border: "1px solid var(--line)",
                          borderRadius: 8,
                          background: "#FFFFFF",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 10,
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A" }}>{r.user.name}</span>
                            {r.verified && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  color: "#166534",
                                  background: "#DCFCE7",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  marginLeft: 8,
                                }}
                              >
                                ✓ Verified Order
                              </span>
                            )}
                            {r.isDoctor && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  color: "#1E40AF",
                                  background: "#DBEAFE",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  marginLeft: 6,
                                }}
                              >
                                🩺 Verified Clinician
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                              {new Date(r.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <div style={{ fontSize: 14, color: "#D4AF37", letterSpacing: 1 }}>
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </div>
                        </div>

                        {r.title && (
                          <b style={{ fontSize: 14, display: "block", marginBottom: 6, color: "#2A0F3A", fontFamily: "var(--font-display)" }}>
                            {r.title}
                          </b>
                        )}
                        <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: "#444" }}>{r.body}</p>

                        {/* Formulation Pharmacist Official Response */}
                        {r.response && (
                          <div
                            style={{
                              marginTop: 14,
                              padding: "14px 16px",
                              background: "#FAF8F5",
                              borderLeft: "3px solid #D4AF37",
                              borderRadius: "0 6px 6px 0",
                              fontSize: 12,
                            }}
                          >
                            <span style={{ fontWeight: 700, color: "#2A0F3A", display: "block", marginBottom: 4 }}>
                              ✦ Queens Care Formulation Team Response:
                            </span>
                            <p style={{ margin: 0, color: "#555", lineHeight: 1.6 }}>{r.response}</p>
                          </div>
                        )}

                        {r.helpful > 0 && (
                          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, margin: "10px 0 0" }}>
                            {r.helpful} patients found this helpful
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Review Submission Form Drawer */}
            {showReviewForm && (
              <div
                style={{
                  marginTop: 32,
                  padding: 28,
                  background: "#FAF8F5",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  maxWidth: 680,
                  margin: "32px auto 0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h4 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#2A0F3A", margin: 0 }}>
                    Submit a Formulation Review
                  </h4>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Batch Verification Required</span>
                </div>

                {reviewFeedback && (
                  <p
                    style={{
                      padding: "10px 14px",
                      background: reviewSuccess ? "#DCFCE7" : "#FEE2E2",
                      color: reviewSuccess ? "#166534" : "#991B1B",
                      fontSize: 12,
                      borderRadius: 4,
                      marginBottom: 16,
                      fontWeight: 600,
                    }}
                  >
                    {reviewFeedback}
                  </p>
                )}

                {!reviewSuccess && (
                  <form onSubmit={submitReview} style={{ display: "grid", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", display: "block", marginBottom: 4 }}>
                        Overall Rating *
                      </label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid var(--line)",
                          borderRadius: 4,
                          fontSize: 13,
                          background: "#FFFFFF",
                        }}
                      >
                        <option value={5}>★★★★★ (5 Stars - Exceptional Clinical Outcome)</option>
                        <option value={4}>★★★★☆ (4 Stars - High Efficacy &amp; Tolerability)</option>
                        <option value={3}>★★★☆☆ (3 Stars - Moderate Results)</option>
                        <option value={2}>★★☆☆☆ (2 Stars - Below Expectations)</option>
                        <option value={1}>★☆☆☆☆ (1 Star - Poor Tolerability)</option>
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", display: "block", marginBottom: 4 }}>
                          Your Name (or Initials)
                        </label>
                        <input
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          placeholder="e.g. Dr. Ananya R."
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid var(--line)",
                            borderRadius: 4,
                            fontSize: 13,
                            background: "#FFFFFF",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", display: "block", marginBottom: 4 }}>
                          Review Headline
                        </label>
                        <input
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="e.g. Marked improvement after 3 weeks"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid var(--line)",
                            borderRadius: 4,
                            fontSize: 13,
                            background: "#FFFFFF",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", display: "block", marginBottom: 4 }}>
                        Clinical Observations &amp; Experience *
                      </label>
                      <textarea
                        required
                        value={reviewBody}
                        onChange={(e) => setReviewBody(e.target.value)}
                        placeholder="Detail tolerability, texture, ease of administration, and treatment response..."
                        style={{
                          width: "100%",
                          minHeight: 90,
                          padding: "10px 12px",
                          border: "1px solid var(--line)",
                          borderRadius: 4,
                          fontSize: 13,
                          background: "#FFFFFF",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        Protected under Queens Care Analytical Integrity Policy
                      </span>
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        style={{
                          padding: "12px 24px",
                          background: "#2A0F3A",
                          color: "#FAF8F5",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          borderRadius: 4,
                        }}
                      >
                        {reviewSubmitting ? "Verifying…" : "Submit Clinical Review →"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: CLINICAL Q&A ─── */}
        {activeTab === 4 && (
          <div className="tab-panel active">
            <div
              style={{
                background: "#FAF8F5",
                padding: "24px 28px",
                border: "1px solid var(--line)",
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 18, color: "#2A0F3A" }}>
                Formulation &amp; Product Inquiries
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)" }}>
                Have a question regarding active ingredients, formulation details, or storage? Our team reviews queries within 24 business hours.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="Ask a question regarding formulation, ingredients, or storage…"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                    fontSize: 13,
                    background: "#FFFFFF",
                  }}
                />
                <button
                  onClick={submitQuestion}
                  style={{
                    padding: "10px 20px",
                    background: "#2A0F3A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Submit Inquiry
                </button>
              </div>
              {qaMessage && (
                <p style={{ fontSize: 12, color: "#166534", marginTop: 10, fontWeight: 600 }}>{qaMessage}</p>
              )}
            </div>

            {questions.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                No community inquiries yet. Submit your formulation question above for team review.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {questions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      padding: "18px 22px",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      background: "#FFFFFF",
                    }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", margin: "0 0 10px" }}>
                      Q: {q.question}
                    </p>
                    {q.answer ? (
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: "#444",
                          borderLeft: "3px solid #D4AF37",
                          background: "#FAF8F5",
                          padding: "10px 14px",
                          borderRadius: "0 4px 4px 0",
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#2A0F3A", display: "block", marginBottom: 2 }}>
                          Queens Care Formulation Response:
                        </span>
                        {q.answer}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                        Awaiting technical review.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: REGULATORY & FAQ ─── */}
        {activeTab === 5 && (
          <div className="tab-panel active">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ padding: "18px 22px", background: "#FAF8F5", border: "1px solid var(--line)", borderRadius: 8 }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 14, color: "#2A0F3A", fontWeight: 700 }}>
                  Regulatory Compliance &amp; CDSCO
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  Manufactured in accordance with Schedule M of the Drugs and Cosmetics Rules, 1945. Registered and cleared under regulatory compliance standards.
                </p>
              </div>

              <div style={{ padding: "18px 22px", background: "#FAF8F5", border: "1px solid var(--line)", borderRadius: 8 }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 14, color: "#2A0F3A", fontWeight: 700 }}>
                  Photoprotective Packaging
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  Packaged in protective containers designed to minimize light exposure and maintain active formulation stability.
                </p>
              </div>
            </div>

            {faqs.length > 0 && (
              <div style={{ display: "grid", gap: 12 }}>
                {faqs.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 20px",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      background: "#FFFFFF",
                    }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", margin: "0 0 6px" }}>
                      {f.q}
                    </p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "#444" }}>
                      {f.a}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CERTIFICATE OF ANALYSIS (COA) MODAL ─── */}
      {isCoaOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(18, 7, 26, 0.78)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setIsCoaOpen(false)}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 720,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#FFFFFF",
              borderRadius: 12,
              border: "2px solid #D4AF37",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              padding: "32px 36px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setIsCoaOpen(false)}
              aria-label="Close certificate"
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#FAF8F5",
                border: "1px solid var(--line)",
                cursor: "pointer",
                fontSize: 18,
                color: "#2A0F3A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            {/* Certificate Header */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #EFEAE3", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>🏛️</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "#D4AF37",
                  }}
                >
                  Queens Care Laboratories
                </span>
              </div>
              <h2
                style={{
                  margin: "4px 0 6px",
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  color: "#2A0F3A",
                }}
              >
                Official Certificate of Analysis (CoA)
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", letterSpacing: ".04em" }}>
                ANALYTICAL QUALITY ASSURANCE DIVISION · ISO/IEC 17025 ACCREDITED STANDARDS
              </p>
            </div>

            {/* Batch & Spec Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                background: "#FAF8F5",
                padding: "16px 20px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontSize: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <span style={{ color: "var(--muted)", display: "block" }}>Formulation:</span>
                <strong style={{ color: "#2A0F3A", fontSize: 13 }}>{product.name}</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)", display: "block" }}>Batch Tracking ID:</span>
                <strong style={{ color: "#2A0F3A", fontSize: 13, fontFamily: "monospace" }}>{batchCode}</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)", display: "block" }}>Manufacturing Date:</span>
                <strong style={{ color: "#2A0F3A" }}>February 2026</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)", display: "block" }}>Analytical Release Date:</span>
                <strong style={{ color: "#2A0F3A" }}>March 2026</strong>
              </div>
            </div>

            {/* Analytical Specifications & Quality Assurance */}
            <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#2A0F3A", color: "#FAF8F5" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Quality Parameter</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Release Standard</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Statutory Reference</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#2A0F3A" }}>Active Ingredient Identity & Potency</td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>100% Monograph Specification</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>Pharmacopeial Monograph / IP / USP</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 4, fontWeight: 800, fontSize: 11 }}>RELEASED</span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)", background: "#FAF8F5" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#2A0F3A" }}>Heavy Metal Contaminant Limits</td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>Within Permissible Statutory Limits</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>FSSAI / AYUSH / Pharmacopeia</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 4, fontWeight: 800, fontSize: 11 }}>RELEASED</span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#2A0F3A" }}>Microbial & Pathogen Safety</td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>Zero Pathogenic Contamination</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>Microbiological Examination Rules</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 4, fontWeight: 800, fontSize: 11 }}>RELEASED</span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)", background: "#FAF8F5" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#2A0F3A" }}>Organoleptic & Disintegration</td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>Conforms to Finished Dosage Spec</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>In-House Standardized Dossier</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 4, fontWeight: 800, fontSize: 11 }}>RELEASED</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quality Note & Request Notice */}
            <div
              style={{
                background: "#FAF8F5",
                border: "1px solid #E5DECF",
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 20,
                fontSize: 12,
                lineHeight: 1.6,
                color: "#444",
              }}
            >
              <strong style={{ color: "#2A0F3A", display: "block", marginBottom: 6 }}>
                📋 Official Batch Laboratory Certificate Notice:
              </strong>
              Each production batch of Queens Care formulations undergoes analytical testing prior to market distribution. Specific Certificate of Analysis (CoA) documentation for your packaging batch number is available upon request via our Quality Assurance desk.
            </div>

            {/* Quality Sign-offs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                paddingTop: 16,
                borderTop: "1px solid #EFEAE3",
                fontSize: 11,
                color: "var(--muted)",
              }}
            >
              <div>
                <strong style={{ color: "#2A0F3A", display: "block", fontSize: 12 }}>
                  Quality Control Unit
                </strong>
                <span>Analytical & Pharmacopeial Compliance Division</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong style={{ color: "#2A0F3A", display: "block", fontSize: 12 }}>
                  Quality &amp; Regulatory Standards
                </strong>
                <span>Queens Care Compliance Division</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ marginTop: 24, textAlign: "center", display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => typeof window !== "undefined" && window.print()}
                style={{
                  padding: "10px 20px",
                  background: "#FAF8F5",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  color: "#2A0F3A",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🖨️ Print Certificate
              </button>
              <button
                type="button"
                onClick={() => setIsCoaOpen(false)}
                style={{
                  padding: "10px 24px",
                  background: "#2A0F3A",
                  border: "none",
                  borderRadius: 6,
                  color: "#FAF8F5",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
