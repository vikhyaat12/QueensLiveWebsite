"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { PromoComponent } from "@/lib/commerce/promotions-types";

interface UniversalMediaBlockProps {
  promo: PromoComponent;
  onTrackClick?: (id: string) => void;
  className?: string;
}

export default function UniversalMediaBlock({
  promo,
  onTrackClick,
  className = "",
}: UniversalMediaBlockProps) {
  const content = promo.content || {};
  const styling = content.styling || {};
  const mediaType = content.mediaType || "none";
  const image = content.image;
  const video = content.video;
  const cta = content.cta;

  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleCtaClick = () => {
    if (onTrackClick) onTrackClick(promo.id);
  };

  return (
    <div
      className={`universal-media-block ${className}`}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        maxWidth: styling.maxWidth || "100%",
        margin: styling.margin || "0 auto",
        padding: styling.padding || "24px 20px",
        background: styling.gradient || styling.backgroundColor || "#FFFFFF",
        color: styling.textColor || "#2A0F3A",
        borderRadius: styling.borderRadius || "12px",
        border: styling.border || "1px solid #EAE6DF",
        boxShadow: styling.boxShadow || "none",
        textAlign: styling.textAlign || "left",
        boxSizing: "border-box",
      }}
    >
      {/* Badge text if specified */}
      {content.badgeText && (
        <div style={{ marginBottom: "8px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "50px",
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: styling.accentColor || "#D4AF37",
              color: "#FFFFFF",
            }}
          >
            {content.badgeText}
          </span>
        </div>
      )}

      {/* Main Headline */}
      {content.headline && (
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: styling.fontSize || "20px",
            fontWeight: styling.fontWeight || 700,
            lineHeight: styling.lineHeight || 1.25,
            letterSpacing: styling.letterSpacing || "-0.01em",
            color: styling.textColor || "inherit",
          }}
        >
          {content.headline}
        </h3>
      )}

      {/* Subheadline & Body */}
      {content.subheadline && (
        <p
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
            opacity: 0.88,
            lineHeight: 1.5,
          }}
        >
          {content.subheadline}
        </p>
      )}

      {content.body && (
        <div
          style={{
            margin: "0 0 16px",
            fontSize: "13.5px",
            opacity: 0.8,
            lineHeight: 1.55,
          }}
        >
          {content.body}
        </div>
      )}

      {/* Image Media Block */}
      {(mediaType === "image" || mediaType === "mixed") && image && (image.desktopUrl || image.mobileUrl) && (
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: `${image.borderRadius ?? 8}px`,
            overflow: "hidden",
            margin: "12px 0",
            aspectRatio: image.aspectRatio || "auto",
          }}
        >
          <picture>
            {image.mobileUrl && (
              <source media="(max-width: 640px)" srcSet={image.mobileUrl} />
            )}
            {image.tabletUrl && (
              <source media="(max-width: 1024px)" srcSet={image.tabletUrl} />
            )}
            <img
              src={image.desktopUrl || image.mobileUrl}
              alt={image.alt || content.headline || "Promotional Media"}
              loading="lazy"
              style={{
                width: image.width ? `${image.width}px` : "100%",
                height: image.height ? `${image.height}px` : "auto",
                objectFit: image.objectFit || "cover",
                objectPosition: image.objectPosition || "center",
                display: "block",
              }}
            />
          </picture>

          {/* Optional Overlay */}
          {image.overlayOpacity && image.overlayOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: image.overlayColor || "#000000",
                opacity: image.overlayOpacity,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      )}

      {/* Video Media Block */}
      {(mediaType === "video" || mediaType === "mixed") && video && (video.mp4Url || video.desktopVideoUrl) && (
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "8px",
            overflow: "hidden",
            margin: "12px 0",
            aspectRatio: video.aspectRatio || "16/9",
            background: "#000000",
          }}
        >
          <video
            ref={videoRef}
            src={video.desktopVideoUrl || video.mp4Url}
            poster={video.posterUrl}
            autoPlay={video.autoplay && !reducedMotion}
            muted={video.muted !== false} // Default muted to ensure policy compliance
            loop={video.loop !== false}
            playsInline={video.playsInline !== false}
            controls={video.controls}
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              objectFit: video.objectFit || "cover",
              display: "block",
            }}
          />
        </div>
      )}

      {/* Call to Action Button */}
      {cta?.enabled && cta.text && cta.destination && (
        <div style={{ marginTop: "16px" }}>
          <Link
            href={cta.destination}
            target={cta.openInNewTab ? "_blank" : undefined}
            rel={cta.openInNewTab ? "noopener noreferrer" : undefined}
            onClick={handleCtaClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: cta.style === "pill" ? "10px 24px" : "10px 20px",
              borderRadius: cta.style === "pill" ? "50px" : "8px",
              background:
                cta.style === "outline"
                  ? "transparent"
                  : cta.backgroundColor || styling.accentColor || "#2A0F3A",
              color:
                cta.style === "outline"
                  ? (cta.backgroundColor || styling.accentColor || "#2A0F3A")
                  : cta.textColor || "#FFFFFF",
              border:
                cta.style === "outline"
                  ? `1.5px solid ${cta.backgroundColor || styling.accentColor || "#2A0F3A"}`
                  : "none",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>{cta.text}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
