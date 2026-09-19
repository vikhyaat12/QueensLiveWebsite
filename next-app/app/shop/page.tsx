"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/commerce/types";
import ProductCard from "@/app/components/ProductCard";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

type SortKey = "name" | "price-asc" | "price-desc" | "newest";

export default function ShopPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCat = searchParams.get("category") || "all";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const productList = (data.products || []) as Product[];
        setProducts(productList);
        const cats = [...new Set(productList.map((p) => p.category).filter(Boolean))];
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (initialQuery) setSearchQuery(initialQuery);
    if (initialCat) setSelectedCategory(initialCat);
  }, [initialQuery, initialCat]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <>
      <QueensCareHeader activePage="products" />
      <main id="main-content" style={{ minHeight: "80vh", background: "#FAF8F5", padding: "40px 5% 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Breadcrumb & Header */}
          <div style={{ marginBottom: 28 }}>
            <Link
              href="/"
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
              ← Return Home
            </Link>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#997B4D", margin: "0 0 6px" }}>
              Pharmaceutical Catalog
            </p>
            <h1 style={{ font: "clamp(32px, 4vw, 48px) var(--font-display)", color: "#2A0F3A", margin: "0 0 8px" }}>
              Explore Formulations
            </h1>
            <p style={{ fontSize: 15, color: "#64748B", maxWidth: 640, margin: 0, lineHeight: 1.6 }}>
              Direct clinical formulations by Queens Care Laboratories — manufactured to pharmaceutical standards with transparent batch verification.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(42, 15, 58, 0.1)",
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
              marginBottom: 32,
              boxShadow: "0 2px 8px rgba(42, 15, 58, 0.03)",
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <input
                type="search"
                placeholder="Search formulations, ingredients, indications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 6,
                  border: "1px solid rgba(42, 15, 58, 0.15)",
                  fontSize: 13.5,
                  outline: "none",
                  background: "#FAF8F5",
                }}
                aria-label="Search formulations"
              />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: "11px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(42, 15, 58, 0.15)",
                  fontSize: 13.5,
                  background: "#FFFFFF",
                  color: "#2A0F3A",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                aria-label="Filter by category"
              >
                <option value="all">All Therapeutic Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                style={{
                  padding: "11px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(42, 15, 58, 0.15)",
                  fontSize: 13.5,
                  background: "#FFFFFF",
                  color: "#2A0F3A",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                aria-label="Sort formulations"
              >
                <option value="newest">Newest Formulations</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748B" }}>
              <p style={{ fontSize: 16 }}>Loading laboratory formulations…</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 24,
                }}
              >
                {filteredProducts.map((p) => (
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

              {!filteredProducts.length && (
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
                    No matching formulations found
                  </p>
                  <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 18px" }}>
                    Try clearing your search query or selecting another category.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    style={{
                      padding: "10px 22px",
                      background: "#2A0F3A",
                      color: "#D4AF37",
                      border: "none",
                      borderRadius: 4,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <QueensCareFooter />
    </>
  );
}