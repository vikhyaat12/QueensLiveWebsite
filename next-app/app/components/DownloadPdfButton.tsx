"use client";

import React from "react";

interface Props {
  slug: string;
  name: string;
}

export default function DownloadPdfButton({ slug, name }: Props) {
  const handleClick = () => {
    try {
      // @ts-expect-error - global tracking function
      if (window.__qc_track_pdf_download) {
        // @ts-expect-error - global tracking function
        window.__qc_track_pdf_download(slug, name);
      }
    } catch {}
  };

  return (
    <a
      href={`/api/products/${slug}/pdf`}
      download
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "12px 24px",
        background: "transparent",
        color: "#2A0F3A",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: ".04em",
        textTransform: "uppercase" as const,
        textDecoration: "none",
        borderRadius: 4,
        border: "2px solid #2A0F3A",
        transition: "all 0.15s ease",
      }}
    >
      📄 Download Product PDF
    </a>
  );
}
