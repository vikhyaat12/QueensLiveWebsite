/* eslint-disable @next/next/no-img-element */
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { store } from "@/lib/commerce/store";
import { prisma } from "@/lib/prisma";
import { fileDb } from "@/lib/commerce/file-db";
import { aplusStore, redirectStore } from "@/lib/commerce/store-extensions";
import ProductPurchaseZone from "@/app/components/ProductPurchaseZone";
import ProductGallery from "@/app/components/ProductGallery";
import ProductTabs from "./ProductTabs";
import HighlightsList from "./HighlightsList";
import DeliveryCalculator from "@/app/components/DeliveryCalculator";
import RecommendationsSection from "@/app/components/RecommendationsSection";
import ProductRangeCarousel from "@/app/components/ProductRangeCarousel";
import RecentlyViewed from "@/app/components/RecentlyViewed";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";
import UniversalPromoRenderer from "@/app/components/promotions/UniversalPromoRenderer";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const product = await store.products.bySlug(slug);
  if (!product) {
    const redirectTarget = await redirectStore.resolve(`/products/${slug}`);
    if (redirectTarget) {
      permanentRedirect(redirectTarget.destination);
    }
    return { title: "Product not found" };
  }
  return {
    title: `${product.name} | Queens Care Laboratories`,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} | Queens Care Laboratories`,
      description: product.description,
      images: product.image ? [product.image] : [],
    },
  };
}

async function getProductFull(slug: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sort: "asc" } },
        variants: { where: { active: true }, orderBy: { sort: "asc" } },
        specifications: { orderBy: { sort: "asc" } },
        model3d: true,
        productFaqs: { orderBy: { sort: "asc" } },
        reviews: { where: { visible: true }, orderBy: { createdAt: "desc" }, include: { user: true } },
        relatedFrom: { include: { relatedProduct: true } },
        aplusSections: { where: { active: true }, orderBy: { sort: "asc" } },
        videos: { where: { active: true }, orderBy: { sort: "asc" } },
      },
    });
    return product;
  } catch {
    return null;
  }
}

async function getQA(productId: string) {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await prisma.productQA.findMany({ where: { productId, visible: true }, orderBy: { createdAt: "desc" } });
  } catch { return []; }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const product = await store.products.bySlug(slug);
  if (!product) {
    const redirectTarget = await redirectStore.resolve(`/products/${slug}`);
    if (redirectTarget) {
      permanentRedirect(redirectTarget.destination);
    }
    return notFound();
  }

  // Server-side product_view recording — the previous inline client script
  // raced hydration and silently dropped every product_view event, leaving
  // the analytics funnel's "Product View" stage at zero. Fire-and-forget;
  // dedup (60s per product+visitor) happens inside the API.
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
    const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const sessionKey = h.get("x-qc-visitor") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    void fetch(`${proto}://${host}/api/analytics/product-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug: product.slug,
        productName: product.name,
        category: product.category || "",
        sessionKey,
      }),
    }).catch(() => {});
  } catch {}

  const full = await getProductFull(product.slug);
  const rawImages = (product as Record<string, unknown>).images;
  const fallbackImages = Array.isArray(rawImages) ? (rawImages as string[]).map((u, i) => ({ id: `img-${i}`, url: u, alt: product.name })) : [];
  const images = (full?.images && full.images.length > 0) ? full.images : fallbackImages;
  const variants = full?.variants || [];
  
  let fallbackSpecs: Array<{ id: string; name: string; value: string }> = [];
  try {
    const rawSpecs = (product as Record<string, unknown>).specifications;
    if (Array.isArray(rawSpecs)) fallbackSpecs = rawSpecs.map((s, i) => ({ id: `sp-${i}`, name: s.name, value: s.value }));
    else if (typeof rawSpecs === "string") fallbackSpecs = JSON.parse(rawSpecs).map((s: { name: string; value: string }, i: number) => ({ id: `sp-${i}`, name: s.name, value: s.value }));
  } catch {}

  const rawHighlights = (product as Record<string, unknown>).highlights;
  const highlights: Array<{ id: string; text: string; icon?: string }> = Array.isArray(rawHighlights)
    ? rawHighlights
        .filter((h) => (typeof h === "object" && h !== null ? (h as { active?: boolean; text?: string }).active !== false && Boolean((h as { text?: string }).text) : Boolean(h)))
        .map((h, i) =>
          typeof h === "string"
            ? { id: `hl-${i}`, text: h, icon: "✓" }
            : { id: ((h as { id?: string }).id as string) || `hl-${i}`, text: String((h as { text?: string }).text), icon: (h as { icon?: string }).icon || "✓" }
        )
    : [];

  const specs = (full?.specifications && full.specifications.length > 0) ? full.specifications : fallbackSpecs;
  const faqs = full?.productFaqs || [];
  const reviews = (full?.reviews && full.reviews.length > 0) ? full.reviews : (await store.reviews.list(product.slug));
  
  // All active products for Range Carousel
  const allProducts = await store.products.list();
  const rangeProducts = allProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    image: p.image,
    price: p.price,
    mrp: p.mrp,
    benefits: p.benefits,
    stock: p.stock,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let related: any[] = (full?.relatedFrom || []).map(r => r.relatedProduct).filter(Boolean);
  if (related.length === 0) {
    try {
      const rawRelated = (product as Record<string, unknown>).relatedProducts;
      if (Array.isArray(rawRelated) && rawRelated.length > 0) {
        related = (await Promise.all(rawRelated.map(async (ident: string) => {
          const p = await store.products.bySlug(ident) || fileDb.findOne("products", prod => prod.id === ident || prod.slug === ident);
          return p ? { id: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, mrp: (p as Record<string, unknown>).mrp as number || (p as Record<string, unknown>).originalPrice as number || undefined } : null;
        }))).filter(Boolean);
      }
    } catch {}
  }
  related = related.filter((p) => p && p.slug !== product.slug && p.id !== product.id);
  const aplusData = await aplusStore.getByProduct(product.slug);
  const aplusRaw: Record<string, unknown>[] = aplusData.sections.length > 0 ? aplusData.sections : (full?.aplusSections || []);
  const aplus = aplusData.published ? aplusRaw : [];
  const rawVideos = (product as Record<string, unknown>).videos;
  const fallbackVideos = Array.isArray(rawVideos) ? rawVideos : [];
  const videos = (full?.videos && full.videos.length > 0) ? full.videos : fallbackVideos;  const questions = full ? await getQA(full.id) : [];

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "";
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images.map((i: { url: string }) => i.url),
    sku: product.slug,
    brand: { "@type": "Brand", name: "Queens Care Laboratories" },
    offers: {
      "@type": "Offer",
      url: `${origin}/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: "2027-12-31",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(reviews.length > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: reviews.length,
      },
      review: reviews.slice(0, 10).map((r: { rating: number; title?: string; comment?: string; user?: { name?: string }; createdAt: string | Date }) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.user?.name || "Customer" },
        reviewRating: { "@type": "Rating", ratingValue: r.rating },
        name: r.title || "Review",
        reviewBody: r.comment || "",
      })),
    } : {}),
  };

  return (
    <div className="qc-page-shell" style={{ overflowX: "clip", width: "100%", maxWidth: "100%" }}>
      <QueensCareHeader activePage="products" />
      <main className="product-detail" style={{ maxWidth: 1240, margin: "0 auto", padding: "16px 20px 80px" }}>
      {/* Product Structured Data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      {/* Analytics: product view */}
      <script
        dangerouslySetInnerHTML={{
          __html: `if(window.__qc_track_product_view){window.__qc_track_product_view(${JSON.stringify(product.slug)},${JSON.stringify(product.name)})}
          try{
            var rv=JSON.parse(localStorage.getItem('qc_recently_viewed_v1')||'[]');
            rv=rv.filter(function(p){return p.slug!==${JSON.stringify(product.slug)}});
            rv.unshift({
              id:${JSON.stringify(product.id)},
              slug:${JSON.stringify(product.slug)},
              name:${JSON.stringify(product.name)},
              price:${product.price},
              mrp:${product.mrp || 0},
              image:${JSON.stringify(product.image || '')},
              category:${JSON.stringify(product.category || '')}
            });
            localStorage.setItem('qc_recently_viewed_v1',JSON.stringify(rv.slice(0,8)));
          }catch(e){}`,
        }}
      />
      {/* ─── LUXURY TRUST BAR (Calm, Stationary, Verified) ─── */}
      <div
        style={{
          margin: "12px 0 24px 0",
          background: "#FAF8F5",
          border: "1px solid #EFEAE3",
          borderRadius: 8,
          padding: "12px 18px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, color: "#D4AF37" }}>✦</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", letterSpacing: ".02em" }}>
              Formula Transparency
            </div>
            <div style={{ fontSize: 11, color: "#776D80" }}>
              Active bioactives fully disclosed
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, color: "#166534" }}>✓</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", letterSpacing: ".02em" }}>
              Laboratory Batch-Verified
            </div>
            <div style={{ fontSize: 11, color: "#776D80" }}>
              Formulated by Queens Care
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, color: "#2A0F3A" }}>🧾</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", letterSpacing: ".02em" }}>
              Statutory GST Invoice
            </div>
            <div style={{ fontSize: 11, color: "#776D80" }}>
              Official B2C/B2B tax documentation
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, color: "#D4AF37" }}>🧪</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", letterSpacing: ".02em" }}>
              Science-Backed Care
            </div>
            <div style={{ fontSize: 11, color: "#776D80" }}>
              Research-driven formulation
            </div>
          </div>
        </div>
      </div>

      {/* ─── CLINICAL BREADCRUMB HIERARCHY ─── */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 20, fontSize: 12, color: "var(--muted)" }}>
        <ol style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
          <li>
            <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
          </li>
          <li style={{ color: "#D4AF37", fontSize: 10 }}>/</li>
          <li>
            <Link href="/shop" style={{ color: "var(--muted)", textDecoration: "none" }}>Formulations</Link>
          </li>
          <li style={{ color: "#D4AF37", fontSize: 10 }}>/</li>
          {product.category && (
            <>
              <li>
                <Link href={`/shop?category=${encodeURIComponent(product.category)}`} style={{ color: "var(--muted)", textDecoration: "none" }}>
                  {product.category}
                </Link>
              </li>
              <li style={{ color: "#D4AF37", fontSize: 10 }}>/</li>
            </>
          )}
          <li aria-current="page" style={{ color: "#2A0F3A", fontWeight: 700 }}>
            {product.name}
          </li>
        </ol>
      </nav>

      {/* ─── PRODUCT HERO GRID ─── */}
      <div className="detail-grid">
        {/* Gallery Column */}
        <div className="product-gallery">
          <ProductGallery
            mainImage={product.image}
            productName={product.name}
            images={images.map(img => ({ id: img.id, url: img.url, alt: img.alt || undefined }))}
            videos={videos.map(v => ({ id: v.id, url: v.url, title: v.title || undefined, posterUrl: v.posterUrl || undefined }))}
          />
        </div>

        {/* Product Information Column */}
        <div className="product-info" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Universal Slot: Above Product Details */}
          <UniversalPromoRenderer
            slot="product_above_info"
            context={{ pageType: "pdp", productId: product.id, category: product.category }}
          />

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: "#D4AF37",
                }}
              >
                ✦ {product.category || "Clinical Dermatology"}
              </span>
              <span style={{ color: "#E0D7C7" }} aria-hidden="true">·</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  background: "#FAF8F5",
                  color: "#2A0F3A",
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid #E8DFD0",
                }}
              >
                Queens Care Laboratories
              </span>
            </div>
            <h1
              style={{
                fontSize: 34,
                fontFamily: "var(--font-display)",
                color: "#2A0F3A",
                margin: "0 0 8px",
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                fontWeight: 600,
              }}
            >
              {product.name}
            </h1>

            {/* Short Value Statement / Subtitle (Amazon-Level Product Clarity) */}
            {Boolean((product as Record<string, unknown>).shortDescription || (product as Record<string, unknown>).subtitle) && (
              <p
                style={{
                  fontSize: 14.5,
                  color: "#5B4D68",
                  lineHeight: 1.55,
                  margin: "0 0 10px",
                  fontWeight: 500,
                }}
              >
                {String((product as Record<string, unknown>).shortDescription || (product as Record<string, unknown>).subtitle)}
              </p>
            )}

            {/* Rating Bar */}
            {reviews.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ color: "#D4AF37", fontWeight: 700 }}>★ {avgRating}</span>
                <span style={{ color: "var(--muted)" }}>·</span>
                <span style={{ color: "var(--ink)", textDecoration: "underline", cursor: "pointer" }}>
                  {reviews.length} {reviews.length === 1 ? "verified review" : "verified reviews"}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
                <span style={{ color: "var(--gold)" }}>☆</span>
                <span>Verified Formulation</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ color: "var(--ink)", textDecoration: "underline", cursor: "pointer" }}>
                  Be the first to review this formulation
                </span>
              </div>
            )}
          </div>

          {/* ─── INTERACTIVE PURCHASE ZONE (PRICE, PACK SIZE, AVAILABILITY, DELIVERY, QTY, CTAs, TRUST, STICKY MOBILE) ─── */}
          <ProductPurchaseZone
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              sku: (product as Record<string, unknown>).sku as string || product.slug,
              price: product.price,
              mrp: product.mrp ?? ((product as Record<string, unknown>).originalPrice as number | undefined),
              discount: product.discount,
              stock: product.stock,
              image: product.image,
              packSize: product.packSize || specs.find((s) => s.name?.toLowerCase().includes("pack"))?.value,
              status: (product as Record<string, unknown>).status as string,
              outOfStockMessage: (product as Record<string, unknown>).outOfStockMessage as string,
              active: product.active,
              trackInventory: (product as Record<string, unknown>).trackInventory as boolean,
              inventoryMessagingEnabled: (product as Record<string, unknown>).inventoryMessagingEnabled as boolean,
              scarcityThreshold: (product as Record<string, unknown>).scarcityThreshold as number,
              maxPurchaseQty: (product as Record<string, unknown>).maxPurchaseQty as number,
              minPurchaseQty: (product as Record<string, unknown>).minPurchaseQty as number,
              preorderEnabled: (product as Record<string, unknown>).preorderEnabled as boolean,
              preorderLabel: (product as Record<string, unknown>).preorderLabel as string,
              preorderMessage: (product as Record<string, unknown>).preorderMessage as string,
              expectedDispatchDate: (product as Record<string, unknown>).expectedDispatchDate as string,
              preorderMaxQty: (product as Record<string, unknown>).preorderMaxQty as number,
              preorderCodAllowed: (product as Record<string, unknown>).preorderCodAllowed as boolean,
            }}
            variants={variants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: (v as Record<string, unknown>).sku as string || undefined,
              price: v.price,
              mrp: (v as Record<string, unknown>).mrp as number || undefined,
              stock: v.stock,
            }))}
            deliveryChecker={<DeliveryCalculator productPrice={product.price} />}
          />

          {/* ─── AMAZON-STYLE KEY HIGHLIGHTS / BULLETS (RENDER ZERO MARKUP IF EMPTY) ─── */}
          {highlights.length > 0 && (
            <HighlightsList highlights={highlights} />
          )}

          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#444", margin: 0 }}>
            {product.description}
          </p>

          {/* ─── KEY BENEFITS ─── */}
          {product.benefits && product.benefits.length > 0 && (
            <div style={{ padding: "14px 18px", background: "#fbf9f6", border: "1px solid var(--line)", borderRadius: 6 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#2A0F3A", margin: "0 0 8px" }}>
                Key Clinical Benefits
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#333", lineHeight: 1.6 }}>
                {product.benefits.map((benefit) => (
                  <li key={benefit} style={{ marginBottom: 4 }}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ─── BADGES ─── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Boolean((product as Record<string, unknown>).bestSeller) && (
              <span style={{ padding: "4px 10px", background: "#D4AF37", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", borderRadius: 3 }}>
                ★ Best Seller
              </span>
            )}
            {Boolean((product as Record<string, unknown>).newArrival) && (
              <span style={{ padding: "4px 10px", background: "#2e7d32", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", borderRadius: 3 }}>
                ✦ New Formulation
              </span>
            )}
            {Boolean((product as Record<string, unknown>).featured) && (
              <span style={{ padding: "4px 10px", background: "#2A0F3A", color: "#D4AF37", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", borderRadius: 3 }}>
                ✦ Clinical Choice
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── PREMIUM PRODUCT INFORMATION SYSTEM (admin-driven accordion) ─── */}
      {specs.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#D4AF37" }}>✦ Product Information</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 30px)", color: "#2A0F3A", margin: "6px 0 0" }}>
              Formulation Profile
            </h2>
          </div>
          <div style={{ maxWidth: 880, margin: "0 auto", border: "1px solid var(--line)", borderRadius: 14, background: "#fff", boxShadow: "0 10px 30px -18px rgba(42,15,58,.14)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <tbody>
                <tr>
                  <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", width: "35%", borderBottom: "1px solid var(--line)" }}>
                    Laboratory Brand
                  </td>
                  <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                    {product.brand || "Queens Care Laboratories"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                    Product Formula
                  </td>
                  <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                    {product.name}
                  </td>
                </tr>
                {(product.genericName || product.composition) && (
                  <tr>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                      Active Composition / Generic
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                      {product.genericName || product.composition}
                    </td>
                  </tr>
                )}
                {product.strength && (
                  <tr>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                      Strength / Dosage Form
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                      {product.strength}
                    </td>
                  </tr>
                )}
                {product.packSize && (
                  <tr>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                      Pack Presentation
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                      {product.packSize}
                    </td>
                  </tr>
                )}
                {product.storageConditions && (
                  <tr>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                      Storage Conditions
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                      {product.storageConditions}
                    </td>
                  </tr>
                )}
                {product.prescriptionStatus && product.prescriptionStatus !== "none" && (
                  <tr>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                      Regulatory / Rx Classification
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", color: product.prescriptionStatus === "rx_required" ? "#c026d3" : "inherit", fontWeight: 600 }}>
                      {product.prescriptionStatus === "rx_required" ? "Prescription Required (Schedule Drug)" : "Physician Guidance Recommended"}
                    </td>
                  </tr>
                )}
                {product.ingredients && (
                  <tr>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                      Active Ingredients
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", lineHeight: 1.6 }}>
                      {product.ingredients}
                    </td>
                  </tr>
                )}
                {product.usage && (
                  <tr>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                      Clinical Application Protocol
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", lineHeight: 1.6 }}>
                      {product.usage}
                    </td>
                  </tr>
                )}
                {product.safetyInfo && (
                  <tr>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                      Safety & Dermatological Guidance
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", lineHeight: 1.6 }}>
                      {product.safetyInfo}
                    </td>
                  </tr>
                )}
                {specs.map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td style={{ padding: "13px 20px", background: "#FAF8F5", color: "#997b4d", fontWeight: 700, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderBottom: idx === specs.length - 1 ? "none" : "1px solid var(--line)" }}>
                      {s.name}
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: idx === specs.length - 1 ? "none" : "1px solid var(--line)" }}>
                      {s.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── A+ CINEMATIC PRODUCT STORYTELLING ─── */}
      {aplus.length > 0 && (
        <section style={{ marginTop: 72 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#D4AF37" }}>✦ The Product Story</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 36px)", color: "#2A0F3A", margin: "8px 0 0" }}>
              Inside {product.name}
            </h2>
            <div aria-hidden="true" style={{ width: 56, height: 2, background: "linear-gradient(90deg, transparent, #D4AF37, transparent)", margin: "16px auto 0" }} />
          </div>

          {(aplus as Array<Record<string, unknown>>).filter((s) => s.published !== false).map((section, idx) => {
            const secId = typeof section.id === "string" ? section.id : `aplus-${idx}`;
            const secType = String(section.type || "");
            const secHeading = String(section.heading || section.title || "");
            const secText = String(section.text || section.body || "");
            const secImageUrl = typeof section.imageUrl === "string" ? section.imageUrl : "";
            const secImageAlt = typeof section.imageAlt === "string" ? section.imageAlt : "";
            const secVideoUrl = typeof section.videoUrl === "string" ? section.videoUrl : "";
            const secItems = Array.isArray(section.items) ? (section.items as string[]) : [];
            const secCtaText = typeof section.ctaText === "string" ? section.ctaText : "";
            const secCtaLink = typeof section.ctaLink === "string" ? section.ctaLink : "/shop";
            const sectionNumber = `Section ${String(idx + 1).padStart(2, "0")}`;

            return (
              <div key={secId} style={{ marginBottom: 56 }}>
                {secHeading && secType !== "hero" && secType !== "hero_banner" && secType !== "cta" && (
                  <div style={{ maxWidth: 880, margin: "0 auto 18px", display: "flex", alignItems: "baseline", gap: 14, borderBottom: "1px solid #EFEAE3", paddingBottom: 12 }}>
                    <span aria-hidden="true" style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "#D4AF37", whiteSpace: "nowrap" }}>{sectionNumber}</span>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 2.2vw, 25px)", color: "#2A0F3A", margin: 0, lineHeight: 1.3 }}>{secHeading}</h3>
                  </div>
                )}
                {/* Rich Text */}
                {(secType === "rich_text" || secType === "richText") && (
                  <div style={{ maxWidth: 880, margin: "0 auto" }}>
                    {secText && <div style={{ fontSize: 15.5, lineHeight: 1.85, color: "#333" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(secText) }} />}
                    {secImageUrl && <img src={secImageUrl} alt={secImageAlt} style={{ width: "100%", borderRadius: 12, marginTop: 18 }} />}
                  </div>
                )}

                {/* Hero Banner */}
                {(secType === "hero" || secType === "hero_banner") && (
                  <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", borderRadius: 8, overflow: "hidden" }}>
                    {secImageUrl && <img src={secImageUrl} alt={secImageAlt || secHeading} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    {secHeading && (
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, color: "#fff", background: "linear-gradient(to top, rgba(42, 15, 58, 0.95), transparent)", padding: "32px 28px 24px" }}>
                        <h3 style={{ margin: 0, fontSize: 24, fontFamily: "var(--font-display)", color: "#D4AF37" }}>{secHeading}</h3>
                        {secText && <p style={{ margin: "6px 0 0", fontSize: 14, opacity: 0.9 }}>{secText}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Split Image + Text */}
                {(secType === "imageText" || secType === "image_text") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "center", background: "#FAF8F5", border: "1px solid #EFEAE3", borderRadius: 16, padding: 28 }}>
                    {secImageUrl && <img src={secImageUrl} alt={secImageAlt} style={{ width: "100%", borderRadius: 10, objectFit: "cover" }} />}
                    <div>
                      {secText && <p style={{ fontSize: 15, lineHeight: 1.85, color: "#333", margin: 0 }}>{secText}</p>}
                    </div>
                  </div>
                )}

                {/* Highlights / Features */}
                {(secType === "benefits" || secType === "features" || secType === "comparison" || secType === "highlights") && (
                  <div>
                    {secItems.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                        {secItems.map((item: string, i: number) => (
                          <div key={i} style={{ padding: "20px 22px", background: "#fff", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 8px 22px -16px rgba(42,15,58,.18)", borderTop: "3px solid #D4AF37" }}>
                            <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0, color: "#2A0F3A", fontWeight: 500 }}>✦ {item}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {secImageUrl && <img src={secImageUrl} alt="" style={{ width: "100%", borderRadius: 12, marginTop: 18 }} />}
                  </div>
                )}

                {/* Video */}
                {secType === "video" && (
                  <div>
                    {secVideoUrl && (
                      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 12 }}>
                        <iframe src={secVideoUrl.includes("youtube") ? secVideoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") : secVideoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen loading="lazy" title={secHeading || "Product video"} />
                      </div>
                    )}
                  </div>
                )}

                {secType === "cta" && (
                  <div style={{ textAlign: "center", padding: "52px 24px", background: "linear-gradient(135deg, #2A0F3A 0%, #190924 100%)", borderRadius: 16, color: "#fff", boxShadow: "0 24px 50px -24px rgba(42,15,58,.4)" }}>
                    {secHeading && <h3 style={{ font: "26px var(--font-display)", color: "#D4AF37", marginBottom: 8 }}>{secHeading}</h3>}
                    {secText && <p style={{ fontSize: 15, color: "#f0ede8", marginBottom: 24, maxWidth: 640, margin: "0 auto 24px" }}>{secText}</p>}
                    {secCtaText && (
                      <a href={secCtaLink} style={{ display: "inline-block", padding: "14px 32px", background: "#D4AF37", color: "#2A0F3A", textDecoration: "none", fontSize: 14, fontWeight: 700, letterSpacing: ".04em", borderRadius: 4 }}>
                        {secCtaText}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* ─── QUEENS CARE FORMULATION GUIDANCE (AUTHENTIC BRAND IDENTITY) ─── */}
      <section
        style={{
          marginTop: 48,
          background: "linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%)",
          border: "1px solid #E8DFD0",
          borderRadius: 12,
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <img
            src="/images/reference/dr-queens-avatar-hd.webp"
            alt="Queens Care Formulation Guidance"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #D4AF37",
              boxShadow: "0 4px 12px rgba(42, 15, 58, 0.08)",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#D4AF37" }}>
            ✦ Queens Care Formulation Standards
          </span>
          <h3 style={{ margin: "4px 0 6px", fontFamily: "var(--font-display)", fontSize: 20, color: "#2A0F3A" }}>
            Formulated for Bioavailability &amp; Targeted Absorption
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: "#554A60", lineHeight: 1.6 }}>
            Every Queens Care formulation is developed with rigorous ingredient compatibility and quality checks. For questions regarding formulation details, storage, or product specifications, our team is available to assist you.
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Link
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              background: "#2A0F3A",
              color: "#D4AF37",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid #D4AF37",
              transition: "all 0.15s ease",
            }}
          >
            <span>💬 Formulation Inquiries</span>
          </Link>
        </div>
      </section>

      {/* ─── PRODUCT RANGE HORIZONTAL CAROUSEL ─── */}
      <ProductRangeCarousel
        products={rangeProducts}
        currentSlug={product.slug}
        title="Complete Clinical Lineup"
        subtitle="Pharmaceutical-grade serums, formulations, and targeted regimens by Queens Care Laboratories"
      />

      {/* ─── TABS: Ingredients / Usage / Reviews / Q&A ─── */}
      <ProductTabs
        productId={full?.id || product.id}
        product={product}
        reviews={reviews.map((r: unknown) => {
          const item = r as Record<string, unknown>;
          const userObj = item.user as Record<string, unknown> | undefined;
          const authorName = (userObj?.name as string) || (item.customerName as string) || (item.author as string) || "Customer";
          return {
            id: String(item.id || ""),
            rating: Number(item.rating || 5),
            title: String(item.title || ""),
            body: String(item.body || ""),
            user: { name: authorName },
            createdAt: String(item.createdAt || new Date().toISOString()),
            helpful: Number(item.helpful || 0),
            verified: Boolean(item.verified),
            response: (item.response as string) || (item.pharmacistResponse as string) || null,
          };
        })}
        avgRating={avgRating}
        ratingDist={ratingDist}
        faqs={faqs.map(f => ({ q: f.question, a: f.answer }))}
        questions={questions.map(q => ({ id: q.id, question: q.question, answer: q.answer || null, createdAt: String(q.createdAt) }))}
      />

      {/* ─── RELATED / COMPLEMENTARY FORMULATIONS (NO DUPLICATE STACKING) ─── */}
      {related.length > 0 ? (
        <section style={{ marginTop: 48, marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#D4AF37" }}>✦ Complete Your Routine</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 2.6vw, 28px)", color: "#2A0F3A", margin: "6px 0 0" }}>
              Complementary Formulations
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 18 }}>
            {related.map(p => (
              <Link
                href={`/products/${p.slug}`}
                key={p.id}
                className="qc-related-card"
                style={{ textDecoration: "none", color: "inherit", background: "#fff", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                <span className="qc-related-media">
                  { }
                  <img src={p.image} alt={p.name} loading="lazy" />
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 16px 16px" }}>
                  <b style={{ font: "15px var(--font-display)", color: "#2A0F3A", lineHeight: 1.35 }}>{p.name}</b>
                  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#2A0F3A" }}>₹{p.price.toLocaleString("en-IN")}</span>
                    {p.mrp && p.mrp > p.price && (
                      <>
                        <span style={{ fontSize: 12.5, color: "#94A3B8", textDecoration: "line-through" }}>₹{p.mrp.toLocaleString("en-IN")}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#166534" }}>{Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off</span>
                      </>
                    )}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#997b4d", letterSpacing: ".04em" }}>View Details →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <RecommendationsSection currentSlug={product.slug} title="Complementary Formulations" limit={4} />
      )}

      {/* ─── RECENTLY VIEWED FORMULATIONS (SESSION-BASED) ─── */}
      <RecentlyViewed currentSlug={product.slug} />

      {/* Universal Slot: Bottom of PDP */}
      <div style={{ marginTop: 32 }}>
        <UniversalPromoRenderer
          slot="product_bottom"
          context={{ pageType: "pdp", productId: product.id, category: product.category }}
        />
      </div>
    </main>
    <QueensCareFooter />
  </div>
);
}
