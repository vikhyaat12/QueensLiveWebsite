"use client";

import React from "react";
import Link from "next/link";
import type { PromoComponent } from "@/lib/commerce/promotions-types";

interface UniversalGamificationBlockProps {
  promo: PromoComponent;
  onTrackClick?: (id: string) => void;
  className?: string;
}

export default function UniversalGamificationBlock({
  promo,
  onTrackClick,
  className = "",
}: UniversalGamificationBlockProps) {
  const content = promo.content || {};
  const styling = content.styling || {};
  const game = content.gamification;

  if (!game) return null;

  const threshold = game.computedThreshold ?? (game.customThreshold || 1500);
  const remaining = game.computedRemaining ?? threshold;
  const progressPercent = game.computedProgressPercent ?? 0;
  const isUnlocked = game.computedIsUnlocked ?? (remaining <= 0);

  // Dynamic label calculation: replace "{remaining}" placeholder
  const formattedRemaining = `₹${remaining.toLocaleString("en-IN")}`;
  const rawLabel = game.progressLabelFormat || "Add {remaining} more for Free Shipping";
  const displayLabel = rawLabel.replace(/\{remaining\}/g, formattedRemaining);

  const barHeight = game.barHeight || 8;
  const barFill = game.barFillColor || "linear-gradient(90deg, #D4AF37 0%, #10B981 100%)";
  const barBg = game.barBgColor || "#E5E7EB";

  return (
    <div
      className={`universal-gamification-block ${className}`}
      role="status"
      aria-live="polite"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: styling.maxWidth || "100%",
        margin: styling.margin || "0 auto",
        padding: styling.padding || "14px 18px",
        background: styling.gradient || styling.backgroundColor || "#FDFBF7",
        color: styling.textColor || "#2A0F3A",
        borderRadius: styling.borderRadius || "12px",
        border: styling.border || "1px solid #EAE6DF",
        boxShadow: styling.boxShadow || "none",
        boxSizing: "border-box",
      }}
    >
      {/* Header / Milestone Label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "8px",
          fontSize: styling.fontSize || "13px",
          fontWeight: styling.fontWeight || 600,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>{isUnlocked ? "🎉" : "🚚"}</span>
          <span>{isUnlocked ? (game.successTitle || "Free Delivery Unlocked!") : displayLabel}</span>
        </span>
        <span
          style={{
            fontSize: "12px",
            color: isUnlocked ? "#166534" : "#6B7280",
            fontWeight: 700,
          }}
        >
          {progressPercent}%
        </span>
      </div>

      {/* Dynamic Animated Progress Track */}
      <div
        style={{
          width: "100%",
          height: `${barHeight}px`,
          backgroundColor: barBg,
          borderRadius: "50px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            background: isUnlocked ? "#10B981" : barFill,
            borderRadius: "50px",
            transition: game.animated !== false ? "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
          }}
        />
      </div>

      {/* Subtitle / Reward / Coupon Details if defined */}
      {game.rewardDescription && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "11.5px",
            color: "#6B7280",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>🎁</span>
          <span>{game.rewardDescription}</span>
        </div>
      )}

      {/* Coupon reveal if unlocked */}
      {isUnlocked && game.couponCode && (
        <div
          style={{
            marginTop: "10px",
            padding: "6px 12px",
            background: "#ECFDF5",
            border: "1px dashed #059669",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#065F46",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>Coupon Code:</span>
          <strong style={{ letterSpacing: "0.06em", fontFamily: "monospace" }}>{game.couponCode}</strong>
        </div>
      )}

      {/* Call to action if provided */}
      {content.cta?.enabled && content.cta.text && content.cta.destination && (
        <div style={{ marginTop: "10px", textAlign: "right" }}>
          <Link
            href={content.cta.destination}
            onClick={() => onTrackClick && onTrackClick(promo.id)}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: styling.accentColor || "#2A0F3A",
              textDecoration: "underline",
            }}
          >
            {content.cta.text}
          </Link>
        </div>
      )}
    </div>
  );
}
