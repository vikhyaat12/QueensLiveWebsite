"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";
import ProductCard from "@/app/components/ProductCard";
import VoiceSearchButton from "@/app/components/VoiceSearchButton";
import UniversalPromoRenderer from "@/app/components/promotions/UniversalPromoRenderer";
import type { SearchResponse, SearchProductResult, SearchFacetItem } from "@/lib/commerce/types";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialCat = searchParams.get("category") || "all";
  const initialSort = searchParams.get("sort") || "relevance";
  const initialInStock = searchParams.get("inStock") === "true";

  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [inStockOnly, setInStockOnly] = useState<boolean>(initialInStock);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [results, setResults] = useState<SearchProductResult[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [categoryFacets, setCategoryFacets] = useState<SearchFacetItem[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | undefined>();
  const [popularProducts, setPopularProducts] = useState<SearchProductResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state when URL query params change
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setSearchInput(q);
    setSelectedCategory(searchParams.get("category") || "all");
    setSortBy(searchParams.get("sort") || "relevance");
    setInStockOnly(searchParams.get("inStock") === "true");
    setCurrentPage(Number(searchParams.get("page") || 1));
  }, [searchParams]);

  // Execute search API request
  const fetchSearchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("type", "full");
      if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
      if (inStockOnly) params.set("inStock", "true");
      if (sortBy) params.set("sort", sortBy);
      params.set("page", String(currentPage));
      params.set("limit", "16");

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search service encountered an error.");
      const data: SearchResponse = await res.json();

      setResults(data.results || []);
      setTotalCount(data.totalCount || 0);
      setCategoryFacets(data.categoryFacets || []);
      setCorrectedQuery(data.correctedQuery);

      // Load popular formulations for empty state if needed
      if ((data.results || []).length === 0) {
        const fallbackRes = await fetch("/api/search?limit=4&sort=rating_desc");
        if (fallbackRes.ok) {
          const fallbackData: SearchResponse = await fallbackRes.json();
          setPopularProducts(fallbackData.results || []);
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load search results.");
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, inStockOnly, sortBy, currentPage]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // URL updating helper
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "" || v === "all") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchInput.trim() });
  };

  const handleVoiceInput = (spoken: string) => {
    setSearchInput(spoken);
    updateUrl({ q: spoken.trim() });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FAF8F5" }}>
      <QueensCareHeader activePage="products" />

      <main style={{ flex: 1, maxWidth: "1340px", width: "100%", margin: "0 auto", padding: "32px 24px 64px", boxSizing: "border-box" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#6B7280", marginBottom: 20 }}>
          <Link href="/" style={{ color: "#6B7280", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: "#6B7280", textDecoration: "none" }}>Catalog</Link>
          <span>/</span>
          <span style={{ color: "#2A0F3A", fontWeight: 600 }}>
            {query ? `Search: “${query}”` : "All Formulations"}
          </span>
        </div>

        {/* Universal Search Top Slot */}
        <div style={{ marginBottom: 20 }}>
          <UniversalPromoRenderer slot="search_top" context={{ pageType: "search", route: "/search" }} />
        </div>

        {/* Search Header Bar with Input & Voice */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: "20px 24px",
            boxShadow: "0 2px 12px rgba(42, 15, 58, 0.04)",
            border: "1px solid #EAE6DF",
            marginBottom: 24,
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: "1 1 320px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                padding: "8px 14px",
                background: "#F9FAFB",
              }}
            >
              <span style={{ fontSize: 16, color: "#6B7280" }}>🔍</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search formulations, active ingredients, clinical categories, or SKU…"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "transparent",
                  color: "#2A0F3A",
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    updateUrl({ q: "" });
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              )}
              <VoiceSearchButton onResult={handleVoiceInput} size={36} />
            </div>

            <button
              type="submit"
              style={{
                padding: "11px 22px",
                background: "#2A0F3A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}
            >
              Search Formulations
            </button>
          </form>

          {/* Result Count and Applied Terms */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <h1 style={{ font: "20px var(--font-display, Georgia, serif)", color: "#2A0F3A", margin: 0 }}>
              {query ? (
                <>
                  Showing <b>{totalCount}</b> formulation{totalCount !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                </>
              ) : (
                <>Browse All Clinical Formulations ({totalCount})</>
              )}
            </h1>

            {/* Clear query button */}
            {query && (
              <button
                type="button"
                onClick={() => updateUrl({ q: "", category: "all" })}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9333EA",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Typo Correction Banner ("Did you mean: X?") */}
        {correctedQuery && (
          <div
            style={{
              padding: "14px 20px",
              background: "#FEF9C3",
              border: "1px solid #FDE047",
              borderRadius: 8,
              fontSize: 14,
              color: "#854D0E",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <span>Did you mean </span>
              <button
                type="button"
                onClick={() => updateUrl({ q: correctedQuery })}
                style={{
                  fontWeight: 700,
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  color: "#854D0E",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 14,
                }}
              >
                &ldquo;{correctedQuery}&rdquo;
              </button>
              <span>? Showing closest verified results.</span>
            </div>
          </div>
        )}

        {/* Content Layout: Filter Sidebar + Results Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28, alignItems: "start" }} className="qc-search-layout">
          {/* Filter Sidebar */}
          <aside
            style={{
              background: "#FFFFFF",
              border: "1px solid #EAE6DF",
              borderRadius: 12,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {/* Sort Selector */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => updateUrl({ sort: e.target.value })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  fontSize: 13,
                  color: "#2A0F3A",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="newest">Newest Formulations</option>
              </select>
            </div>

            {/* In-Stock Filter */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#2A0F3A",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => updateUrl({ inStock: e.target.checked ? "true" : null })}
                  style={{ width: 16, height: 16, accentColor: "#2A0F3A" }}
                />
                In Stock &amp; Pre-Order Only
              </label>
            </div>

            {/* Categories Facet */}
            {categoryFacets.length > 0 && (
              <div>
                <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                  Categories
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => updateUrl({ category: "all" })}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      borderRadius: 6,
                      background: selectedCategory === "all" ? "#F3E8FF" : "transparent",
                      color: selectedCategory === "all" ? "#6B21A8" : "#4B5563",
                      border: "none",
                      fontSize: 12.5,
                      fontWeight: selectedCategory === "all" ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>All Categories</span>
                    <span>{totalCount}</span>
                  </button>

                  {categoryFacets.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => updateUrl({ category: cat.name })}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: selectedCategory.toLowerCase() === cat.name.toLowerCase() ? "#F3E8FF" : "transparent",
                        color: selectedCategory.toLowerCase() === cat.name.toLowerCase() ? "#6B21A8" : "#4B5563",
                        border: "none",
                        fontSize: 12.5,
                        fontWeight: selectedCategory.toLowerCase() === cat.name.toLowerCase() ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span>{cat.name}</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Results Area */}
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#6B7280" }}>
                <span style={{ display: "inline-block", fontSize: 24, animation: "spin 1s linear infinite", marginBottom: 12 }}>
                  ⏳
                </span>
                <p style={{ margin: 0, fontSize: 14 }}>Retrieving laboratory verified formulations…</p>
              </div>
            ) : error ? (
              <div style={{ padding: 24, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, color: "#991B1B" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
                <button
                  type="button"
                  onClick={() => fetchSearchResults()}
                  style={{ marginTop: 12, padding: "6px 14px", background: "#991B1B", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                >
                  Retry Search
                </button>
              </div>
            ) : results.length > 0 ? (
              /* PRODUCT CARDS GRID */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 20,
                }}
              >
                {results.map((p) => (
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
                    rating={p.rating || 4.9}
                    reviewsCount={p.reviewCount || 24}
                    benefits={p.highlights}
                    note={p.scarcityMessage}
                  />
                ))}
              </div>
            ) : (
              /* RICH ZERO-RESULTS EMPTY STATE */
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #EAE6DF",
                  borderRadius: 12,
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>🔬</div>
                <h3 style={{ font: "22px var(--font-display, Georgia, serif)", color: "#2A0F3A", margin: "0 0 8px" }}>
                  We couldn&rsquo;t find exact formulations matching &ldquo;{query}&rdquo;
                </h3>
                <p style={{ color: "#6B7280", fontSize: 14, maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  Our formulations are indexed by scientific compound, brand, active ingredients, and therapeutic applications. Try broadening your terms or explore our core clinical categories below.
                </p>

                {/* Helpful Alternatives */}
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
                  <button
                    type="button"
                    onClick={() => updateUrl({ q: "", category: "all" })}
                    style={{
                      padding: "10px 20px",
                      background: "#2A0F3A",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    View Complete Catalog
                  </button>
                  <Link
                    href="/quiz"
                    style={{
                      padding: "10px 20px",
                      background: "#FAF8F5",
                      color: "#2A0F3A",
                      border: "1px solid #EAE6DF",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    Take Health Diagnostic Quiz →
                  </Link>
                </div>

                {/* Popular Formulations Fallback */}
                {popularProducts.length > 0 && (
                  <div style={{ borderTop: "1px solid #EAE6DF", paddingTop: 32, textAlign: "left" }}>
                    <h4 style={{ font: "16px var(--font-display)", color: "#2A0F3A", margin: "0 0 16px" }}>
                      Recommended Certified Formulations
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {popularProducts.map((p) => (
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
                          rating={p.rating || 4.9}
                          reviewsCount={p.reviewCount || 24}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Universal Search Bottom Slot */}
        <div style={{ marginTop: 32 }}>
          <UniversalPromoRenderer slot="search_bottom" context={{ pageType: "search", route: "/search" }} />
        </div>
      </main>

      <QueensCareFooter />

      <style>{`
        @media (max-width: 860px) {
          .qc-search-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#FAF8F5", color: "#2A0F3A" }}>
          <p>Loading Queens Care Search…</p>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
