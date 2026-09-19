"use client";

import React, { useEffect } from "react";

interface VideoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
}

export default function VideoLightboxModal({
  isOpen,
  onClose,
  videoUrl = "",
  title = "Queens Care Laboratories — Our Story",
}: VideoLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Transform standard video URLs to embeddable URLs
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get("v");
        return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0`;
      }
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      }
      if (url.includes("vimeo.com/")) {
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        return `https://player.vimeo.com/video/${id}?autoplay=1`;
      }
    } catch {
      // Return raw URL if parsing fails
    }
    return url;
  };

  const isDirectVideo = videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.endsWith(".ogg");
  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 10, 30, 0.88)",
        backdropFilter: "blur(12px)",
        padding: "20px",
        animation: "fadeIn 0.25s ease-out",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 920,
          background: "#1E1638",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(212, 175, 55, 0.35)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(139, 92, 246, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            background: "linear-gradient(90deg, #241442 0%, #17092C 100%)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(212, 175, 55, 0.15)",
                color: "#D4AF37",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              ▶
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.02em" }}>
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video modal"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              borderRadius: "50%",
              width: 34,
              height: 34,
              color: "#FFFFFF",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.8)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ×
          </button>
        </div>

        {/* Video Player Frame */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000000" }}>
          {isDirectVideo ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
