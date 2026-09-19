"use client";

import React, { useState, useEffect, useRef } from "react";
import AddToCartButton from "./AddToCartButton";
import InstantBuyButton from "./InstantBuyButton";

export type ProductPurchaseZoneProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    sku?: string;
    price: number;
    mrp?: number;
    discount?: number;
    stock: number;
    image: string;
    packSize?: string;
    status?: string;
    outOfStockMessage?: string;
    active?: boolean;
    trackInventory?: boolean;
    inventoryMessagingEnabled?: boolean;
    scarcityThreshold?: number;
    maxPurchaseQty?: number;
    minPurchaseQty?: number;
    preorderEnabled?: boolean;
    preorderLabel?: string;
    preorderMessage?: string;
    expectedDispatchDate?: string;
    preorderMaxQty?: number;
    preorderCodAllowed?: boolean;
  };
  variants?: Array<{
    id: string;
    name: string;
    sku?: string;
    price: number;
    mrp?: number;
    stock: number;
  }>;
  deliveryChecker?: React.ReactNode;
};

export default function ProductPurchaseZone({
  product,
  variants = [],
  deliveryChecker,
}: ProductPurchaseZoneProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants.length > 0 ? variants[0].id : ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [showStickyBar, setShowStickyBar] = useState<boolean>(false);
  const [wishlisted, setWishlisted] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Sync initial wishlist state (no-op for signed-out visitors)
  useEffect(() => {
    if (!product.id) return;
    let cancelled = false;
    fetch("/api/wishlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && Array.isArray(d.productIds)) {
          setWishlisted(d.productIds.includes(product.id));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [product.id]);

  // Notify-me waitlist form state
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState("");

  // TODO: Subscribe & Save feature planned — requires subscription billing engine

  const activeVariant = variants.find((v) => v.id === selectedVariantId);
  const currentPrice = activeVariant ? activeVariant.price : product.price;
  const currentStock = activeVariant ? activeVariant.stock : product.stock;
  const currentSku = activeVariant?.sku || product.sku || product.slug;

  const effectivePrice = currentPrice;

  const isPreorder = currentStock <= 0 && Boolean(product.preorderEnabled);
  const isOos =
    (currentStock <= 0 && !isPreorder) ||
    product.status === "out_of_stock" ||
    product.active === false;

  const discountPercent =
    product.mrp && product.mrp > effectivePrice
      ? Math.round(((product.mrp - effectivePrice) / product.mrp) * 100)
      : product.discount || 0;

  const maxAllowedQty = isPreorder
    ? (product.preorderMaxQty || 5)
    : Math.min(product.maxPurchaseQty || 10, Math.max(1, currentStock));

  // Scroll listener for sticky mobile purchase bar: triggers as soon as main action buttons scroll off screen
  useEffect(() => {
    const handleScroll = () => {
      const target = actionsRef.current || containerRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setShowStickyBar(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDec = () => {
    setQuantity((q) => Math.max(product.minPurchaseQty || 1, q - 1));
  };

  const handleInc = () => {
    setQuantity((q) => Math.min(maxAllowedQty, q + 1));
  };

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes("@")) {
      setNotifyError("Please enter a valid email address.");
      return;
    }
    setNotifySubmitting(true);
    setNotifyError("");
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.slug)}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          phone: notifyPhone.trim() || undefined,
          variantId: selectedVariantId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotifySuccess(true);
      } else {
        setNotifyError(data.error || "Failed to join waitlist. Please try again.");
      }
    } catch {
      setNotifyError("Network error. Please try again.");
    } finally {
      setNotifySubmitting(false);
    }
  };

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ─── PRICING ROW ─── */}
      <div
        style={{
          padding: "18px 22px",
          background: "linear-gradient(135deg, #FAF9F6 0%, #F5F0EB 100%)",
          border: "1.5px solid rgba(212, 175, 55, 0.25)",
          borderRadius: 14,
          boxShadow: "0 4px 16px rgba(42, 15, 58, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 34, fontWeight: 850, color: "#1E1638", letterSpacing: "-0.02em", fontFamily: "var(--font-display, serif)" }}>
            ₹{effectivePrice.toLocaleString("en-IN")}
          </span>
          {product.mrp && product.mrp > effectivePrice && (
            <span style={{ textDecoration: "line-through", color: "#94A3B8", fontSize: 16, fontWeight: 500 }}>
              MRP ₹{product.mrp.toLocaleString("en-IN")}
            </span>
          )}
          {discountPercent > 0 && (
            <span
              style={{
                background: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)",
                color: "#166534",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.04em",
                border: "1px solid #86EFAC",
              }}
            >
              SAVE {discountPercent}%
            </span>
          )}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748B", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0F172A", fontWeight: 600 }}>
            <span>✓</span> Inclusive of all taxes
          </span>
          <span>·</span>
          <span>Statutory GST Invoice</span>
          <span>·</span>
          <span style={{ color: "#15803D", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>🚚</span> Check delivery estimate below
          </span>
        </div>
      </div>

      {/* ─── VARIANTS PICKER (IF APPLICABLE) OR PACK SIZE PRESENTATION ─── */}
      {variants.length > 0 ? (
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8, color: "#2A0F3A" }}>
            Select Formulation Pack Size:
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {variants.map((v) => {
              const selected = v.id === selectedVariantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  style={{
                    padding: "10px 18px",
                    border: selected ? "2px solid #2A0F3A" : "1px solid rgba(42, 15, 58, 0.15)",
                    borderRadius: 6,
                    background: selected ? "rgba(42, 15, 58, 0.04)" : "#ffffff",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <b style={{ color: "#2A0F3A", display: "block" }}>{v.name}</b>
                  <span style={{ fontSize: 12, color: "#52435B" }}>
                    ₹{v.price.toLocaleString("en-IN")} {v.stock > 0 ? `· In Stock` : `(Out of stock)`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : product.packSize ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>Pack Presentation:</span>
          <span
            style={{
              background: "#FAF8F5",
              border: "1px solid #E8DFD0",
              color: "#2A0F3A",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📦</span>
            <span>{product.packSize}</span>
          </span>
        </div>
      ) : null}

      {/* ─── TRUTHFUL STOCK & SCARCITY / PRE-ORDER / OUT-OF-STOCK INDICATOR ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {isPreorder ? (
          /* PRE-ORDER DISPATCH WINDOW */
          <div style={{ padding: "14px 18px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1D4ED8", fontWeight: 700, fontSize: 13.5 }}>
              <span>🔷</span>
              <span>{product.preorderLabel || "Pre-Order Formulation"}</span>
            </div>
            {product.expectedDispatchDate && (
              <p style={{ color: "#1E40AF", fontSize: 12.5, fontWeight: 600, margin: "4px 0 0" }}>
                🗓️ Expected Dispatch Window: {product.expectedDispatchDate}
              </p>
            )}
            <p style={{ color: "#3B82F6", fontSize: 12, margin: "4px 0 0" }}>
              {product.preorderMessage || "Directly allocated from the upcoming laboratory batch. Priority dispatch upon release."}
            </p>
          </div>
        ) : isOos ? (
          /* TRUTHFUL OUT OF STOCK + WAITLIST NOTIFY FORM */
          <div style={{ padding: "16px 18px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, width: "100%" }}>
            <p style={{ color: "#DC2626", fontWeight: 700, margin: 0, fontSize: 13.5 }}>
              Currently Out of Stock
            </p>
            <p style={{ color: "#64748B", fontSize: 12, margin: "4px 0 12px" }}>
              {product.outOfStockMessage || "Our laboratory is preparing the next production batch. Join the priority waitlist to be alerted first."}
            </p>

            {notifySuccess ? (
              <div style={{ padding: "10px 14px", background: "#E8F5E9", border: "1px solid #C8E6C9", borderRadius: 4, color: "#1B5E20", fontSize: 12, fontWeight: 600 }}>
                ✓ You are on the priority waitlist! We will notify you immediately once this formulation is available.
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2A0F3A", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  🔔 Notify Me When Restocked
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #D1D5DB",
                      borderRadius: 4,
                      fontSize: 12.5,
                      background: "#fff",
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp / Phone (optional)"
                    value={notifyPhone}
                    onChange={(e) => setNotifyPhone(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #D1D5DB",
                      borderRadius: 4,
                      fontSize: 12.5,
                      background: "#fff",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={notifySubmitting}
                    style={{
                      padding: "8px 16px",
                      background: "#2A0F3A",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {notifySubmitting ? "Subscribing…" : "Alert Me"}
                  </button>
                </div>
                {notifyError && (
                  <span style={{ color: "#DC2626", fontSize: 11, fontWeight: 500 }}>{notifyError}</span>
                )}
              </form>
            )}
          </div>
        ) : (
          /* TRUTHFUL IN-STOCK & VERIFIED SCARCITY */
          <div>
            {product.inventoryMessagingEnabled !== false && currentStock <= (product.scarcityThreshold ?? 5) ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 6, color: "#92400E", fontSize: 12.5, fontWeight: 700 }}>
                <span>⚡</span>
                <span>Only {currentStock} units left in lab inventory — order soon</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534", fontWeight: 600, fontSize: 12.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                <span>In Stock ({currentStock} units available)</span>
                <span style={{ color: "#94A3B8" }}>·</span>
                <span style={{ color: "#64748B", fontWeight: 400 }}>Direct from Queens Care Laboratories</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── INTEGRATED DELIVERY CHECKER ─── */}
      {deliveryChecker && (
        <div style={{ margin: "2px 0 2px" }}>
          {deliveryChecker}
        </div>
      )}

      {/* ─── QUANTITY & ACTION BUTTONS ─── */}
      {!isOos && (
        <div ref={actionsRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#2A0F3A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Quantity:
            </span>
            <div className="qc-qty-control">
              <button
                type="button"
                className="qc-qty-btn"
                onClick={handleDec}
                disabled={quantity <= (product.minPurchaseQty || 1)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="qc-qty-value">{quantity}</span>
              <button
                type="button"
                className="qc-qty-btn"
                onClick={handleInc}
                disabled={quantity >= maxAllowedQty}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              Total: <b>₹{(effectivePrice * quantity).toLocaleString("en-IN")}</b>
            </span>
          </div>

          {/* Primary = Add to Cart; secondary = high-intent Buy Now (CRO hierarchy) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <AddToCartButton
              productId={product.slug}
              quantity={quantity}
              variantId={selectedVariantId || undefined}
              variantName={activeVariant?.name || undefined}
              sku={currentSku}
              unitPrice={effectivePrice}
              productName={product.name}
              customLabel={
                isPreorder
                  ? "Pre-Order Now"
                  : "Add to Cart"
              }
              className="qc-btn-purchase-primary"
            />
            <InstantBuyButton
              productId={product.slug}
              quantity={quantity}
              variantId={selectedVariantId || undefined}
              variantName={activeVariant?.name || undefined}
              sku={currentSku}
              unitPrice={effectivePrice}
              label={
                isPreorder
                  ? (product.preorderLabel || "Pre-Order Now")
                  : "Instant Buy Now"
              }
              className="qc-btn-purchase-secondary"
            />
          </div>
          {/* Wishlist — secondary reassurance action, reuses the existing wishlist API */}
          {product.id && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/wishlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: product.id, action: "toggle" }),
                  });
                  if (res.status === 401) {
                    window.location.href = "/login?next=/products/" + product.slug;
                    return;
                  }
                  const data = await res.json();
                  setWishlisted(Array.isArray(data.productIds) && data.productIds.includes(product.id));
                } catch {}
              }}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                alignSelf: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12.5,
                fontWeight: 600,
                color: wishlisted ? "#C62828" : "#64748B",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
              }}
            >
              <span style={{ fontSize: 16 }}>{wishlisted ? "♥" : "♡"}</span>
              {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>
          )}
        </div>
      )}

      {/* ─── 4-PILLAR CLINICAL REASSURANCE ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginTop: 4,
          paddingTop: 16,
          borderTop: "1px solid rgba(42, 15, 58, 0.08)",
        }}
      >
        <div className="qc-trust-pill">
          <span>🧾</span>
          <div>
            <b>GST Invoice Included</b>
            <span style={{ display: "block", fontSize: 10.5, color: "#64748B" }}>On every order</span>
          </div>
        </div>
        <div className="qc-trust-pill">
          <span>🔒</span>
          <div>
            <b>Secure Checkout</b>
            <span style={{ display: "block", fontSize: 10.5, color: "#64748B" }}>256-Bit SSL Encrypted</span>
          </div>
        </div>
        <div className="qc-trust-pill">
          <span>↩️</span>
          <div>
            <b>Easy Returns</b>
            <span style={{ display: "block", fontSize: 10.5, color: "#64748B" }}>Per our returns policy</span>
          </div>
        </div>
        <div className="qc-trust-pill">
          <span>✉️</span>
          <div>
            <b>care@queenscare.in</b>
            <span style={{ display: "block", fontSize: 10.5, color: "#64748B" }}>Product &amp; order assistance</span>
          </div>
        </div>
      </div>

      {/* ─── STICKY MOBILE PURCHASE BAR (CRO ACCELERATOR) ─── */}
      {showStickyBar && !isOos && (
        <div className="mobile-sticky-cta">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            {product.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  objectFit: "contain",
                  background: "#FBF9F6",
                  border: "1px solid rgba(42, 15, 58, 0.1)",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <b
                style={{
                  fontSize: 12.5,
                  color: "#2A0F3A",
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {product.name}
              </b>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#2A0F3A" }}>
                ₹{effectivePrice.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <AddToCartButton
              productId={product.slug}
              quantity={1}
              variantId={selectedVariantId || undefined}
              variantName={activeVariant?.name || undefined}
              sku={currentSku}
              unitPrice={effectivePrice}
              productName={product.name}
              customLabel={isPreorder ? "Pre-Order" : "Add to Cart"}
              style={{ height: 40, padding: "0 14px", fontSize: 12 }}
            />
            <InstantBuyButton
              productId={product.slug}
              quantity={1}
              variantId={selectedVariantId || undefined}
              variantName={activeVariant?.name || undefined}
              sku={currentSku}
              unitPrice={currentPrice}
              label={isPreorder ? "Pre-Order" : "Buy Now"}
              style={{ height: 40, padding: "0 16px", fontSize: 12 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
