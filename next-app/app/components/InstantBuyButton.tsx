"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/client-cart";

/* InstantBuyButton — shortest safe purchase path: adds the product to the
   care bag, then goes straight to checkout. Inventory, pricing, coupons,
   payment and order creation remain fully server-validated at checkout. */
export type InstantBuyButtonProps = {
  productId: string;
  quantity?: number;
  variantId?: string;
  variantName?: string;
  sku?: string;
  unitPrice?: number;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function InstantBuyButton({
  productId,
  quantity = 1,
  variantId,
  variantName,
  sku,
  unitPrice,
  label = "Instant Buy Now",
  className,
  style,
}: InstantBuyButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      addToCart({ productId, quantity, variantId, variantName, sku, unitPrice });
      router.push("/checkout");
    } catch {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className={className || "qc-btn-instant-buy"}
      style={style}
      aria-label={`${label} for ${productId}`}
    >
      {busy ? "Preparing checkout…" : `${label} →`}
    </button>
  );
}
