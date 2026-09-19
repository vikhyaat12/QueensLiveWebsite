"use client";

import React, { useState, useEffect, useCallback } from "react";
import { parseMediaInfo } from "./GlobalMediaUploader";
import Product3DViewer from "./Product3DViewer";
import Hero3DProductVisual from "./Hero3DProductVisual";

export type GalleryImage = { id: string; url: string; alt?: string };
export type GalleryVideo = { id?: string; url: string; title?: string; posterUrl?: string };

type GalleryMediaItem = {
  id: string;
  url: string;
  type: "image" | "video" | "youtube" | "vimeo" | "gif" | "3d";
  title?: string;
  alt?: string;
  posterUrl?: string;
  embedUrl?: string;
};

export default function ProductGallery({
  mainImage,
  productName,
  images = [],
  videos = [],
  enable3D = true,
  model3dPoster,
  modelUrl,
}: {
  mainImage: string;
  productName: string;
  images?: GalleryImage[];
  videos?: GalleryVideo[];
  enable3D?: boolean;
  model3dPoster?: string;
  modelUrl?: string;
}) {
  // Combine main image + up to 10 images + videos + optional 3D tab
  const mediaItems: GalleryMediaItem[] = [
    {
      id: "main-img",
      url: mainImage,
      type: parseMediaInfo(mainImage).type,
      alt: productName,
    },
    ...images.slice(0, 10).map((img, i) => {
      const parsed = parseMediaInfo(img.url);
      return {
        id: img.id || `img-${i}`,
        url: img.url,
        type: parsed.type,
        alt: img.alt || `${productName} presentation photo ${i + 1}`,
      };
    }),
    ...videos.map((vid, i) => {
      const parsed = parseMediaInfo(vid.url);
      return {
        id: vid.id || `vid-${i}`,
        url: vid.url,
        type: parsed.type,
        title: vid.title || `${productName} clinical video ${i + 1}`,
        posterUrl: vid.posterUrl || parsed.posterUrl,
        embedUrl: parsed.embedUrl,
      };
    }),
    ...(enable3D
      ? [
          {
            id: "3d-view",
            url: "#3d",
            type: "3d" as const,
            title: "360° Interactive 3D Model",
            alt: `${productName} 3D View`,
            posterUrl: model3dPoster || mainImage,
          },
        ]
      : []),
  ].filter((item) => Boolean(item.url));

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const current = mediaItems[active] || mediaItems[0] || {
    id: "empty",
    url: mainImage,
    type: "image" as const,
    alt: productName,
  };

  const isCurrentVideo = current.type === "video" || current.type === "youtube" || current.type === "vimeo";
  const isCurrent3D = current.type === "3d";
  const parsedCurrent = parseMediaInfo(current.url);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCurrentVideo || isCurrent3D) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const nextMedia = useCallback(() => {
    setActive((prev) => (prev + 1) % mediaItems.length);
  }, [mediaItems.length]);

  const prevMedia = useCallback(() => {
    setActive((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === "Escape") setLightboxOpen(false);
        if (e.key === "ArrowRight") nextMedia();
        if (e.key === "ArrowLeft") prevMedia();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextMedia, prevMedia]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Media Mode Pill Selector */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            setActive(0);
            setZoom(false);
          }}
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: !isCurrent3D && !isCurrentVideo ? "var(--purple)" : "#f3efe8",
            color: !isCurrent3D && !isCurrentVideo ? "#fff" : "var(--ink)",
            border: "1px solid var(--line)",
            transition: "all 0.15s ease",
          }}
        >
          📷 Gallery ({images.length + 1})
        </button>

        {videos.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const firstVidIndex = mediaItems.findIndex(
                (m) => m.type === "video" || m.type === "youtube" || m.type === "vimeo"
              );
              if (firstVidIndex >= 0) {
                setActive(firstVidIndex);
                setZoom(false);
              }
            }}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              background: isCurrentVideo ? "var(--purple)" : "#f3efe8",
              color: isCurrentVideo ? "#fff" : "var(--ink)",
              border: "1px solid var(--line)",
              transition: "all 0.15s ease",
            }}
          >
            🎬 Clinical Videos ({videos.length})
          </button>
        )}

        {enable3D && (
          <button
            type="button"
            onClick={() => {
              const index3D = mediaItems.findIndex((m) => m.type === "3d");
              if (index3D >= 0) {
                setActive(index3D);
                setZoom(false);
              }
            }}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              background: isCurrent3D ? "linear-gradient(135deg, #2A0F3A, #4a154b)" : "#f3efe8",
              color: isCurrent3D ? "#D4AF37" : "var(--ink)",
              border: isCurrent3D ? "1px solid #D4AF37" : "1px solid var(--line)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>✨ 3D Interactive Model</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          style={{
            marginLeft: "auto",
            padding: "4px 10px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            background: "transparent",
            color: "var(--muted)",
            border: "1px solid var(--line)",
            cursor: "pointer",
          }}
          title="Open Fullscreen Lightbox"
        >
          ⛶ Fullscreen
        </button>
      </div>

      {/* Main Viewport & Thumbnails Grid */}
      <div
        className="qc-gallery-container"
        style={{
          display: "grid",
          gridTemplateColumns: mediaItems.length > 1 ? "80px 1fr" : "1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* Thumbnails Column (Left Side) */}
        {mediaItems.length > 1 && (
          <div
            className="qc-gallery-thumbs"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 520,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {mediaItems.map((item, i) => {
              const isItemVid = item.type === "video" || item.type === "youtube" || item.type === "vimeo";
              const isItem3D = item.type === "3d";
              const itemParsed = parseMediaInfo(item.url);
              const thumbSrc = item.posterUrl || (isItemVid ? itemParsed.posterUrl : item.url) || item.url;

              return (
                <button
                  key={item.id || i}
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setZoom(false);
                  }}
                  style={{
                    position: "relative",
                    width: 74,
                    height: 74,
                    padding: 0,
                    border: active === i ? "2px solid #2A0F3A" : "1px solid var(--line)",
                    background: "#fbf9f6",
                    borderRadius: 4,
                    cursor: "pointer",
                    opacity: active === i ? 1 : 0.72,
                    outline: active === i ? "1.5px solid #D4AF37" : "none",
                    overflow: "hidden",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                  title={item.title || item.alt || `Media ${i + 1}`}
                >
                  {isItem3D ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, #2A0F3A, #190924)",
                        color: "#D4AF37",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>🔄</span>
                      <span>3D</span>
                    </div>
                  ) : thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt={item.alt || ""}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      🎬
                    </div>
                  )}

                  {/* Video Badge on thumbnail */}
                  {isItemVid && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        background: "rgba(42, 15, 58, 0.9)",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      ▶
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Viewport */}
        <div className="qc-gallery-main" style={{ position: "relative", width: "100%" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
              minHeight: 460,
              maxHeight: 540,
              overflow: "hidden",
              borderRadius: 16,
              border: "1.5px solid rgba(226, 232, 240, 0.8)",
              background: "radial-gradient(circle at 50% 45%, #FFFFFF 0%, #FAF9F6 70%, #F5F0EB 100%)",
              cursor: isCurrentVideo || isCurrent3D ? "default" : zoom ? "zoom-out" : "zoom-in",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              if (zoom) setZoom(false);
            }}
            onClick={() => {
              if (!isCurrentVideo && !isCurrent3D) setZoom(!zoom);
            }}
          >
            {/* Clinical Trust Badges Watermark Overlay */}
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                pointerEvents: "none",
                zIndex: 3,
              }}
            >
              <span
                style={{
                  background: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(6px)",
                  color: "#1E1638",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ color: "#16A34A" }}>✓</span> Lab-Tested Batches
              </span>
              <span
                style={{
                  background: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(6px)",
                  color: "#1E1638",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ color: "#D4AF37" }}>✦</span> Queens Care Original
              </span>
            </div>

            {/* If 3D Viewer */}
            {isCurrent3D ? (
              modelUrl ? (
                <Product3DViewer productName={productName} modelUrl={modelUrl} posterUrl={current.posterUrl} height={520} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Hero3DProductVisual
                    productName={productName}
                    scale={1.0}
                    autoRotate={true}
                    rotationSpeed={1.0}
                    mouseInteraction={true}
                    lightingIntensity={1.6}
                    accentColor="#D4AF37"
                    bgEffect="studio"
                    customImageUrl=""
                    height={480}
                    showInfoPlate={true}
                  />
                </div>
              )
            ) : isCurrentVideo ? (
              /* If Video */
              current.type === "youtube" || current.type === "vimeo" ? (
                <iframe
                  src={parsedCurrent.embedUrl}
                  style={{ width: "100%", height: "100%", border: 0 }}
                  title={current.title || productName}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={current.url}
                  poster={current.posterUrl || parsedCurrent.posterUrl}
                  controls
                  autoPlay
                  style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                />
              )
            ) : (
              /* If Image: Render Image with Magnifier Zoom */
              <>
                <img
                  src={current.url}
                  alt={current.alt || productName}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: 500,
                    objectFit: "contain",
                    transform: zoom ? "scale(2.2)" : "scale(1)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: zoom ? "transform 0.08s ease-out" : "transform 0.25s ease-in-out",
                    pointerEvents: "none",
                  }}
                />
                {!zoom && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 14,
                      left: 14,
                      background: "rgba(255, 255, 255, 0.92)",
                      backdropFilter: "blur(6px)",
                      color: "#2A0F3A",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      border: "1px solid rgba(226, 232, 240, 0.9)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    <span>🔍</span>
                    <span>Click &amp; hover to inspect label</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Media Info Footer */}
          {mediaItems.length > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
                fontSize: 11,
                color: "var(--muted)",
              }}
            >
              <span>
                {isCurrent3D
                  ? "✨ 3D Model"
                  : isCurrentVideo
                  ? "🎬 Clinical Video"
                  : "🖼️ High-Res Image"}{" "}
                {active + 1} of {mediaItems.length}
              </span>
              <span>{current.title || current.alt || productName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(18, 6, 25, 0.95)",
            backdropFilter: "blur(12px)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Header Controls */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 24,
              right: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#fff",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: 16, color: "#D4AF37", fontFamily: "var(--font-display)" }}>
                {productName}
              </h4>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
                Item {active + 1} of {mediaItems.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Center Lightbox Content */}
          <div
            style={{
              position: "relative",
              maxWidth: "88vw",
              maxHeight: "80vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isCurrent3D ? (
              <div style={{ width: "75vw", maxWidth: 700 }}>
                <Product3DViewer productName={productName} height={500} />
              </div>
            ) : isCurrentVideo ? (
              current.type === "youtube" || current.type === "vimeo" ? (
                <iframe
                  src={parsedCurrent.embedUrl}
                  style={{ width: "75vw", maxWidth: 900, height: 500, border: 0 }}
                  title={current.title || productName}
                  allowFullScreen
                />
              ) : (
                <video
                  src={current.url}
                  poster={current.posterUrl || parsedCurrent.posterUrl}
                  controls
                  autoPlay
                  style={{ maxWidth: "85vw", maxHeight: "75vh", borderRadius: 8 }}
                />
              )
            ) : (
              <img
                src={current.url}
                alt={current.alt || productName}
                style={{
                  maxWidth: "85vw",
                  maxHeight: "75vh",
                  objectFit: "contain",
                  borderRadius: 6,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                }}
              />
            )}
          </div>

          {/* Navigation Arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
                style={{
                  position: "absolute",
                  left: 24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 50,
                  height: 50,
                  fontSize: 24,
                  cursor: "pointer",
                }}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
                style={{
                  position: "absolute",
                  right: 24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 50,
                  height: 50,
                  fontSize: 24,
                  cursor: "pointer",
                }}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
