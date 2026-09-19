"use client";

import React from "react";

export {
  type PlatformCategory,
  type PlatformDefinition,
  PLATFORM_REGISTRY,
} from "@/lib/commerce/social-registry";
import { PLATFORM_REGISTRY } from "@/lib/commerce/social-registry";


function CustomIconWithFallback({ url, platform, size, className }: { url: string; platform: string; size: number; className?: string }) {
  const [failed, setFailed] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  if (failed) {
    // Fallback: render the SVG from registry
    const def = PLATFORM_REGISTRY[platform.toLowerCase()] || PLATFORM_REGISTRY.custom;
    if (typeof def.svgPath === "string") {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={def.brandColor} xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: "block" }}>
          <path d={def.svgPath} />
        </svg>
      );
    }
    return <span className={className} style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, color: def.brandColor, fontWeight: 700 }}>{platform.charAt(0).toUpperCase()}</span>;
  }

  return (
    <img
      src={url}
      alt={platform}
      className={className}
      style={{ width: size, height: size, objectFit: "contain", display: "block", borderRadius: 4 }}
      onError={() => {
        if (retryCount < 1) {
          setTimeout(() => { setRetryCount(c => c + 1); }, 1500);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

export function SocialBrandIcon({
  platform,
  size = 22,
  color,
  customIconUrl,
  className,
}: {
  platform: string;
  size?: number;
  color?: string;
  customIconUrl?: string;
  className?: string;
}) {
  if (customIconUrl) {
    return <CustomIconWithFallback url={customIconUrl} platform={platform} size={size} className={className} />;
  }

  const def = PLATFORM_REGISTRY[platform.toLowerCase()] || PLATFORM_REGISTRY.custom;
  const fillColor = color || def.brandColor;

  if (typeof def.svgPath === "string") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fillColor}
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: "block" }}
      >
        <path d={def.svgPath} />
      </svg>
    );
  }

  return <span className={className}>{def.svgPath}</span>;
}
