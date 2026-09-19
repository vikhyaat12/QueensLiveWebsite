"use client";
import React, { useState } from "react";

export type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  productName?: string;
  variantId?: string;
  variantName?: string;
  sku?: string;
  unitPrice?: number;
  className?: string;
  style?: React.CSSProperties;
  customLabel?: string;
  onSuccess?: () => void;
};

export default function AddToCartButton({
  productId,
  quantity = 1,
  productName,
  variantId,
  variantName,
  sku,
  unitPrice,
  className,
  style,
  customLabel,
  onSuccess,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const m = await import("@/lib/client-cart");
      m.addToCart({ productId, quantity, variantId, variantName, sku, unitPrice });
      setAdded(true);
      onSuccess?.();
      // Analytics: add to cart
      try {
        ((window as unknown) as Record<string, (...args: unknown[]) => void>).__qc_track_add_to_cart?.(
          productId,
          productName || productId
        );
      } catch {}
    } catch {
      // Fallback silent
    } finally {
      setLoading(false);
      setTimeout(() => setAdded(false), 2400);
    }
  };

  return (
    <button
      type="button"
      className={className || "qc-btn-add-bag"}
      style={style}
      onClick={handle}
      disabled={loading}
      aria-label={`Add ${productName || "product"} to care bag`}
    >
      {loading ? (
        <span>Adding…</span>
      ) : added ? (
        <span style={{ color: "#2e7d32", display: "inline-flex", alignItems: "center", gap: 6 }}>
          ✓ Added to Bag
        </span>
      ) : (
        <span>{customLabel || "Add to Bag"}</span>
      )}
    </button>
  );
}
