"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CartLine } from "@/lib/commerce/types";
import { getCartLines, subscribeCart, updateCartLine, removeFromCart } from "@/lib/client-cart";
import AddToCartButton from "@/app/components/AddToCartButton";
import QueensCareFooter from "@/app/components/QueensCareFooter";
import UniversalPromoRenderer from "@/app/components/promotions/UniversalPromoRenderer";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  category: string;
  stock: number;
  bestSeller?: boolean;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>(() => getCartLines());
  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState(false);
  const [freeThreshold, setFreeThreshold] = useState(999);
  const [standardFee, setStandardFee] = useState(99);
  const [serverPricing, setServerPricing] = useState<{
    subtotal: number;
    shippingCharge: number;
    taxTotal: number;
    grandTotal: number;
    discountTotal: number;
  } | null>(null);

  const fetchProducts = () =>
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => Array.isArray(d?.products) && setProducts(d.products))
      .catch(() => setProductError(true));

  const fetchRules = () =>
    fetch("/api/shipping/rules")
      .then((r) => r.json())
      .then((d) => {
        if (d?.freeShippingThreshold !== undefined) setFreeThreshold(Number(d.freeShippingThreshold));
        if (d?.standardShippingFee !== undefined) setStandardFee(Number(d.standardShippingFee));
      })
      .catch(() => {});

  useEffect(() => {
    setLines(getCartLines());
    fetchProducts();
    fetchRules();
    try {
      ((window as unknown) as Record<string, (...args: unknown[]) => void>).__qc_track_cart_view?.();
    } catch {}
    return subscribeCart((nextLines) => setLines(nextLines));
  }, []);

  // Sync with server pricing preview
  useEffect(() => {
    if (!lines.length) {
      setServerPricing(null);
      return;
    }
    const controller = new AbortController();
    fetch("/api/checkout/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines,
        shippingState: "Maharashtra",
        shippingMethod: "standard",
        paymentMethod: "prepaid",
      }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.breakdown) {
          setServerPricing({
            subtotal: d.breakdown.subtotal,
            shippingCharge: d.breakdown.shippingCharge,
            taxTotal: d.breakdown.taxTotal,
            grandTotal: d.breakdown.grandTotal,
            discountTotal: d.breakdown.discountTotal || 0,
          });
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [lines]);

  const items = useMemo(
    () =>
      lines
        .map((l) => {
          const p = products.find((x) => x.id === l.productId || x.slug === l.productId);
          return p ? { ...p, quantity: l.quantity } : null;
        })
        .filter(Boolean) as (Product & { quantity: number })[],
    [lines, products]
  );

  const bestSellers = useMemo(
    () => products.filter((p) => p.bestSeller || p.stock > 0).slice(0, 3),
    [products]
  );

  const fallbackSubtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const subtotal = serverPricing ? serverPricing.subtotal : fallbackSubtotal;
  const shippingFee = serverPricing
    ? serverPricing.shippingCharge
    : subtotal >= freeThreshold
    ? 0
    : items.length
    ? standardFee
    : 0;
  const grandTotal = serverPricing ? serverPricing.grandTotal : subtotal + shippingFee;
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  const amountNeededForFree = Math.max(0, freeThreshold - subtotal);

  const changeQty = (slug: string, qty: number) => {
    if (qty < 1) return;
    setLines(updateCartLine(slug, qty));
  };

  const remove = (slug: string) => setLines(removeFromCart(slug));

  return (
    <>
      <main className="cart-main" style={{ minHeight: "100vh", background: "#FAF8F5", padding: "0 5% 100px" }}>
      <header className="cart-header" style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42, 15, 58, 0.08)" }}>
        <Link href="/" aria-label="Queens Care Laboratories" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brand/queens-care-horizontal-purple.png"
            alt="Queens Care Laboratories"
            style={{ height: "40px", width: "auto", maxWidth: "200px", objectFit: "contain", display: "block" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/brand/queens-care-horizontal-gold.png";
            }}
          />
        </Link>
        <Link href="/shop" style={{ fontSize: 13, color: "#2A0F3A", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          ← Continue Shopping
        </Link>
      </header>

      <div style={{ maxWidth: 1200, margin: "36px auto 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#997B4D", margin: "0 0 4px" }}>
              Pharmaceutical Care Bag
            </p>
            <h1 style={{ font: "clamp(30px, 4vw, 44px) var(--font-display)", color: "#2A0F3A", margin: 0 }}>
              Review Your Prescription &amp; Essentials
            </h1>
          </div>
          {items.length > 0 && (
            <span style={{ fontSize: 14, color: "#64748B" }}>
              {count} {count === 1 ? "formulation" : "formulations"} selected
            </span>
          )}
        </div>

        {items.length > 0 ? (
          <div className="cart-grid">
            {/* Left Column: Cart Items & Free Shipping Progress */}
            <section>
              {/* Free Delivery Milestone Progress — Powered by Universal Merchandising Engine */}
              <div style={{ marginBottom: 24 }}>
                <UniversalPromoRenderer
                  slot="cart_top"
                  context={{ pageType: "cart", cartSubtotal: subtotal }}
                  fallback={
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(42, 15, 58, 0.1)",
                        borderRadius: 8,
                        padding: "16px 20px",
                        boxShadow: "0 2px 8px rgba(42, 15, 58, 0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600, color: "#2A0F3A" }}>
                        <span>
                          {progressPercent >= 100 ? (
                            <strong style={{ color: "#15803D" }}>🎉 Congratulations! You have unlocked FREE Express Delivery</strong>
                          ) : (
                            <>
                              Add <b>{inr(amountNeededForFree)}</b> more to qualify for <b>FREE Delivery</b>
                            </>
                          )}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748B" }}>{progressPercent}%</span>
                      </div>
                      <div className="qc-progress-track">
                        <div className="qc-progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>
                        Eligible for free temperature-monitored shipping across India above {inr(freeThreshold)}.
                      </span>
                    </div>
                  }
                />
              </div>

              {productError && (
                <div className="cart-notice" role="alert" style={{ marginBottom: 20 }}>
                  <p>We had trouble loading the latest catalog details. Please try again.</p>
                  <button onClick={fetchProducts}>Retry</button>
                </div>
              )}

              {/* Items List */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(42, 15, 58, 0.1)",
                  borderRadius: 8,
                  padding: "8px 24px",
                  boxShadow: "0 2px 8px rgba(42, 15, 58, 0.03)",
                }}
              >
                {items.map((it) => (
                  <div
                    key={it.slug}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "84px 1fr auto",
                      gap: 20,
                      padding: "20px 0",
                      borderBottom: "1px solid rgba(42, 15, 58, 0.08)",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      src={it.image || "/placeholder.png"}
                      alt={it.name}
                      width={84}
                      height={84}
                      style={{ objectFit: "contain", background: "#FAF8F5", borderRadius: 6, padding: 6, border: "1px solid rgba(42, 15, 58, 0.08)" }}
                    />
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#997B4D", display: "block", marginBottom: 2 }}>
                        {it.category}
                      </span>
                      <Link href={`/products/${it.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <b style={{ fontSize: 16, color: "#2A0F3A", display: "block", marginBottom: 6 }}>
                          {it.name}
                        </b>
                      </Link>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
                        <div className="qc-qty-control" style={{ height: 34 }}>
                          <button
                            type="button"
                            className="qc-qty-btn"
                            style={{ width: 30, fontSize: 14 }}
                            onClick={() => changeQty(it.slug, it.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="qc-qty-value" style={{ width: 28, fontSize: 13 }}>
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            className="qc-qty-btn"
                            style={{ width: 30, fontSize: 14 }}
                            onClick={() => changeQty(it.slug, it.quantity + 1)}
                            aria-label="Increase quantity"
                            disabled={it.quantity >= it.stock}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(it.slug)}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: 12,
                            color: "#DC2626",
                            cursor: "pointer",
                            fontWeight: 600,
                            padding: 0,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#2A0F3A", display: "block" }}>
                        {inr(it.price * it.quantity)}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>
                        {inr(it.price)} / unit
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Pillars */}
              <div
                className="cart-trust-pillars"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 14,
                  marginTop: 24,
                }}
              >
                <div className="qc-trust-pill">
                  <span>🛡️</span>
                  <div>
                    <b>Secure Checkout</b>
                    <span style={{ display: "block", fontSize: 10, color: "#64748B" }}>GST Invoice Included</span>
                  </div>
                </div>
                <div className="qc-trust-pill">
                  <span>❄️</span>
                  <div>
                    <b>Cold-Chain Shipping</b>
                    <span style={{ display: "block", fontSize: 10, color: "#64748B" }}>Monitored Delivery</span>
                  </div>
                </div>
                <div className="qc-trust-pill">
                  <span>🔒</span>
                  <div>
                    <b>Statutory GST Invoice</b>
                    <span style={{ display: "block", fontSize: 10, color: "#64748B" }}>100% Tax Compliant</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: Order Summary & Checkout */}
            <aside
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(42, 15, 58, 0.12)",
                borderRadius: 8,
                padding: "24px",
                position: "sticky",
                top: 100,
                boxShadow: "0 4px 16px rgba(42, 15, 58, 0.05)",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2A0F3A", margin: "0 0 18px", paddingBottom: 12, borderBottom: "1px solid rgba(42, 15, 58, 0.08)" }}>
                Order Summary
              </h2>

              <div style={{ display: "grid", gap: 12, fontSize: 13.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#52435B" }}>
                  <span>Subtotal ({count} item{count === 1 ? "" : "s"})</span>
                  <b style={{ color: "#2A0F3A" }}>{inr(subtotal)}</b>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: "#52435B" }}>
                  <span>Estimated Delivery</span>
                  <b style={{ color: shippingFee === 0 ? "#15803D" : "#2A0F3A" }}>
                    {shippingFee === 0 ? "FREE" : inr(shippingFee)}
                  </b>
                </div>

                {serverPricing && serverPricing.taxTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: 12 }}>
                    <span>Statutory GST Included</span>
                    <span>{inr(serverPricing.taxTotal)}</span>
                  </div>
                )}

                <div
                  style={{
                    borderTop: "1px solid rgba(42, 15, 58, 0.12)",
                    paddingTop: 14,
                    marginTop: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#2A0F3A" }}>
                    Total Payable
                  </span>
                  <b style={{ fontSize: 24, fontWeight: 800, color: "#2A0F3A" }}>
                    {inr(grandTotal)}
                  </b>
                </div>
              </div>

              <Link
                href="/checkout"
                className="qc-btn-instant-buy"
                style={{
                  width: "100%",
                  marginTop: 22,
                  textDecoration: "none",
                  fontSize: 14,
                  height: 48,
                }}
              >
                Proceed to Secure Checkout →
              </Link>

              <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                <span>🔒 256-bit SSL encrypted checkout</span>
                <span style={{ display: "block", marginTop: 4 }}>UPI · NetBanking · Cards · Cash on Delivery</span>
              </div>
            </aside>
          </div>
        ) : (
          /* High-Converting Empty State */
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#FFFFFF",
              borderRadius: 8,
              border: "1px solid rgba(42, 15, 58, 0.1)",
              maxWidth: 780,
              margin: "0 auto",
            }}
          >
            <span style={{ fontSize: 54, display: "block", marginBottom: 12 }}>🛍️</span>
            <h2 style={{ font: "28px var(--font-display)", color: "#2A0F3A", margin: "0 0 8px" }}>
              Your Care Bag is Empty
            </h2>
            <p style={{ fontSize: 15, color: "#64748B", maxWidth: 440, margin: "0 auto 24px" }}>
              Explore our laboratory-certified formulations and discover targeted regimens for your health.
            </p>
            <Link
              href="/shop"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "#2A0F3A",
                color: "#D4AF37",
                textDecoration: "none",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 13.5,
                letterSpacing: ".04em",
                textTransform: "uppercase",
              }}
            >
              Explore Formulations Catalog →
            </Link>

            {/* Popular Best Sellers Recommendation */}
            {bestSellers.length > 0 && (
              <div style={{ marginTop: 48, textAlign: "left", borderTop: "1px solid rgba(42, 15, 58, 0.08)", paddingTop: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2A0F3A", margin: "0 0 16px" }}>
                  Popular Clinical Formulations
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                  {bestSellers.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        border: "1px solid rgba(42, 15, 58, 0.08)",
                        borderRadius: 6,
                        padding: 14,
                        background: "#FAF8F5",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <Image
                          src={p.image || "/placeholder.png"}
                          alt={p.name}
                          width={140}
                          height={140}
                          style={{ objectFit: "contain", width: "100%", height: 110, marginBottom: 8 }}
                        />
                        <b style={{ fontSize: 13.5, color: "#2A0F3A", display: "block", lineHeight: 1.3 }}>{p.name}</b>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#997B4D", marginTop: 4, display: "block" }}>
                          {inr(p.price)}
                        </span>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <AddToCartButton
                          productId={p.slug}
                          productName={p.name}
                          customLabel="Add to Bag"
                          style={{ height: 34, fontSize: 11.5, width: "100%", justifyContent: "center" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
    <QueensCareFooter />
  </>
);
}

