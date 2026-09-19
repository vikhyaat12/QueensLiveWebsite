"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { PromoComponent, TickerItem } from "@/lib/commerce/promotions-types";

interface UniversalTickerProps {
  promo: PromoComponent;
  onTrackClick?: (id: string) => void;
  className?: string;
}

export default function UniversalTicker({ promo, onTrackClick, className = "" }: UniversalTickerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const content = promo.content || {};
  const styling = content.styling || {};
  const items: TickerItem[] = content.items && content.items.length > 0
    ? content.items
    : [{ id: "def-1", text: content.headline || "Clinical Rigor & Formulation Intelligence" }];

  const desktopSpeed = content.tickerSpeed || 24;
  const mobileSpeed = content.tickerMobileSpeed || 16;
  const direction = content.tickerDirection || "rtl";
  const separator = content.tickerSeparator || "✦";
  const pauseOnHover = content.pauseOnHover !== false;

  // Duplicate items 4 times to ensure seamless continuous CSS infinite marquee
  const loopItems = [...items, ...items, ...items, ...items];
  const animPaused = isPaused || (pauseOnHover && isHovered) || reducedMotion;

  const handleItemClick = (item: TickerItem) => {
    if (onTrackClick) onTrackClick(promo.id);
  };

  return (
    <aside
      role="region"
      aria-label={content.headline || promo.name || "Promotional Announcement"}
      className={`universal-ticker ${className}`}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        background: styling.gradient || styling.backgroundColor || "#1A0D28",
        color: styling.textColor || "#F7F1EB",
        borderTop: styling.border || "none",
        borderBottom: styling.border || "none",
        padding: styling.padding || "8px 0",
        fontFamily: styling.fontFamily || "inherit",
        fontSize: styling.fontSize || "12px",
        fontWeight: styling.fontWeight || 500,
        letterSpacing: styling.letterSpacing || "0.04em",
        lineHeight: styling.lineHeight || "1.4",
        boxSizing: "border-box",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Infinite Scrolling Track */}
        <div
          className="ticker-track"
          style={{
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            width: "max-content",
            animation: reducedMotion
              ? "none"
              : `qcTickerMarquee ${desktopSpeed}s linear infinite`,
            animationPlayState: animPaused ? "paused" : "running",
            animationDirection: direction === "ltr" ? "reverse" : "normal",
            willChange: "transform",
          }}
        >
          {loopItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "0 18px",
                flexShrink: 0,
              }}
            >
              {item.icon && <span style={{ fontSize: "13px" }}>{item.icon}</span>}
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  style={{ height: "16px", width: "auto", objectFit: "contain" }}
                />
              )}

              {item.link ? (
                <Link
                  href={item.link}
                  onClick={() => handleItemClick(item)}
                  style={{
                    textDecoration: "none",
                    fontWeight: item.highlight ? 700 : "inherit",
                    color: item.highlight ? (styling.accentColor || "#D4AF37") : "inherit",
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {item.text}
                </Link>
              ) : (
                <span
                  style={{
                    fontWeight: item.highlight ? 700 : "inherit",
                    color: item.highlight ? (styling.accentColor || "#D4AF37") : "inherit",
                  }}
                >
                  {item.text}
                </span>
              )}

              <span
                aria-hidden="true"
                style={{
                  color: styling.accentColor || "#D4AF37",
                  opacity: 0.65,
                  fontSize: "11px",
                  marginLeft: "8px",
                }}
              >
                {separator}
              </span>
            </div>
          ))}
        </div>

        {/* Accessible manual Pause/Play control button */}
        <button
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          aria-label={isPaused ? "Play scrolling announcement" : "Pause scrolling announcement"}
          title={isPaused ? "Play" : "Pause"}
          style={{
            position: "absolute",
            right: "8px",
            background: "rgba(0, 0, 0, 0.25)",
            border: "none",
            borderRadius: "4px",
            color: "#FFFFFF",
            fontSize: "10px",
            padding: "3px 6px",
            cursor: "pointer",
            opacity: isHovered || isPaused ? 1 : 0,
            transition: "opacity 0.2s ease",
            zIndex: 10,
          }}
        >
          {isPaused ? "▶" : "❚❚"}
        </button>
      </div>

      <style jsx>{`
        @keyframes qcTickerMarquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        @media (max-width: 768px) {
          .ticker-track {
            animation-duration: ${mobileSpeed}s !important;
          }
        }
      `}</style>
    </aside>
  );
}
