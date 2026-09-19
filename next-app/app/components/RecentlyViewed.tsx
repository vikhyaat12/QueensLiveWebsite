"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type ViewedProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  category?: string;
};

const STORAGE_KEY = "qc_recently_viewed_v1";

export function recordRecentlyViewed(product: ViewedProduct) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: ViewedProduct[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((p) => p.slug !== product.slug);
    filtered.unshift(product);
    // Keep max 8 recent items
    const trimmed = filtered.slice(0, 8);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fallback
  }
}

export default function RecentlyViewed({ currentSlug }: { currentSlug?: string }) {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: ViewedProduct[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          // Exclude the product currently being viewed
          const filtered = list.filter((p) => p.slug !== currentSlug);
          queueMicrotask(() => setItems(filtered));
        }
      }
    } catch {
      queueMicrotask(() => setItems([]));
    }
  }, [currentSlug]);

  if (items.length === 0) return null;

  return (
    <section style={{ marginTop: 48, paddingTop: 36, borderTop: "1px solid rgba(42, 15, 58, 0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--purple)" }}>
            Your Session History
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "var(--foreground)", margin: "4px 0 0" }}>
            Recently Viewed Formulations
          </h3>
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {items.length} formulation{items.length !== 1 ? "s" : ""} viewed
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((item) => {
          const discount =
            item.mrp && item.mrp > item.price
              ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
              : 0;

          return (
            <Link
              key={item.slug}
              href={`/products/${item.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                background: "#fff",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1/1",
                  position: "relative",
                  background: "#FBF9F6",
                  borderRadius: 6,
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 220px"
                    style={{ objectFit: "contain", padding: 10 }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 24 }}>
                    💊
                  </div>
                )}
                {discount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      background: "#E8F5E9",
                      color: "#166534",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 3,
                    }}
                  >
                    {discount}% OFF
                  </span>
                )}
              </div>

              {item.category && (
                <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>
                  {item.category}
                </span>
              )}
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  margin: "4px 0 8px",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {item.name}
              </h4>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--purple)" }}>
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
                {item.mrp && item.mrp > item.price && (
                  <span style={{ fontSize: 11, color: "#94A3B8", textDecoration: "line-through" }}>
                    ₹{item.mrp.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
