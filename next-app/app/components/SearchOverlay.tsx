"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════
   SEARCH OVERLAY — Premium search with voice support
   Fetches from /api/search, shows product results with images,
   supports Web Speech API for voice input.
   ═══════════════════════════════════════════════════════════════ */

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp?: number;
  category: string;
  stock?: number;
};

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  startVoiceOnOpen?: boolean;
};

export default function SearchOverlay({ open, onClose, startVoiceOnOpen = false }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check voice search support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
    setVoiceSupported(!!SR);
  }, []);

  // Focus input when opened & optionally trigger voice recognition
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
      if (startVoiceOnOpen) {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SR) {
            try {
              startVoice();
            } catch {}
          }
        }, 200);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, startVoiceOnOpen]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setTranscript("");
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => search(value), 300);
  };

  // Voice search
  const startVoice = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      const text = finalTranscript || interimTranscript;
      setTranscript(text);
      if (finalTranscript) {
        setQuery(finalTranscript);
        search(finalTranscript);
      }
    };

    recognition.start();
  }, [search]);

  // Keyboard shortcut
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes searchOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes searchPanelIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes voicePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(42,15,58,0.3); } 50% { box-shadow: 0 0 0 12px rgba(42,15,58,0); } }
      `}</style>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9990,
          animation: "searchOverlayIn 0.2s ease-out",
        }}
      />
      {/* Search Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "#fff",
          zIndex: 9991,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
          animation: "searchPanelIn 0.3s ease-out",
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 24px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span style={{ fontSize: 20, color: "var(--muted)" }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search products, categories…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 16,
              fontFamily: "inherit",
              background: "transparent",
            }}
          />
          {transcript && (
            <span style={{ fontSize: 11, color: "var(--gold)", fontStyle: "italic" }}>
              🎤 {transcript}
            </span>
          )}
          {voiceSupported && (
            <button
              onClick={startVoice}
              disabled={listening}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: listening ? "2px solid var(--purple)" : "1px solid var(--line)",
                background: listening ? "var(--purple)" : "#fff",
                color: listening ? "#fff" : "var(--purple)",
                cursor: "pointer",
                fontSize: 18,
                display: "grid",
                placeItems: "center",
                animation: listening ? "voicePulse 1.5s infinite" : "none",
                flexShrink: 0,
              }}
              aria-label="Voice search"
            >
              🎤
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid var(--line)",
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        {/* Results */}
        <div style={{ padding: "12px 24px 24px" }}>
          {listening && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎤</div>
              Listening… speak a product name or category
            </div>
          )}

          {!listening && query.length >= 2 && loading && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: 13 }}>
              Searching…
            </div>
          )}

          {!listening && query.length >= 2 && !loading && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)" }}>
              <p style={{ fontSize: 15, marginBottom: 4 }}>No results for &ldquo;{query}&rdquo;</p>
              <p style={{ fontSize: 12 }}>Try a different search term or browse our collection.</p>
            </div>
          )}

          {!listening && results.length > 0 && (
            <div>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: 12 }}>
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {results.map((r) => (
                  <Link
                    key={r.id}
                    href={`/products/${r.slug}`}
                    onClick={onClose}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "56px 1fr auto",
                      gap: 14,
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#faf8f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {r.image ? (
                      <img
                        src={r.image}
                        alt={r.name}
                        style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, background: "var(--line)" }}
                      />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 6, background: "var(--line)" }} />
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{r.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>
                        {r.category}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                        ₹{Number(r.price).toLocaleString("en-IN")}
                      </p>
                      {r.mrp && Number(r.mrp) > Number(r.price) && (
                        <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", textDecoration: "line-through" }}>
                          ₹{Number(r.mrp).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {query.length < 2 && !listening && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>
              <p style={{ marginBottom: 8 }}>Start typing to search products…</p>
              {voiceSupported && (
                <p style={{ fontSize: 11 }}>Or tap the 🎤 button for voice search</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


