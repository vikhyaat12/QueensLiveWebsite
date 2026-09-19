"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

export type RangeProductItem = {
  id: string;
  slug: string;
  name: string;
  category?: string;
  subtitle?: string;
  image: string;
  price: number;
  mrp?: number;
  benefits?: string[];
  stock?: number;
};

export default function ProductRangeCarousel({
  products = [],
  currentSlug,
  title = "Our Clinical Range",
  subtitle = "Explore the complete Queens Care Laboratories therapeutic collection",
}: {
  products: RangeProductItem[];
  currentSlug?: string;
  title?: string;
  subtitle?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section
      style={{
        marginTop: 64,
        marginBottom: 48,
        padding: "48px 0",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        background: "linear-gradient(180deg, rgba(250, 248, 245, 0.6) 0%, rgba(245, 240, 232, 0.4) 100%)",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Header with Navigation Arrows */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".15em",
                textTransform: "uppercase",
                color: "#D4AF37",
                display: "block",
                marginBottom: 6,
              }}
            >
              ✦ Queens Care Formulations
            </span>
            <h2
              style={{
                fontSize: 28,
                fontFamily: "var(--font-display)",
                color: "#2A0F3A",
                margin: 0,
                fontWeight: 600,
              }}
            >
              {title}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>{subtitle}</p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", marginRight: 6 }}>Drag or scroll</span>
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: canScrollLeft ? "#fff" : "#f0ede8",
                color: canScrollLeft ? "#2A0F3A" : "#bbb",
                fontSize: 18,
                cursor: canScrollLeft ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              aria-label="Previous products"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: canScrollRight ? "#fff" : "#f0ede8",
                color: canScrollRight ? "#2A0F3A" : "#bbb",
                fontSize: 18,
                cursor: canScrollRight ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              aria-label="Next products"
            >
              →
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Carousel Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            paddingBottom: 16,
            paddingTop: 8,
          }}
        >
          {products.map((item) => {
            const isCurrent = item.slug === currentSlug;
            const discountPercent = item.mrp && item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
            return (
              <div
                key={item.id || item.slug}
                style={{
                  flex: "0 0 280px",
                  scrollSnapAlign: "start",
                  background: "#ffffff",
                  border: isCurrent ? "2px solid #D4AF37" : "1px solid var(--line)",
                  borderRadius: 8,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isCurrent ? "0 8px 24px rgba(212, 175, 55, 0.15)" : "0 4px 16px rgba(0,0,0,0.03)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  position: "relative",
                }}
              >
                {isCurrent ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "#2A0F3A",
                      color: "#D4AF37",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 4,
                      zIndex: 2,
                    }}
                  >
                    Viewing Now
                  </span>
                ) : discountPercent > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "#FEE2E2",
                      color: "#991B1B",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: ".04em",
                      padding: "2px 8px",
                      borderRadius: 4,
                      zIndex: 2,
                    }}
                  >
                    -{discountPercent}% OFF
                  </span>
                ) : null}

                <Link
                  href={`/products/${item.slug}`}
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "linear-gradient(180deg, #FAF8F5 0%, #F5EFE6 100%)",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        padding: 10,
                        transition: "transform 0.3s ease",
                      }}
                      loading="lazy"
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    {item.category && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#D4AF37",
                          textTransform: "uppercase",
                          letterSpacing: ".08em",
                        }}
                      >
                        {item.category}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "#D4AF37", fontWeight: 700 }}>
                      ★ 4.9
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 16,
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      color: "#2A0F3A",
                      margin: "2px 0 6px",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </h3>

                  {item.subtitle && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        margin: "0 0 10px",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.subtitle}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#2A0F3A" }}>
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                    {item.mrp && item.mrp > item.price && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          textDecoration: "line-through",
                        }}
                      >
                        ₹{item.mrp.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </Link>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Link
                    href={`/products/${item.slug}`}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 12px",
                      background: "#FAF8F5",
                      color: "#2A0F3A",
                      border: "1px solid var(--line)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    View Details
                  </Link>
                  <div style={{ flex: 1 }}>
                    <AddToCartButton productId={item.slug} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
