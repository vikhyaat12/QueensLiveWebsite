"use client";

import React from "react";
import Link from "next/link";
import type { PromoComponent } from "@/lib/commerce/promotions-types";

interface UniversalAffiliateBlockProps {
  promo: PromoComponent;
  onTrackClick?: (id: string) => void;
  className?: string;
}

export default function UniversalAffiliateBlock({
  promo,
  onTrackClick,
  className = "",
}: UniversalAffiliateBlockProps) {
  const content = promo.content || {};
  const styling = content.styling || {};
  const affiliate = content.affiliate;
  const cta = content.cta;

  return (
    <div
      className={`universal-affiliate-block ${className}`}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: styling.maxWidth || "100%",
        margin: styling.margin || "0 auto",
        padding: styling.padding || "20px 24px",
        background: styling.gradient || styling.backgroundColor || "#FAF8F5",
        color: styling.textColor || "#2A0F3A",
        borderRadius: styling.borderRadius || "12px",
        border: styling.border || "1px solid #EAE6DF",
        boxShadow: styling.boxShadow || "none",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: "4px",
            background: styling.accentColor || "#D4AF37",
            color: "#FFFFFF",
          }}
        >
          {content.badgeText || "Clinical Partner Privileges"}
        </span>
        {affiliate?.partnerId && (
          <span style={{ fontSize: "11.5px", color: "#6B7280" }}>
            Certified Practitioner Recommendation
          </span>
        )}
      </div>

      {content.headline && (
        <h4
          style={{
            margin: "0 0 6px",
            fontSize: styling.fontSize || "18px",
            fontWeight: styling.fontWeight || 700,
            lineHeight: 1.3,
            color: "inherit",
          }}
        >
          {content.headline}
        </h4>
      )}

      {content.subheadline && (
        <p style={{ margin: "0 0 12px", fontSize: "13.5px", opacity: 0.85, lineHeight: 1.5 }}>
          {content.subheadline}
        </p>
      )}

      {affiliate?.disclaimer && (
        <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#9CA3AF", fontStyle: "italic" }}>
          {affiliate.disclaimer}
        </p>
      )}

      {cta?.enabled && cta.text && cta.destination && (
        <div style={{ marginTop: "12px" }}>
          <Link
            href={cta.destination}
            onClick={() => onTrackClick && onTrackClick(promo.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "6px",
              background: cta.backgroundColor || "#2A0F3A",
              color: cta.textColor || "#FFFFFF",
              textDecoration: "none",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>{cta.text}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
