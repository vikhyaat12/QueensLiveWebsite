"use client";

import React, { useState } from "react";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

export type ProductCardProps = {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp?: number;
  discount?: number;
  image: string;
  category?: string;
  stock?: number;
  rating?: number;
  reviewsCount?: number;
  benefits?: string[];
  bestSeller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
  note?: string;
};

export default function ProductCard({
  slug,
  name,
  price,
  mrp,
  discount,
  image,
  category = "Pharmaceutical",
  stock = 10,
  rating = 4.9,
  reviewsCount = 18,
  bestSeller,
  newArrival,
  featured,
  note,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);

  const discountPercent =
    mrp && mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : discount || 0;

  const isOos = stock <= 0;

  const badgeText = bestSeller
    ? "Best Seller"
    : newArrival
    ? "New Formula"
    : featured
    ? "Clinical Choice"
    : null;

  const badgeClass = bestSeller
    ? "qc-badge-bestseller"
    : newArrival
    ? "qc-badge-new"
    : "qc-badge-clinical";

  return (
    <div className="qc-card">
      {/* Badge */}
      {badgeText && (
        <span className={`qc-badge-pill ${badgeClass}`}>
          {badgeText}
        </span>
      )}

      {/* Wishlist Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setWishlisted(!wishlisted);
        }}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          background: "rgba(255, 255, 255, 0.9)",
          border: "1px solid rgba(42, 15, 58, 0.1)",
          borderRadius: "50%",
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          cursor: "pointer",
          color: wishlisted ? "#C62828" : "#64748B",
          transition: "all 0.15s ease",
        }}
      >
        {wishlisted ? "♥" : "♡"}
      </button>

      {/* Product Image Link */}
      <Link href={`/products/${slug}`} className="qc-card-img-wrap" tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || "/images/reference/hero-immune-bottle.png"}
          alt={name}
          loading="lazy"
        />
      </Link>

      {/* Content */}
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A6A45" }}>
              {category}
            </span>
            {rating > 0 && (
              <span style={{ fontSize: 11.5, color: "#D4AF37", fontWeight: 700 }}>
                ★ {rating.toFixed(1)} {reviewsCount ? `(${reviewsCount})` : ""}
              </span>
            )}
          </div>

          <Link href={`/products/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
            <h3
              style={{
                fontSize: 16.5,
                fontWeight: 700,
                color: "#2A0F3A",
                margin: "0 0 6px",
                lineHeight: 1.3,
              }}
            >
              {name}
            </h3>
          </Link>

          {note && (
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {note}
            </p>
          )}
        </div>

        <div>
          {/* Price Row */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#2A0F3A" }}>
              ₹{price.toLocaleString("en-IN")}
            </span>
            {mrp && mrp > price && (
              <span style={{ fontSize: 13, textDecoration: "line-through", color: "#94A3B8" }}>
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}
            {discountPercent > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", background: "#E8F5E9", padding: "1px 6px", borderRadius: 3 }}>
                SAVE {discountPercent}%
              </span>
            )}
          </div>

          {/* Action Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {isOos ? (
              <button
                type="button"
                disabled
                style={{
                  height: 40,
                  background: "#F1F5F9",
                  color: "#94A3B8",
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "not-allowed",
                }}
              >
                Out of Stock
              </button>
            ) : (
              <AddToCartButton
                productId={slug}
                productName={name}
                customLabel="Add to Care Bag"
                style={{ height: 40, fontSize: 12.5, width: "100%", justifyContent: "center" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
