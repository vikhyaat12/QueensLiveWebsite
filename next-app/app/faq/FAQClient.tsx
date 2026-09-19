"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  category?: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: "How is the quality of Queens Care formulations checked?",
    answer: "Batch samples undergo quality testing — including microbial, potency, and stability checks — before release, and ingredient information is printed in full on every label.",
    category: "Quality & Manufacturing",
  },
  {
    question: "How do I verify the authenticity of my Queens Care product?",
    answer: "Every authentic package features tamper-evident security seals, a unique batch number, manufacturing date, expiry date, and verified MRP clearly printed on the outer carton and primary container.",
    category: "Product Authenticity",
  },
  {
    question: "How long does pan-India delivery take?",
    answer: "Orders placed before 2:00 PM IST on business days are dispatched the same day. Major Indian metro cities generally receive deliveries within 24 to 48 hours. Regional and tier-2/3 destinations take 3 to 4 business days.",
    category: "Shipping & Delivery",
  },
  {
    question: "Is Free Shipping available on orders?",
    answer: "Yes. All domestic orders with an order subtotal of ₹499 or higher qualify for 100% Free Express Delivery across India. For orders below ₹499, a nominal standard shipping fee of ₹49 is applied at checkout.",
    category: "Shipping & Delivery",
  },
  {
    question: "What payment methods are supported?",
    answer: "We support all major Indian payment methods through secure 256-bit encrypted gateways (Razorpay and Cashfree), including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) for eligible pincodes.",
    category: "Orders & Payment",
  },
  {
    question: "What is the 15-Day Care Guarantee return policy?",
    answer: "If your order arrives damaged, defective, or incorrect, you can request an immediate replacement or full refund within 15 days of delivery. For hygiene and safety reasons, opened consumables cannot be returned unless physically compromised upon delivery.",
    category: "Returns & Refunds",
  },
  {
    question: "How should I store my Queens Care formulations?",
    answer: "Keep formulations tightly closed in a cool, dry place away from direct sunlight, ideally at or below 25°C. Avoid storing products in humid environments like bathrooms to preserve active ingredient potency.",
    category: "Quality & Manufacturing",
  },
  {
    question: "Can I take Queens Care products alongside my prescription medications?",
    answer: "While our formulations are developed for wide tolerability, active ingredients can occasionally interact with specific prescription drugs. We always recommend showing the formulation monograph to your treating physician before beginning any new regimen.",
    category: "Clinical & Usage",
  },
];

export default function FAQClient({ serverFaqs = [] }: { serverFaqs?: FAQItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Combine server FAQs (if any) with defaults
  const allFaqs = useMemo(() => {
    if (!serverFaqs || serverFaqs.length === 0) {
      return DEFAULT_FAQS;
    }
    const serverMapped: FAQItem[] = serverFaqs.map((f) => ({
      question: f.question,
      answer: f.answer,
      category: f.category || "General",
    }));
    // Merge without exact question duplicates
    const combined = [...serverMapped];
    for (const d of DEFAULT_FAQS) {
      if (!combined.some((c) => c.question.toLowerCase() === d.question.toLowerCase())) {
        combined.push(d);
      }
    }
    return combined;
  }, [serverFaqs]);

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    allFaqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [allFaqs]);

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((faq) => {
      const matchesCat = selectedCategory === "All" || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [allFaqs, selectedCategory, searchQuery]);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <QueensCareHeader activePage="about" />

      <main style={{ flex: 1, padding: "48px 24px 80px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#2A0F3A",
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
            <span>💡</span> Help &amp; Knowledge Base
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(32px, 4vw, 46px)",
              fontWeight: 800,
              color: "#1E1638",
              margin: "0 0 14px",
            }}
          >
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: 16, color: "#64748B", maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
            Quick answers about Queens Care formulations, clinical manufacturing standards, shipping schedules, and order management.
          </p>

          {/* Search Bar */}
          <div style={{ maxWidth: 540, margin: "28px auto 0", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
                color: "#9CA3AF",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by topic, ingredient, or question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 18px 13px 44px",
                borderRadius: 999,
                border: "1px solid #D1D5DB",
                background: "#FFFFFF",
                fontSize: 14.5,
                outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? "#2A0F3A" : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : "#4B5563",
                  border: `1px solid ${isActive ? "#2A0F3A" : "#E5E7EB"}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredFaqs.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "48px 24px",
                textAlign: "center",
                border: "1px solid #EAE6DF",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, color: "#1E1638", margin: "0 0 8px" }}>No matching answers found</h3>
              <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>
                We could not find answers matching &ldquo;{searchQuery}&rdquo;. Feel free to reach out directly to our care team.
              </p>
              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 22px",
                  borderRadius: 8,
                  background: "#2A0F3A",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Contact Customer Care →
              </Link>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    border: `1px solid ${isOpen ? "#D4AF37" : "#EAE6DF"}`,
                    boxShadow: isOpen ? "0 4px 16px rgba(212, 175, 55, 0.08)" : "0 2px 6px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(idx)}
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: isOpen ? "#2A0F3A" : "#1E1638",
                        lineHeight: 1.4,
                      }}
                    >
                      {faq.question}
                    </span>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: isOpen ? "rgba(212, 175, 55, 0.15)" : "#F3F4F6",
                        color: isOpen ? "#B45309" : "#6B7280",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0,
                        transition: "transform 0.2s ease",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: "0 24px 22px",
                        fontSize: 14.5,
                        color: "#4B5563",
                        lineHeight: 1.7,
                        borderTop: "1px solid #F3F4F6",
                        marginTop: -4,
                        paddingTop: 16,
                      }}
                    >
                      <p style={{ margin: 0 }}>{faq.answer}</p>
                      {faq.category && (
                        <div style={{ marginTop: 12 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "#F5F3FF",
                              color: "#2A0F3A",
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {faq.category}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Have Questions Banner */}
        <div
          style={{
            marginTop: 56,
            padding: "36px 32px",
            background: "#2A0F3A",
            borderRadius: 16,
            color: "#FFFFFF",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div>
            <h3 style={{ fontFamily: "var(--font-display, serif)", fontSize: 22, margin: "0 0 6px" }}>
              Still have questions about our formulations?
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>
              Our clinical and customer care specialists are available Mon–Sat 9:00 AM – 6:00 PM IST.
            </p>
          </div>
          <Link
            href="/contact"
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #D4AF37 0%, #B45309 100%)",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
              whiteSpace: "nowrap",
            }}
          >
            Speak with Care Team →
          </Link>
        </div>
      </main>

      <QueensCareFooter />
    </div>
  );
}
