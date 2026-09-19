"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import VoiceSearchButton, { VoiceState } from "./VoiceSearchButton";
import type { SearchProductResult, SearchResponse } from "@/lib/commerce/types";

const RECENT_SEARCHES_KEY = "qc_recent_searches_v1";

const TRENDING_SEARCHES = [
  "Lumine-C Radiance Serum",
  "Biome Balance Probiotic",
  "Nocturne Magnesium",
  "Sculpture SPF 50",
  "Vitamin C",
  "Digestive care",
  "Sleep & recovery",
  "Paracetamol",
];

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  startVoiceOnOpen?: boolean;
}

export default function SearchOverlay({
  open,
  onClose,
  startVoiceOnOpen = false,
}: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProductResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | undefined>();
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [voiceMessage, setVoiceMessage] = useState<string>("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 8));
        }
      }
    } catch {
      // ignore
    }
  }, [open]);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    try {
      const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== termToRemove);
    setRecentSearches(updated);
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Perform debounced search
  const performSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSuggestions([]);
      setCorrectedQuery(undefined);
      setCategories([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(term)}&type=suggest&limit=6`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("Search request failed");
      const data: SearchResponse = await res.json();

      setResults(data.results || []);
      setSuggestions(data.suggestions || []);
      setCorrectedQuery(data.correctedQuery);
      setCategories(data.categoryFacets || []);
      setTotalCount(data.totalCount || 0);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 250);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const target = query.trim();
    if (!target) return;
    saveRecentSearch(target);
    onClose();
    router.push(`/search?q=${encodeURIComponent(target)}`);
  };

  const handleVoiceResult = (spokenText: string) => {
    setQuery(spokenText);
    performSearch(spokenText);
    saveRecentSearch(spokenText);
  };

  const handleVoiceStateChange = (state: VoiceState, message?: string) => {
    setVoiceState(state);
    setVoiceMessage(message || "");
  };

  // Focus on open & lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const showRecentAndTrending = query.trim().length < 2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Formulations"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 6, 22, 0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "qcFadeIn 0.2s ease-out",
        }}
      />

      {/* Main Container Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "760px",
          margin: "clamp(12px, 4vh, 48px) auto 0",
          maxHeight: "calc(90vh - 48px)",
          background: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 24px 60px -12px rgba(42, 15, 58, 0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(42, 15, 58, 0.1)",
          animation: "qcSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 10000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #EAE6DF",
            gap: "12px",
            background: "#FFFFFF",
          }}
        >
          <span style={{ fontSize: "18px", color: "#6B7280" }}>🔍</span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by formulation, ingredient, symptom, or SKU…"
            aria-label="Search formulations"
            autoComplete="off"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "16px",
              fontFamily: "inherit",
              color: "#2A0F3A",
              background: "transparent",
            }}
          />

          {/* Clear input button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setCorrectedQuery(undefined);
                inputRef.current?.focus();
              }}
              aria-label="Clear search input"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "#F3F4F6",
                color: "#6B7280",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              ✕
            </button>
          )}

          {/* Voice Search Button */}
          <VoiceSearchButton
            onResult={handleVoiceResult}
            onInterim={(t) => setVoiceMessage(`Hearing: "${t}"`)}
            onStateChange={handleVoiceStateChange}
            autoStart={startVoiceOnOpen}
            size={40}
          />

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search modal"
            style={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              background: "#F9FAFB",
              color: "#4B5563",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              transition: "all 0.15s ease",
            }}
          >
            ✕
          </button>
        </form>

        {/* Voice Feedback Banner */}
        {voiceState !== "idle" && (
          <div
            style={{
              padding: "10px 20px",
              background:
                voiceState === "listening"
                  ? "#F3E8FF"
                  : voiceState === "permission_denied" || voiceState === "error"
                  ? "#FEF2F2"
                  : "#F0FDF4",
              borderBottom: "1px solid rgba(42, 15, 58, 0.08)",
              fontSize: "13px",
              fontWeight: 600,
              color:
                voiceState === "listening"
                  ? "#6B21A8"
                  : voiceState === "permission_denied" || voiceState === "error"
                  ? "#991B1B"
                  : "#166534",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{voiceState === "listening" ? "🎙️" : voiceState === "error" ? "⚠️" : "✓"}</span>
            <span>{voiceMessage || "Voice recognition active"}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Loading Indicator */}
          {loading && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#6B7280", fontSize: "14px" }}>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginRight: "8px" }}>
                ⏳
              </span>
              Searching certified laboratory formulations…
            </div>
          )}

          {/* Typo Correction Banner ("Did you mean: X?") */}
          {!loading && correctedQuery && (
            <div
              style={{
                padding: "12px 16px",
                background: "#FEF9C3",
                border: "1px solid #FDE047",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#854D0E",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <span>Did you mean </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuery(correctedQuery);
                    performSearch(correctedQuery);
                  }}
                  style={{
                    fontWeight: 700,
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    color: "#854D0E",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "13px",
                  }}
                >
                  &ldquo;{correctedQuery}&rdquo;
                </button>
                <span>?</span>
              </div>
            </div>
          )}

          {/* INITIAL STATE: Recent Searches & Trending */}
          {showRecentAndTrending && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "11px",
                        color: "#9CA3AF",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          performSearch(term);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 12px",
                          background: "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          borderRadius: "20px",
                          fontSize: "12.5px",
                          color: "#2A0F3A",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>🕒 {term}</span>
                        <span
                          onClick={(e) => removeRecentSearch(term, e)}
                          title="Remove from history"
                          style={{ color: "#9CA3AF", fontWeight: 700, fontSize: "10px" }}
                        >
                          ✕
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#6B7280",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  Popular Inquiries & Formulations
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {TRENDING_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        performSearch(term);
                      }}
                      style={{
                        padding: "7px 14px",
                        background: "#FAF8F5",
                        border: "1px solid #EAE6DF",
                        borderRadius: "20px",
                        fontSize: "12.5px",
                        color: "#2A0F3A",
                        cursor: "pointer",
                        fontWeight: 500,
                        transition: "all 0.15s ease",
                      }}
                    >
                      ✦ {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE SEARCH STATE: Results & Suggestions */}
          {!showRecentAndTrending && !loading && (
            <>
              {/* Category Pills */}
              {categories.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    Categories:
                  </span>
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={`/search?category=${encodeURIComponent(cat.name)}&q=${encodeURIComponent(query)}`}
                      onClick={() => {
                        saveRecentSearch(query);
                        onClose();
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "14px",
                        background: "rgba(42, 15, 58, 0.05)",
                        border: "1px solid rgba(42, 15, 58, 0.15)",
                        fontSize: "12px",
                        color: "#2A0F3A",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      {cat.name} ({cat.count})
                    </Link>
                  ))}
                </div>
              )}

              {/* Product Match Cards */}
              {results.length > 0 ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                      Top Formulation Matches ({totalCount})
                    </span>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#9333EA",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      View all {totalCount} results →
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: "10px" }}>
                    {results.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.slug}`}
                        onClick={() => {
                          saveRecentSearch(query);
                          onClose();
                        }}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "56px 1fr auto",
                          gap: "14px",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid #EAE6DF",
                          textDecoration: "none",
                          color: "inherit",
                          background: "#FFFFFF",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FAF8F5";
                          e.currentTarget.style.borderColor = "#9333EA";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#FFFFFF";
                          e.currentTarget.style.borderColor = "#EAE6DF";
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "8px",
                            overflow: "hidden",
                            background: "#F3F4F6",
                            position: "relative",
                            flexShrink: 0,
                          }}
                        >
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="56px"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#9CA3AF", fontSize: 20 }}>
                              🧪
                            </div>
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#2A0F3A" }}>
                            {item.name}
                          </h4>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "3px", fontSize: "11.5px", color: "#6B7280" }}>
                            <span>{item.category}</span>
                            {item.scarcityMessage && (
                              <>
                                <span>·</span>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: item.stock <= 0 ? "#DC2626" : item.stock <= 5 ? "#B45309" : "#166534",
                                  }}
                                >
                                  {item.scarcityMessage}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price & MRP */}
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: "#2A0F3A", display: "block" }}>
                            ₹{item.price.toLocaleString("en-IN")}
                          </span>
                          {item.mrp && item.mrp > item.price && (
                            <span style={{ fontSize: "11.5px", color: "#9CA3AF", textDecoration: "line-through" }}>
                              ₹{item.mrp.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                /* ZERO RESULTS STATE */
                <div style={{ textAlign: "center", padding: "36px 16px", color: "#6B7280" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔬</div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#2A0F3A" }}>
                    No exact formulations found for &ldquo;{query}&rdquo;
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6B7280", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
                    Try searching for an active pharmaceutical ingredient, therapeutic category, or check spelling.
                  </p>
                  <div style={{ marginTop: "18px", display: "flex", justifyContent: "center", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      style={{
                        padding: "8px 16px",
                        background: "#2A0F3A",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Clear &amp; Try Again
                    </button>
                    <Link
                      href="/shop"
                      onClick={onClose}
                      style={{
                        padding: "8px 16px",
                        background: "#F3F4F6",
                        color: "#2A0F3A",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      Browse Full Catalog →
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            padding: "12px 24px",
            background: "#FAF8F5",
            borderTop: "1px solid #EAE6DF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11.5px",
            color: "#6B7280",
          }}
        >
          <span>
            Press <kbd style={{ padding: "2px 6px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: "4px", fontSize: "10px" }}>↵ Enter</kbd> to view full results
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              background: "none",
              border: "none",
              color: "#2A0F3A",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Search &ldquo;{query || "..."}&rdquo; →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes qcFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes qcSlideDown {
          from { opacity: 0; transform: translateY(-16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
