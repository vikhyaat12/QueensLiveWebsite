"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   UniversalMarquee — Multi-Placement Scrolling Trust & Science Ticker
   - Configurable placements (above_header, below_header, hero, between_sections, above_footer)
   - Infinite GPU-accelerated CSS marquee with pause-on-hover
   - Support for custom icons, separators, links, speeds, and typography
   - Reduced-motion compliant
   ═══════════════════════════════════════════════════════════════════════════ */

export type MarqueeItem = {
  text: string;
  icon?: string;
  link?: string;
};

export type UniversalMarqueeProps = {
  items?: (string | MarqueeItem)[];
  separator?: string;
  speed?: number; // seconds per cycle
  mobileSpeed?: number;
  direction?: "rtl" | "ltr";
  pauseOnHover?: boolean;
  bgColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: number | string;
  letterSpacing?: string;
  height?: number | string;
  borderTop?: boolean | string;
  borderBottom?: boolean | string;
  placement?: "above_header" | "below_header" | "hero" | "between_sections" | "above_footer" | "all";
  currentPlacement?: "above_header" | "below_header" | "hero" | "between_sections" | "above_footer";
  enabled?: boolean;
  className?: string;
};

export default function UniversalMarquee({
  items = [
    "Clinical Intelligence",
    "Traceable Bioactives",
    "Designed with Physicians",
    "Pharmaceutical Rigor",
    "Everyday Wellness",
    "Batch-Tested Purity",
  ],
  separator = "✦",
  speed = 26,
  mobileSpeed = 18,
  direction = "rtl",
  pauseOnHover = true,
  bgColor = "linear-gradient(90deg, rgba(42,15,58,0.03) 0%, rgba(212,175,55,0.05) 50%, rgba(42,15,58,0.03) 100%)",
  textColor = "var(--ink, #1c1917)",
  fontSize = "12px",
  fontWeight = 600,
  letterSpacing = "0.08em",
  height = 42,
  borderTop = "1px solid rgba(212,175,55,0.15)",
  borderBottom = "1px solid rgba(212,175,55,0.15)",
  placement = "all",
  currentPlacement,
  enabled = true,
  className = "",
}: UniversalMarqueeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!enabled) return null;

  // Placement filter check
  if (placement !== "all" && currentPlacement && placement !== currentPlacement) {
    return null;
  }

  const normalizedItems: MarqueeItem[] = items.map((item) => {
    if (typeof item === "string") {
      return { text: item };
    }
    return item;
  });

  if (normalizedItems.length === 0) return null;

  // We duplicate items 4 times to ensure seamless infinite looping without gaps
  const loopItems = [...normalizedItems, ...normalizedItems, ...normalizedItems, ...normalizedItems];

  const animDir = direction === "ltr" ? "reverse" : "normal";

  return (
    <div
      className={`universal-marquee-wrap ${className}`}
      onMouseEnter={() => pauseOnHover && setIsHovered(true)}
      onMouseLeave={() => pauseOnHover && setIsHovered(false)}
      style={{
        width: "100%",
        overflow: "hidden",
        position: "relative",
        background: bgColor,
        color: textColor,
        height: typeof height === "number" ? `${height}px` : height,
        display: "flex",
        alignItems: "center",
        borderTop: borderTop === true ? "1px solid var(--line, #e7e2d9)" : borderTop || "none",
        borderBottom: borderBottom === true ? "1px solid var(--line, #e7e2d9)" : borderBottom || "none",
        userSelect: "none",
        zIndex: 5,
      }}
    >
      <style>{`
        @keyframes qcMarqueeScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .universal-marquee-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          will-change: transform;
          animation: qcMarqueeScroll ${speed}s linear infinite ${animDir};
          animation-play-state: ${isHovered || reducedMotion ? "paused" : "running"};
        }

        @media (max-width: 768px) {
          .universal-marquee-track {
            animation-duration: ${mobileSpeed}s;
          }
        }
      `}</style>

      {/* Subtle fade edges for luxury feel */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 48,
          background: "linear-gradient(to right, rgba(250,248,245,1), rgba(250,248,245,0))",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 48,
          background: "linear-gradient(to left, rgba(250,248,245,1), rgba(250,248,245,0))",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Track */}
      <div className="universal-marquee-track">
        {loopItems.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "0 18px",
              fontSize,
              fontWeight: fontWeight as React.CSSProperties["fontWeight"],
              letterSpacing,
              textTransform: "uppercase",
            }}
          >
            {item.icon && <span style={{ color: "var(--gold, #D4AF37)" }}>{item.icon}</span>}
            {item.link ? (
              <Link
                href={item.link}
                style={{
                  color: "inherit",
                  textDecoration: "none",
                  borderBottom: "1px dashed rgba(212,175,55,0.4)",
                  transition: "opacity 0.15s",
                }}
              >
                {item.text}
              </Link>
            ) : (
              <span>{item.text}</span>
            )}
            <span
              style={{
                color: "var(--gold, #D4AF37)",
                opacity: 0.7,
                fontSize: "0.8em",
                marginLeft: 6,
              }}
              aria-hidden="true"
            >
              {separator}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
