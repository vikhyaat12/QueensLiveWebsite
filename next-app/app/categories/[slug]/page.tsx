import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import Link from "next/link";
import { store } from "@/lib/commerce/store";
import { redirectStore } from "@/lib/commerce/store-extensions";
import ProductCard from "@/app/components/ProductCard";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const redirectTarget = await redirectStore.resolve(`/categories/${slug}`);
  if (redirectTarget) {
    permanentRedirect(redirectTarget.destination);
  }
  const categoryTitle = slug.replace(/-/g, " ");
  return {
    title: `${categoryTitle} | Formulations | Queens Care Laboratories`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const redirectTarget = await redirectStore.resolve(`/categories/${slug}`);
  if (redirectTarget) {
    permanentRedirect(redirectTarget.destination);
  }
  const categoryTitle = slug.replace(/-/g, " ");
  const productsAll = await store.products.list();
  const products = productsAll.filter(
    (p) => p.category.toLowerCase() === categoryTitle.toLowerCase()
  );

  return (
    <>
      <QueensCareHeader activePage="products" />
      <main style={{ minHeight: "80vh", background: "#FAF8F5", padding: "40px 5% 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: 28 }}>
            <Link
              href="/shop"
              style={{
                fontSize: 12,
                color: "#64748B",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 12,
              }}
            >
              ← Back to All Formulations
            </Link>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#997B4D", margin: "0 0 6px" }}>
              Therapeutic Category
            </p>
            <h1 style={{ font: "clamp(32px, 4vw, 48px) var(--font-display)", color: "#2A0F3A", margin: "0 0 8px", textTransform: "capitalize" }}>
              {categoryTitle}
            </h1>
            <p style={{ fontSize: 15, color: "#64748B", maxWidth: 640, margin: 0, lineHeight: 1.6 }}>
              Targeted clinical solutions formulated and verified by Queens Care Laboratories for {categoryTitle}.
            </p>
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  name={p.name}
                  price={p.price}
                  mrp={p.mrp}
                  discount={p.discount}
                  image={p.image}
                  category={p.category}
                  stock={p.stock}
                  rating={p.rating}
                  bestSeller={p.bestSeller}
                  newArrival={p.newArrival}
                  featured={p.featured}
                  note={p.description ? p.description.split(".")[0] : ""}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#FFFFFF",
                borderRadius: 8,
                border: "1px solid rgba(42, 15, 58, 0.1)",
              }}
            >
              <p style={{ fontSize: 18, fontWeight: 700, color: "#2A0F3A", margin: "0 0 8px" }}>
                Curating Category Formulations
              </p>
              <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 18px" }}>
                Our clinical team is preparing additional formulations for this category.
              </p>
              <Link
                href="/shop"
                style={{
                  display: "inline-block",
                  padding: "10px 22px",
                  background: "#2A0F3A",
                  color: "#D4AF37",
                  textDecoration: "none",
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                Browse Complete Catalog →
              </Link>
            </div>
          )}
        </div>
      </main>
      <QueensCareFooter />
    </>
  );
}
