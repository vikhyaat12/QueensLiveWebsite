"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { parseMediaInfo } from "./GlobalMediaUploader";

export type GalleryImage = { id: string; url: string; alt?: string };
export type GalleryVideo = { id?: string; url: string; title?: string; posterUrl?: string };

type GalleryMediaItem = {
  id: string;
  url: string;
  type: "image" | "video" | "youtube" | "vimeo" | "gif";
  title?: string;
  alt?: string;
  posterUrl?: string;
  embedUrl?: string;
};

/**
 * Premium product media system.
 * Media set is 100% Admin-driven: every uploaded image and video renders in
 * Admin order — no hardcoded slots, no placeholder media, no 3D model.
 */
export default function ProductGallery({
  mainImage,
  productName,
  images = [],
  videos = [],
}: {
  mainImage: string;
  productName: string;
  images?: GalleryImage[];
  videos?: GalleryVideo[];
}) {
  const mediaItems: GalleryMediaItem[] = useMemo(() => {
    const items: GalleryMediaItem[] = [];
    const seen = new Set<string>();
    const push = (item: GalleryMediaItem) => {
      if (!item.url || seen.has(item.url)) return;
      seen.add(item.url);
      items.push(item);
    };

    push({
      id: "main-img",
      url: mainImage,
      type: parseMediaInfo(mainImage).type === "video" ? "video" : "image",
      alt: productName,
    });
    images.forEach((img, i) => {
      const parsed = parseMediaInfo(img.url);
      push({
        id: img.id || `img-${i}`,
        url: img.url,
        type: parsed.type === "video" ? "video" : parsed.type === "gif" ? "gif" : "image",
        alt: img.alt || `${productName} — view ${i + 2}`,
      });
    });
    videos.forEach((vid, i) => {
      const parsed = parseMediaInfo(vid.url);
      const isEmbed = parsed.type === "youtube" || parsed.type === "vimeo";
      push({
        id: vid.id || `vid-${i}`,
        url: vid.url,
        type: isEmbed ? parsed.type : "video",
        title: vid.title || `${productName} — product video`,
        posterUrl: vid.posterUrl || parsed.posterUrl,
        embedUrl: parsed.embedUrl,
      });
    });
    return items;
  }, [mainImage, productName, images, videos]);

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (active > mediaItems.length - 1) setActive(0);
  }, [mediaItems.length, active]);

  const current = mediaItems[active] || mediaItems[0];
  const isCurrentVideo = current?.type === "video" || current?.type === "youtube" || current?.type === "vimeo";
  const parsedCurrent = current ? parseMediaInfo(current.url) : null;

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

  if (!current) return null;

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCurrentVideo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const renderStageMedia = (context: "stage" | "lightbox") => {
    if (isCurrentVideo) {
      if (current.type === "youtube" || current.type === "vimeo") {
        return (
          <iframe
            src={parsedCurrent?.embedUrl}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              ...(context === "lightbox" ? { minHeight: 420 } : {}),
            }}
            title={current.title || productName}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        );
      }
      return (
         
        <video
          key={current.id}
          src={current.url}
          poster={current.posterUrl || parsedCurrent?.posterUrl}
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#0E0716" }}
        />
      );
    }
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        key={current.id}
        src={current.url}
        alt={current.alt || productName}
        fetchPriority={context === "stage" && active === 0 ? "high" : undefined}
        loading={context === "stage" && active === 0 ? "eager" : "lazy"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transform: context === "stage" && zoom ? "scale(2.2)" : "scale(1)",
          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          transition: "transform 0.18s ease-out",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    );
  };

  return (
    <div className="qc-pdp-gallery" role="region" aria-label={`${productName} media gallery`}>
      <div className="qc-pdp-gallery-layout">
        {/* Vertical thumbnail rail (desktop) / horizontal strip (mobile via CSS) */}
        {mediaItems.length > 1 && (
          <div className="qc-pdp-thumbs" role="tablist" aria-label="Product media thumbnails">
            {mediaItems.map((item, i) => {
              const isItemVid = item.type === "video" || item.type === "youtube" || item.type === "vimeo";
              const itemParsed = parseMediaInfo(item.url);
              const thumbSrc = (!isItemVid && item.url) || item.posterUrl || itemParsed.posterUrl || item.url;
              return (
                <button
                  key={item.id || i}
                  type="button"
                  role="tab"
                  aria-selected={active === i}
                  aria-label={isItemVid ? item.title || "Product video" : item.alt || `View ${i + 1}`}
                  className={`qc-pdp-thumb${active === i ? " is-active" : ""}`}
                  onClick={() => {
                    setActive(i);
                    setZoom(false);
                  }}
                >
                  {thumbSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={thumbSrc} alt="" loading="lazy" />
                  ) : (
                    <span className="qc-pdp-thumb-fallback" aria-hidden="true">▶</span>
                  )}
                  {isItemVid && (
                    <span className="qc-pdp-thumb-play" aria-hidden="true">▶</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Media stage */}
        <div className="qc-pdp-stage-wrap">
          <div
            className={`qc-pdp-stage${zoom ? " is-zoomed" : ""}${isCurrentVideo ? " is-video" : ""}`}
            onMouseMove={handleStageMouseMove}
            onMouseLeave={() => setZoom(false)}
            onClick={() => {
              if (!isCurrentVideo) setZoom((z) => !z);
            }}
          >
            {/* Authenticity chips */}
            <div className="qc-pdp-stage-chips" aria-hidden="true">
              <span>✓ Batch-Tested</span>
              <span className="gold">✦ Queens Care Original</span>
            </div>

            {renderStageMedia("stage")}

            {!isCurrentVideo && mediaItems.length > 1 && (
              <>
                <button
                  type="button"
                  className="qc-pdp-stage-arrow left"
                  aria-label="Previous media"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevMedia();
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="qc-pdp-stage-arrow right"
                  aria-label="Next media"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextMedia();
                  }}
                >
                  ›
                </button>
              </>
            )}

            {!isCurrentVideo && !zoom && (
              <div className="qc-pdp-zoom-hint" aria-hidden="true">
                <span>🔍</span> Hover to zoom · Click to magnify
              </div>
            )}
            {!isCurrentVideo && (
              <button
                type="button"
                className="qc-pdp-fullscreen-btn"
                aria-label="Open fullscreen view"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxOpen(true);
                }}
              >
                ⛶ Fullscreen
              </button>
            )}
          </div>

          {mediaItems.length > 1 && (
            <div className="qc-pdp-stage-caption" aria-live="polite">
              <span>
                {isCurrentVideo ? "Product Video" : "Product Image"} · {active + 1} of {mediaItems.length}
              </span>
              <span className="qc-pdp-stage-caption-title">{current.title || current.alt || productName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {lightboxOpen && (
        <div
          className="qc-pdp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} fullscreen media`}
          onClick={() => setLightboxOpen(false)}
        >
          <div className="qc-pdp-lightbox-head" onClick={(e) => e.stopPropagation()}>
            <div>
              <h4>{productName}</h4>
              <p>
                {active + 1} of {mediaItems.length}
              </p>
            </div>
            <button type="button" aria-label="Close fullscreen" onClick={() => setLightboxOpen(false)}>
              ✕
            </button>
          </div>
          <div className="qc-pdp-lightbox-body" onClick={(e) => e.stopPropagation()}>
            {renderStageMedia("lightbox")}
          </div>
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                className="qc-pdp-lightbox-arrow left"
                aria-label="Previous media"
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="qc-pdp-lightbox-arrow right"
                aria-label="Next media"
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
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
