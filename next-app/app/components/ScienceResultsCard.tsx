"use client";

import React, { useState } from "react";
import Link from "next/link";
import VideoLightboxModal from "./VideoLightboxModal";

export type ScienceResultsCardProps = {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  videoUrl?: string;
  badges?: Array<{ icon?: string; text?: string }>;
  labImage?: string;
};

export default function ScienceResultsCard({
  title = "Real Science Real Results",
  subtitle = "Discover the ingredients, research and care behind every Queens Care product.",
  ctaText = "Explore Our Science",
  ctaLink = "/research-development",
  videoUrl = "",
  badges,
  labImage = "/images/reference/science-lab-hd.webp",
}: ScienceResultsCardProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <div
      className="science-results-card-root"
      style={{
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
        background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #FAF5FF 100%)",
        borderRadius: 24,
        border: "1.5px solid #E0E7FF",
        boxShadow: "0 8px 28px rgba(99, 102, 241, 0.06)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        .science-card-grid {
          display: grid;
          grid-template-columns: 1.1fr auto 1.3fr;
          gap: 32px;
          align-items: center;
          padding: 38px 48px;
        }

        @media (max-width: 1024px) {
          .science-card-grid {
            grid-template-columns: 1fr;
            padding: 28px 20px;
            text-align: center;
          }
          .science-cta-wrap {
            justify-content: center !important;
          }
          .science-badges-wrap {
            align-items: center !important;
          }
        }
      `}</style>

      <div className="science-card-grid">
        {/* Left Column: Heading, Subtitle & Button */}
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(28px, 3.4vw, 40px)",
              fontWeight: 850,
              color: "#1E1638",
              lineHeight: 1.15,
              margin: "0 0 14px",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: 14.5,
              lineHeight: 1.65,
              color: "#475569",
              maxWidth: 420,
              margin: "0 0 24px",
            }}
          >
            {subtitle}
          </p>

          <div className="science-cta-wrap" style={{ display: "flex", gap: 12 }}>
            <Link
              href={ctaLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#1E1638",
                color: "#FFFFFF",
                borderRadius: 999,
                padding: "13px 28px",
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 6px 18px rgba(30, 22, 56, 0.22)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <span>{ctaText}</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Center: Interactive Circular Play Button (only when a video is configured) */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {videoUrl ? (
            <button
              type="button"
              onClick={() => setVideoModalOpen(true)}
              aria-label="Play science formulation documentary"
              title="Watch science formulation documentary"
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "#1E1638",
                color: "#FFFFFF",
                border: "3px solid rgba(255, 255, 255, 0.95)",
                boxShadow: "0 8px 24px rgba(30, 22, 56, 0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 18,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <span style={{ marginLeft: 3 }}>▶</span>
            </button>
          ) : null}
        </div>

        {/* Right Column: Floating Badges & High-Res Laboratory Visual */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          {/* Benefit Badges */}
          <div
            className="science-badges-wrap"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flexShrink: 0,
            }}
          >
            {(Array.isArray(badges) && badges.length > 0
              ? badges
              : [
                  { icon: "🛡️", text: "Transparent Ingredients" },
                  { icon: "🔬", text: "Clinically Researched" },
                  { icon: "✦", text: "Quality Assured" },
                ]
            ).map((badge) => (
              <div
                key={badge.text}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 999,
                  border: "1px solid #E0E7FF",
                  boxShadow: "0 2px 10px rgba(99, 102, 241, 0.08)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#4338CA",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>

          {/* High-Resolution Laboratory Visual */}
          <div
            style={{
              maxWidth: 360,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <picture>
              <source srcSet={labImage.endsWith(".webp") ? labImage : "/images/reference/science-lab-hd.webp"} type="image/webp" />
              <img
                src={labImage}
                alt="Queens Care Laboratory Rigor"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 220,
                  borderRadius: 14,
                  objectFit: "cover",
                  boxShadow: "0 12px 28px rgba(30, 22, 56, 0.12)",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/reference/science-lab-hd.jpg";
                }}
              />
            </picture>
          </div>
        </div>
      </div>

      {/* Video Lightbox Modal */}
      <VideoLightboxModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={videoUrl}
        title={title}
      />
    </div>
  );
}
