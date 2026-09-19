"use client";

import React from "react";

export type DrQueensAssistantBannerProps = {
  onOpenQuiz?: () => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaText?: string;
};

export default function DrQueensAssistantBanner({
  onOpenQuiz,
  eyebrow = "Your Health Our Priority",
  title = "Not sure which product is right for you?",
  description = "Take a short quiz and I'll help you find the best options based on your needs.",
  ctaText = "Take the Health Quiz",
}: DrQueensAssistantBannerProps) {
  return (
    <div
      className="dr-queens-banner-root"
      style={{
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
        background: "linear-gradient(135deg, #FAF5FF 0%, #EEF2FF 50%, #F5F3FF 100%)",
        borderRadius: 24,
        border: "1.5px solid #E0E7FF",
        boxShadow: "0 10px 32px rgba(99, 102, 241, 0.08)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        .dr-queens-banner-grid {
          display: grid;
          grid-template-columns: 320px 1.2fr 300px;
          gap: 28px;
          align-items: center;
          padding: 28px 40px;
        }

        @media (max-width: 1024px) {
          .dr-queens-banner-grid {
            grid-template-columns: 240px 1fr;
          }
          .dr-queens-checklist-col {
            display: none !important;
          }
        }

        @media (max-width: 680px) {
          .dr-queens-banner-grid {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 24px 18px;
            gap: 16px;
          }
          .dr-queens-doc-col {
            margin: 0 auto;
            max-width: 200px;
          }
          .dr-queens-cta-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div className="dr-queens-banner-grid">
        {/* Left Column: Dr. Queens Character with Handwritten Script */}
        <div className="dr-queens-doc-col" style={{ position: "relative" }}>
          <div style={{ marginBottom: 6 }}>
            <span
              style={{
                fontFamily: "var(--font-display, cursive, serif)",
                fontStyle: "italic",
                fontSize: 19,
                fontWeight: 700,
                color: "#1E1638",
                letterSpacing: "-0.01em",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              &ldquo;{eyebrow}&rdquo; <span style={{ color: "#EC4899" }}>💗</span>
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
              <b style={{ fontSize: 14, color: "#1E1638" }}>Dr. Queens</b>
              <span style={{ fontSize: 10.5, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Health Assistant
              </span>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 240,
              height: 190,
              margin: "0 auto",
            }}
          >
            <picture>
              <source srcSet="/images/hero/dr-queens-hd.webp" type="image/webp" />
              <img
                src="/images/hero/dr-queens-hd.png"
                alt="Dr. Queens Health Assistant"
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "bottom center",
                  display: "block",
                  filter: "drop-shadow(0 10px 22px rgba(30,22,56,0.14))",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/reference/dr-queens-quiz-avatar.png";
                }}
              />
            </picture>
          </div>
        </div>

        {/* Center Column: Message & CTA Button */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#6366F1",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              👥
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: "clamp(18px, 2.2vw, 22px)",
                fontWeight: 800,
                color: "#1E1638",
                lineHeight: 1.25,
              }}
            >
              {title}
            </h3>
          </div>

          <p
            style={{
              margin: "0 0 12px",
              fontSize: 13.5,
              color: "#475569",
              lineHeight: 1.55,
              maxWidth: 460,
            }}
          >
            {description}
          </p>

          <div>
            <button
              type="button"
              onClick={onOpenQuiz}
              className="dr-queens-cta-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 28px",
                borderRadius: 999,
                background: "#1E1638",
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(30, 22, 56, 0.22)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <span>{ctaText}</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Right Column: 4-Item Verified Feature Checklist */}
        <div
          className="dr-queens-checklist-col"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            borderLeft: "1px solid rgba(226, 232, 240, 0.8)",
            paddingLeft: 24,
          }}
        >
          {[
            { icon: "👥", text: "Personalized Recommendations" },
            { icon: "🛡️", text: "Trusted by Thousands" },
            { icon: "✦", text: "Better Health Everyday" },
            { icon: "🔒", text: "Secure & Private" },
          ].map((item) => (
            <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#E0E7FF",
                  color: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
