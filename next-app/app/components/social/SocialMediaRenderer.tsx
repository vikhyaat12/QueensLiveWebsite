"use client";

import React, { useEffect, useState } from "react";
import { PLATFORM_REGISTRY, SocialBrandIcon } from "../SocialIcons";

export type SocialPlacement =
  | "header"
  | "announcement"
  | "footer"
  | "homepage"
  | "contact"
  | "about"
  | "people"
  | "blog"
  | "affiliate"
  | "all"
  | string;

export interface SocialLinkItem {
  id: string;
  platform: string;
  category?: "social" | "marketplace" | "custom";
  label: string;
  tooltip?: string;
  url: string;
  icon?: string;
  iconVariant?: "official" | "monochrome" | "circular" | "outline";
  customIconUrl?: string;
  visible?: boolean;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  placements?: string[];
  sortOrder?: number;
  desktopIconSize?: number;
  mobileIconSize?: number;
  openNewTab?: boolean;
}

export interface SocialMediaRendererProps {
  placement?: SocialPlacement;
  variant?: "official" | "monochrome" | "circular" | "outline";
  size?: "sm" | "md" | "lg" | number;
  gap?: number;
  align?: "left" | "center" | "right";
  showLabels?: boolean;
  className?: string;
  style?: React.CSSProperties;
  color?: string; // override icon color for monochrome
  hoverColor?: string;
  initialLinks?: SocialLinkItem[];
}

export default function SocialMediaRenderer({
  placement = "all",
  variant = "official",
  size = "md",
  gap = 12,
  align = "left",
  showLabels = false,
  className = "",
  style,
  color,
  hoverColor,
  initialLinks,
}: SocialMediaRendererProps) {
  const [links, setLinks] = useState<SocialLinkItem[]>(initialLinks || []);
  const [loading, setLoading] = useState(!initialLinks || initialLinks.length === 0);

  useEffect(() => {
    let active = true;
    const url = `/api/social-links?placement=${encodeURIComponent(placement)}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : { links: [] }))
      .then((data) => {
        if (active && Array.isArray(data.links)) {
          setLinks(data.links);
        }
      })
      .catch(() => {
        // Quiet fallback
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [placement]);

  if (!loading && links.length === 0) {
    return null;
  }

  // Base sizing map
  const numericSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 16
      : size === "lg"
      ? 24
      : 20;

  const justifyContent =
    align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  return (
    <nav
      aria-label={`Queens Care Social Media Channels (${placement})`}
      className={`qc-social-renderer ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent,
        gap: `${gap}px`,
        ...style,
      }}
    >
      {links.map((item) => {
        const platformDef = PLATFORM_REGISTRY[item.platform.toLowerCase()] || PLATFORM_REGISTRY.custom;
        const finalVariant = item.iconVariant || variant;
        const brandColor = platformDef?.brandColor || "#2A0F3A";
        const iconColor = color || (finalVariant === "monochrome" ? "currentColor" : brandColor);
        const itemDesktopSize = item.desktopIconSize || numericSize;

        // Circular background styling if chosen
        const isCircular = finalVariant === "circular";
        const isOutline = finalVariant === "outline";

        return (
          <a
            key={item.id}
            href={item.url}
            target={item.openNewTab !== false ? "_blank" : "_self"}
            rel="noopener noreferrer"
            title={item.tooltip || `${item.label} — Queens Care Laboratories`}
            aria-label={`${item.label} (opens in ${item.openNewTab !== false ? "new tab" : "same window"})`}
            className={`qc-social-link qc-social-${item.platform} ${
              item.desktopVisible === false ? "qc-desktop-hide" : ""
            } ${item.mobileVisible === false ? "qc-mobile-hide" : ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              textDecoration: "none",
              color: color || "inherit",
              padding: isCircular || isOutline ? "6px" : "4px",
              borderRadius: isCircular || isOutline ? "50%" : "6px",
              background: isCircular ? (color ? "rgba(255,255,255,0.12)" : "rgba(42, 15, 58, 0.06)") : "transparent",
              border: isOutline ? `1px solid ${color || "#EAE6DF"}` : "none",
              transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.06)";
              if (hoverColor) e.currentTarget.style.color = hoverColor;
              else if (finalVariant === "monochrome") e.currentTarget.style.opacity = "0.75";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.color = color || "inherit";
              e.currentTarget.style.opacity = "1";
            }}
          >
            {item.customIconUrl ? (
              <img
                src={item.customIconUrl}
                alt={item.label}
                style={{
                  width: `${itemDesktopSize}px`,
                  height: `${itemDesktopSize}px`,
                  objectFit: "contain",
                }}
              />
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: `${itemDesktopSize}px`,
                  height: `${itemDesktopSize}px`,
                }}
              >
                <SocialBrandIcon
                  platform={item.platform}
                  size={itemDesktopSize}
                  color={iconColor}
                  className="qc-social-icon-svg"
                />
              </span>
            )}

            {showLabels && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  color: "inherit",
                }}
              >
                {item.label}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
