/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { store } from "@/lib/commerce/store";
import { prisma } from "@/lib/prisma";
import { fileDb } from "@/lib/commerce/file-db";
import { aplusStore } from "@/lib/commerce/store-extensions";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductGallery from "@/app/components/ProductGallery";
import ProductTabs from "./ProductTabs";
import DeliveryCalculator from "@/app/components/DeliveryCalculator";
import RecommendationsSection from "@/app/components/RecommendationsSection";
import ProductRangeCarousel from "@/app/components/ProductRangeCarousel";
import DownloadPdfButton from "@/app/components/DownloadPdfButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await store.products.bySlug((await params).slug);
  if (!product) return { title: "Product not found" };
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
  try {
    return await prisma.productQA.findMany({ where: { productId, visible: true }, orderBy: { createdAt: "desc" } });
  } catch { return []; }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const product = await store.products.bySlug((await params).slug);
  if (!product) return notFound();

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
          return p ? { id: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price } : null;
        }))).filter(Boolean);
      }
    } catch {}
  }
  const aplusData = await aplusStore.getByProduct(product.slug);
  const aplusRaw: Record<string, unknown>[] = aplusData.sections.length > 0 ? aplusData.sections : (full?.aplusSections || []);
  const aplus = aplusData.published ? aplusRaw : [];
  const rawVideos = (product as Record<string, unknown>).videos;
  const fallbackVideos = Array.isArray(rawVideos) ? rawVideos : [];
  const videos = (full?.videos && full.videos.length > 0) ? full.videos : fallbackVideos;
  const model3d = full?.model3d;
  const questions = full ? await getQA(full.id) : [];

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
      priceValidUntil: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
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
    <main className="product-detail" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px" }}>
      {/* Product Structured Data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      {/* Analytics: product view */}
      <script
        dangerouslySetInnerHTML={{
          __html: `if(window.__qc_track_product_view){window.__qc_track_product_view(${JSON.stringify(product.slug)},${JSON.stringify(product.name)})}`,
        }}
      />
      {/* ─── EDITORIAL MARQUEE RIBBON ─── */}
      <div
        style={{
          margin: "12px -20px 24px -20px",
          background: "linear-gradient(90deg, #2A0F3A 0%, #3e1654 50%, #2A0F3A 100%)",
          color: "#faf8f5",
          padding: "8px 0",
          overflow: "hidden",
          borderTop: "1px solid #D4AF37",
          borderBottom: "1px solid #D4AF37",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 32,
            whiteSpace: "nowrap",
            animation: "marquee-horizontal 45s linear infinite",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          <span>✦ Pharmaceutical Rigor</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>Micro-Encapsulated Bioavailability</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>Dermatologist Formulated</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>100% INCI Disclosure</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>Zero Harsh Fillers</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>Grade-A Bioactives</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>✦ Pharmaceutical Rigor</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>Batch-Tracked Purity</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>Dermatologist Formulated</span>
          <span style={{ color: "#D4AF37" }}>·</span>
          <span>Direct Cold Chain</span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link href="/shop" className="back" style={{ fontSize: 12, textDecoration: "none", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          ← Back to Queens Care Shop
        </Link>
      </div>

      {/* ─── PRODUCT HERO GRID ─── */}
      <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "start" }}>
        {/* Gallery Column */}
        <div className="product-gallery">
          <ProductGallery
            mainImage={product.image}
            productName={product.name}
            images={images.map(img => ({ id: img.id, url: img.url, alt: img.alt || undefined }))}
            videos={videos.map(v => ({ id: v.id, url: v.url, title: v.title || undefined, posterUrl: v.posterUrl || undefined }))}
            enable3D={Boolean(model3d?.enabled && model3d?.modelUrl)}
            model3dPoster={model3d?.posterUrl || product.image}
            modelUrl={model3d?.modelUrl || undefined}
          />
        </div>

        {/* Product Information Column */}
        <div className="product-info" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".15em",
                textTransform: "uppercase",
                color: "#997b4d",
                display: "block",
                marginBottom: 4,
              }}
            >
              {product.category || "Clinical Dermatology"}
            </span>
            <h1
              style={{
                fontSize: 32,
                fontFamily: "var(--font-display)",
                color: "#2A0F3A",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </h1>

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
                <span>No reviews yet</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ color: "var(--ink)", textDecoration: "underline", cursor: "pointer" }}>
                  Be the first to review this formulation
                </span>
              </div>
            )}
          </div>

          {/* Pricing Row */}
          <div
            style={{
              padding: "16px 20px",
              background: "#faf8f5",
              border: "1px solid var(--line)",
              borderRadius: 8,
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, color: "#2A0F3A" }}>
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span style={{ textDecoration: "line-through", color: "var(--muted)", fontSize: 16 }}>
                MRP ₹{product.mrp.toLocaleString("en-IN")}
              </span>
            )}
            {product.discount && product.discount > 0 && (
              <span
                style={{
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                SAVE {product.discount}%
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--muted)", width: "100%", marginTop: 2 }}>
              Inclusive of all taxes · Free delivery on eligible orders
            </span>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#444", margin: 0 }}>
            {product.description}
          </p>

          {/* ─── FORMULATION NOTES / SENSORY MATRIX (Inspired by Reference) ─── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              padding: "14px 16px",
              background: "#fcfbfa",
              border: "1px solid var(--line)",
              borderRadius: 6,
            }}
          >
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#997b4d", letterSpacing: ".06em", display: "block" }}>
                Active Concentration
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#2A0F3A" }}>
                Pharma-Grade Bioactive
              </p>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#997b4d", letterSpacing: ".06em", display: "block" }}>
                Therapeutic Finish
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#2A0F3A" }}>
                Velvet Micro-Absorption
              </p>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#997b4d", letterSpacing: ".06em", display: "block" }}>
                Formulation Type
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#2A0F3A" }}>
                Micro-Encapsulated
              </p>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#997b4d", letterSpacing: ".06em", display: "block" }}>
                Safety Profile
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#2A0F3A" }}>
                Hypoallergenic & Non-Comedogenic
              </p>
            </div>
          </div>

          {/* ─── VARIANTS ─── */}
          {variants.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8, color: "#2A0F3A" }}>
                Select Formulation Variant:
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {variants.map(v => (
                  <div key={v.id} style={{ padding: "8px 16px", border: "1px solid var(--line)", borderRadius: 4, background: "#fff", fontSize: 12 }}>
                    <b>{v.name}</b> — ₹{v.price.toLocaleString("en-IN")} {v.stock > 0 ? `· ${v.stock} in stock` : <span style={{ color: "#b34141" }}>Out of stock</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* ─── PRODUCT SAFETY & FORMULATION TRANSPARENCY ─── */}
          <div style={{ padding: "16px 20px", background: "#fbf9f6", border: "1px solid var(--line)", borderRadius: 6, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#2A0F3A", textTransform: "uppercase", letterSpacing: ".06em" }}>
              <span>🛡️ Formulation Safety &amp; Batch Traceability</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              <div>
                <b style={{ color: "var(--ink)", display: "block" }}>Storage Integrity</b>
                <span>Store below 25°C away from direct sunlight. Refrigerate after unsealing if indicated.</span>
              </div>
              <div>
                <b style={{ color: "var(--ink)", display: "block" }}>Quality Testing</b>
                <span>Every lot undergoes active assay, stability, and microbial limit testing.</span>
              </div>
              <div>
                <b style={{ color: "var(--ink)", display: "block" }}>Safety &amp; Patch Test</b>
                <span>Conduct a 24-hr epidermal patch test prior to initial application. Topical use only.</span>
              </div>
              <div>
                <b style={{ color: "var(--ink)", display: "block" }}>Pharmacist Inquiries</b>
                <span>Direct questions to care@queenscare.in or our clinical team.</span>
              </div>
            </div>
          </div>

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

          {/* ─── DELIVERY CALCULATOR ─── */}
          <div>
            <DeliveryCalculator productPrice={product.price} />
          </div>

          {/* ─── STOCK & CTAs ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
            {(() => {
              const status = String((product as Record<string, unknown>).status || (product.active !== false ? 'active' : 'inactive'));
              const oosMsg = String((product as Record<string, unknown>).outOfStockMessage || '');
              const isOos = product.stock <= 0 || status === 'out_of_stock' || status === 'inactive';

              if (isOos) {
                return (
                  <div style={{ padding: "16px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 6 }}>
                    <p style={{ color: "#c53030", fontWeight: 700, margin: 0, fontSize: 14 }}>Currently Out of Stock</p>
                    {oosMsg && <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>{oosMsg}</p>}
                  </div>
                );
              }

              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#2e7d32", fontWeight: 600 }}>
                    <span>● In Stock ({product.stock} units available)</span>
                    <span style={{ color: "var(--muted)" }}>·</span>
                    <span style={{ color: "var(--muted)" }}>SKU: {product.slug}</span>
                  </div>                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <AddToCartButton productId={product.slug} productName={product.name} />
                    <Link
                      href="/checkout"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "14px 24px",
                        background: "#2A0F3A",
                        color: "#D4AF37",
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: ".04em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        borderRadius: 4,
                        boxShadow: "0 4px 14px rgba(42, 15, 58, 0.25)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Instant Buy Now <span>→</span>
                    </Link>
                  </div>
                  <DownloadPdfButton slug={product.slug} name={product.name} />
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ─── CLINICAL SPECIFICATIONS BREAKDOWN ─── */}
      {specs.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <h2 style={{ font: "24px var(--font-display)", color: "#2A0F3A", marginBottom: 20 }}>
            Pharmaceutical Formulation Profile
          </h2>
          <div style={{ border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                <tr>
                  <td style={{ padding: "12px 18px", background: "#fbf9f6", fontWeight: 600, width: "35%", borderBottom: "1px solid var(--line)" }}>
                    Laboratory Brand
                  </td>
                  <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                    {product.brand || "Queens Care Laboratories"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 18px", background: "#fbf9f6", fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
                    Product Formula
                  </td>
                  <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                    {product.name}
                  </td>
                </tr>
                {product.ingredients && (
                  <tr>
                    <td style={{ padding: "12px 18px", background: "#fbf9f6", fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
                      Active Ingredients
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", lineHeight: 1.6 }}>
                      {product.ingredients}
                    </td>
                  </tr>
                )}
                {product.usage && (
                  <tr>
                    <td style={{ padding: "12px 18px", background: "#fbf9f6", fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
                      Clinical Application Protocol
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", lineHeight: 1.6 }}>
                      {product.usage}
                    </td>
                  </tr>
                )}
                {product.safetyInfo && (
                  <tr>
                    <td style={{ padding: "12px 18px", background: "#fbf9f6", fontWeight: 600, borderBottom: "1px solid var(--line)" }}>
                      Safety & Dermatological Guidance
                    </td>
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", lineHeight: 1.6 }}>
                      {product.safetyInfo}
                    </td>
                  </tr>
                )}
                {specs.map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td style={{ padding: "12px 18px", background: "#fbf9f6", fontWeight: 600, borderBottom: idx === specs.length - 1 ? "none" : "1px solid var(--line)" }}>
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

      {/* ─── A+ EDITORIAL STORYTELLING CONTENT ─── */}
      {aplus.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "#D4AF37" }}>
              ✦ Clinical Editorial
            </span>
            <h2 style={{ font: "28px var(--font-display)", color: "#2A0F3A", margin: "6px 0 0" }}>
              The Science of {product.name}
            </h2>
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

            return (
              <div key={secId} style={{ marginBottom: 40 }}>
                {/* Rich Text */}
                {(secType === "rich_text" || secType === "richText") && (
                  <div style={{ maxWidth: 880, margin: "0 auto" }}>
                    {secHeading && <h3 style={{ font: "22px var(--font-display)", color: "#2A0F3A", marginBottom: 12 }}>{secHeading}</h3>}
                    {secText && <div style={{ fontSize: 15, lineHeight: 1.8, color: "#333" }} dangerouslySetInnerHTML={{ __html: secText }} />}
                    {secImageUrl && <img src={secImageUrl} alt={secImageAlt} style={{ width: "100%", borderRadius: 8, marginTop: 16 }} />}
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
                    {secImageUrl && <img src={secImageUrl} alt={secImageAlt} style={{ width: "100%", borderRadius: 8, objectFit: "cover" }} />}
                    <div>
                      {secHeading && <h3 style={{ font: "22px var(--font-display)", color: "#2A0F3A", marginBottom: 12 }}>{secHeading}</h3>}
                      {secText && <p style={{ fontSize: 15, lineHeight: 1.8, color: "#333" }}>{secText}</p>}
                    </div>
                  </div>
                )}

                {/* Highlights / Features */}
                {(secType === "benefits" || secType === "features" || secType === "comparison" || secType === "highlights") && (
                  <div>
                    {secHeading && <h3 style={{ font: "22px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>{secHeading}</h3>}
                    {secItems.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                        {secItems.map((item: string, i: number) => (
                          <div key={i} style={{ padding: 18, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
                            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: "#2A0F3A", fontWeight: 500 }}>✦ {item}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {secImageUrl && <img src={secImageUrl} alt="" style={{ width: "100%", borderRadius: 8, marginTop: 16 }} />}
                  </div>
                )}

                {/* Video */}
                {secType === "video" && (
                  <div>
                    {secHeading && <h3 style={{ font: "22px var(--font-display)", color: "#2A0F3A", marginBottom: 12 }}>{secHeading}</h3>}
                    {secVideoUrl && (
                      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 8 }}>
                        <iframe src={secVideoUrl.includes("youtube") ? secVideoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") : secVideoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen loading="lazy" title={secHeading || "Product video"} />
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                {secType === "cta" && (
                  <div style={{ textAlign: "center", padding: "48px 24px", background: "linear-gradient(135deg, #2A0F3A 0%, #190924 100%)", borderRadius: 8, color: "#fff" }}>
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

      {/* ─── PRODUCT RANGE HORIZONTAL CAROUSEL (SLIGHT TWIST INSPIRED) ─── */}
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

      {/* ─── RECOMMENDATIONS ENGINE ─── */}
      <RecommendationsSection currentSlug={product.slug} title="Complementary Formulations" limit={4} />

      {/* ─── RELATED PRODUCTS ─── */}
      {related.length > 0 && (
        <section style={{ marginTop: 48, marginBottom: 48 }}>
          <h2 style={{ font: "22px var(--font-display)", color: "#2A0F3A", marginBottom: 20 }}>
            Related Formulations
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
            {related.map(p => (
              <Link href={`/products/${p.slug}`} key={p.id} style={{ textDecoration: "none", color: "inherit", background: "#fff", border: "1px solid var(--line)", padding: 12, borderRadius: 6 }}>
                <img src={p.image} alt={p.name} style={{ width: "100%", aspectRatio: "1", objectFit: "contain" }} loading="lazy" />
                <b style={{ display: "block", marginTop: 8, font: "15px var(--font-display)", color: "#2A0F3A" }}>{p.name}</b>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#997b4d" }}>₹{p.price.toLocaleString("en-IN")}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
