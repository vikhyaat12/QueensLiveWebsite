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
  response?: string | null;
};
type QA = { id: string; question: string; answer: string | null; createdAt: string };
type FAQ = { q: string; a: string };
type Product = { ingredients?: string; usage?: string; description?: string; id?: string; slug?: string; name?: string };

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
    "Description",
    "Ingredients",
    "How to use",
    `Reviews (${reviews.length})`,
    "Q&A",
    "FAQ"
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

  return (
    <section className="product-details-section" style={{ marginTop: 48 }}>
      <div className="detail-tabs" style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--line)", marginBottom: 24, overflowX: "auto" }}>
        {tabs.map((tab, index) => (
          <button key={tab} className={activeTab === index ? "tab-active" : ""}
            onClick={() => setActiveTab(index)}
            style={{ padding: "12px 20px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === index ? 700 : 400, borderBottom: activeTab === index ? "2px solid var(--purple)" : "2px solid transparent", marginBottom: -2, color: activeTab === index ? "var(--purple)" : "var(--muted)", whiteSpace: "nowrap" }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* ─── DESCRIPTION ─── */}
        {activeTab === 0 && (
          <div className="tab-panel active">
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>{product.description}</p>
          </div>
        )}

        {/* ─── INGREDIENTS ─── */}
        {activeTab === 1 && (
          <div className="tab-panel active">
            <h3 style={{ fontSize: 18, color: "var(--purple)", marginBottom: 12 }}>Full ingredient transparency</h3>
            {product.ingredients ? (
              <div style={{ fontSize: 14, lineHeight: 1.8, background: "#faf8f5", padding: "18px 22px", borderRadius: 6, border: "1px solid var(--line)" }}>
                <p style={{ margin: 0 }}>{product.ingredients}</p>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--muted)" }}>
                  <b>INCI Standard:</b> Queens Care Laboratories discloses 100% of functional bioactives, natural carrier bases, and stabilizers without proprietary concealment.
                </div>
              </div>
            ) : (
              <p className="muted">Ingredient details will be available soon. Every ingredient is listed with its purpose and concentration.</p>
            )}
          </div>
        )}

        {/* ─── USAGE ─── */}
        {activeTab === 2 && (
          <div className="tab-panel active">
            <h3 style={{ fontSize: 18, color: "var(--purple)", marginBottom: 12 }}>Suggested ritual</h3>
            {product.usage ? (
              <p style={{ fontSize: 14, lineHeight: 1.8 }}>{product.usage}</p>
            ) : (
              <p className="muted">Usage instructions will be available soon. Follow the suggested daily ritual for best results.</p>
            )}
          </div>
        )}

        {/* ─── REVIEWS ─── */}
        {activeTab === 3 && (
          <div className="tab-panel active">
            {reviews.length === 0 ? (
              <div style={{ padding: "36px 24px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 8, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
                <div style={{ fontSize: 24, color: "var(--gold)", marginBottom: 8 }}>☆</div>
                <h4 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 8px" }}>
                  No customer reviews yet
                </h4>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
                  Be the first to share your experience with this formulation. Queens Care publishes verified customer feedback and never inflates ratings.
                </p>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  style={{ padding: "10px 22px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4 }}
                >
                  {showReviewForm ? "Close Review Form" : "Write a Review →"}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 32 }}>
                <div>
                  <div style={{ textAlign: "center", padding: 20, background: "var(--paper)", borderRadius: 6 }}>
                    <b style={{ font: "36px var(--font-display)", display: "block", color: "var(--purple)" }}>{avgRating}</b>
                    <div style={{ color: "var(--gold)", fontSize: 14, margin: "4px 0" }}>
                      {"★".repeat(Math.round(Number(avgRating) || 5))}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                      Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {ratingDist.map(r => (
                      <div key={r.star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 12 }}>
                        <span style={{ width: 14, color: "var(--muted)" }}>{r.star}★</span>
                        <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 3 }}>
                          <div style={{ width: `${(r.count / maxCount) * 100}%`, height: "100%", background: "var(--gold)", borderRadius: 3 }} />
                        </div>
                        <span style={{ width: 20, textAlign: "right", color: "var(--muted)" }}>{r.count}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      style={{ width: "100%", padding: "10px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4 }}
                    >
                      {showReviewForm ? "Close Review Form" : "Write a Review"}
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ display: "grid", gap: 16 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ padding: 18, border: "1px solid var(--line)", borderRadius: 6, background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{r.user.name}</span>
                            {r.verified && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#2e7d32", background: "#e9f7e9", padding: "2px 8px", borderRadius: 4, fontWeight: 600, marginLeft: 8 }}>
                                ✓ Verified Purchase
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                              {new Date(r.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <span style={{ fontSize: 13, color: "var(--gold)" }}>
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          </span>
                        </div>

                        {r.title && <b style={{ fontSize: 13, display: "block", marginBottom: 4, color: "#2A0F3A" }}>{r.title}</b>}
                        <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "#444" }}>{r.body}</p>

                        {/* Official Pharmacist / Medical Affairs Response */}
                        {r.response && (
                          <div style={{ marginTop: 12, padding: "12px 14px", background: "#faf8f5", borderLeft: "3px solid var(--gold)", borderRadius: "0 4px 4px 0", fontSize: 12 }}>
                            <span style={{ fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: 2 }}>
                              Queens Care Formulation Team Response:
                            </span>
                            <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>{r.response}</p>
                          </div>
                        )}

                        {r.helpful > 0 && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Helpful ({r.helpful})</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Review Submission Form Drawer */}
            {showReviewForm && (
              <div style={{ marginTop: 28, padding: 24, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8, maxWidth: 640, margin: "28px auto 0" }}>
                <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
                  Write a Product Review
                </h4>
                {reviewFeedback && (
                  <p style={{ padding: "8px 12px", background: reviewSuccess ? "#e9f7e9" : "#fde8e8", color: reviewSuccess ? "#2e7d32" : "#b34141", fontSize: 12, borderRadius: 4, marginBottom: 12 }}>
                    {reviewFeedback}
                  </p>
                )}
                {!reviewSuccess && (
                  <form onSubmit={submitReview} style={{ display: "grid", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Rating</label>
                      <select
                        value={reviewRating}
                        onChange={e => setReviewRating(Number(e.target.value))}
                        style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                      >
                        <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                        <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                        <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                        <option value={2}>★★☆☆☆ (2 Stars - Below Expectations)</option>
                        <option value={1}>★☆☆☆☆ (1 Star - Unsatisfactory)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Your Name (optional)</label>
                      <input
                        value={reviewName}
                        onChange={e => setReviewName(e.target.value)}
                        placeholder="e.g. Priya M."
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Review Title / Summary</label>
                      <input
                        value={reviewTitle}
                        onChange={e => setReviewTitle(e.target.value)}
                        placeholder="e.g. Gentle on skin barrier"
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Review Details *</label>
                      <textarea
                        required
                        value={reviewBody}
                        onChange={e => setReviewBody(e.target.value)}
                        placeholder="Describe texture, absorption, tolerability, and routine compatibility..."
                        style={{ width: "100%", minHeight: 80, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4, width: "fit-content" }}
                    >
                      {reviewSubmitting ? "Submitting…" : "Submit Review →"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Review Authenticity Guarantee Notice */}
            <div style={{ marginTop: 32, padding: "14px 18px", background: "#fbf9f6", border: "1px solid var(--line)", borderRadius: 6, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
              <b>Queens Care Review Authenticity Policy:</b> Every review published on this site represents genuine customer feedback. &ldquo;Verified Purchase&rdquo; badges are awarded strictly to verified accounts with fulfilled orders. We do not offer financial incentives or gifts in exchange for reviews.
            </div>
          </div>
        )}

        {/* ─── Q&A ─── */}
        {activeTab === 4 && (
          <div className="tab-panel active">
            <h3>Customer questions &amp; answers</h3>
            <div style={{ margin: "20px 0" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={qaInput} onChange={e => setQaInput(e.target.value)} placeholder="Ask a question about this product…" style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13 }} />
                <button onClick={submitQuestion} style={{ padding: "10px 18px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>Ask</button>
              </div>
              {qaMessage && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{qaMessage}</p>}
            </div>
            {questions.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No questions yet. Be the first to ask.</p>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {questions.map(q => (
                  <div key={q.id} style={{ padding: 16, border: "1px solid var(--line)" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Q: {q.question}</p>
                    {q.answer ? (
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink)", paddingLeft: 16, borderLeft: "2px solid var(--gold)" }}>A: {q.answer}</p>
                    ) : (
                      <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Awaiting answer from our care team.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── FAQ ─── */}
        {activeTab === 5 && (
          <div className="tab-panel active">
            <h3>Frequently asked questions</h3>
            {faqs.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No FAQ available for this product yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {faqs.map((f, i) => (
                  <div key={i} style={{ padding: 16, border: "1px solid var(--line)" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.q}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
