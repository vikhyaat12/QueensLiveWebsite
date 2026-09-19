"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export type BrandLogoProps = {
  inverse?: boolean;
  className?: string;
  showText?: boolean;
  overrideUrl?: string;
  overrideHeight?: string | number;
  overrideMobileHeight?: string | number;
  overrideMaxWidth?: string | number;
};

export default function BrandLogo({
  inverse = false,
  className = "",
  showText = true,
  overrideUrl,
  overrideHeight,
  overrideMobileHeight,
  overrideMaxWidth,
}: BrandLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>(overrideUrl || "");
  const [desktopHeight, setDesktopHeight] = useState<string>(
    overrideHeight ? (typeof overrideHeight === "number" ? `${overrideHeight}px` : overrideHeight) : "36px"
  );
  const [mobileHeight, setMobileHeight] = useState<string>(
    overrideMobileHeight ? (typeof overrideMobileHeight === "number" ? `${overrideMobileHeight}px` : overrideMobileHeight) : "28px"
  );
  const [maxWidth, setMaxWidth] = useState<string>(
    overrideMaxWidth ? (typeof overrideMaxWidth === "number" ? `${overrideMaxWidth}px` : overrideMaxWidth) : "180px"
  );
  const [imgFailed, setImgFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (overrideUrl !== undefined) {
      setLogoUrl(overrideUrl);
      setImgFailed(false);
      return;
    }

    let isMounted = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!isMounted) return;
        const settings = d.settings || [];
        const logo = settings.find((s: { key: string }) => s.key === "logo_url");
        if (logo?.value) {
          setLogoUrl(String(logo.value));
          setImgFailed(false);
        }

        const dh = settings.find((s: { key: string }) => s.key === "logo_height_desktop");
        if (dh?.value) {
          setDesktopHeight(`${dh.value}px`);
        }

        const mh = settings.find((s: { key: string }) => s.key === "logo_height_mobile");
        if (mh?.value) {
          setMobileHeight(`${mh.value}px`);
        }

        const mw = settings.find((s: { key: string }) => s.key === "logo_max_width");
        if (mw?.value) {
          setMaxWidth(`${mw.value}px`);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [overrideUrl]);

  const effectiveUrl = inverse && logoUrl.includes("purple")
    ? "/uploads/logos/queens-care-horizontal-white.png"
    : logoUrl;

  const isFullLockup = Boolean(effectiveUrl && (effectiveUrl.includes("horizontal") || effectiveUrl.includes("official") || effectiveUrl.includes("logo")));

  return (
    <Link
      href="/"
      className={`brand ${inverse ? "inverse" : ""} ${className}`}
      aria-label="Queens Care Laboratories home"
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}
    >
      {effectiveUrl && !imgFailed ? (
        <img
          src={effectiveUrl}
          alt="Queens Care Laboratories"
          className="brand-logo-img"
          style={{
            height: desktopHeight,
            maxWidth: maxWidth,
            width: "auto",
            objectFit: "contain",
            display: "inline-block",
            verticalAlign: "middle",
            background: "transparent",
          }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            console.warn("Brand logo failed to load from:", effectiveUrl);
            setImgFailed(true);
          }}
        />
      ) : (
        <i aria-hidden="true" style={{ fontStyle: "italic" }}>
          Q
        </i>
      )}

      {showText && !isFullLockup && (
        <span style={{ lineHeight: 1.05 }}>
          QUEENS
          <br />
          <b>CARE</b>
        </span>
      )}
    </Link>
  );
}
