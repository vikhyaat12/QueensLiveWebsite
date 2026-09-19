"use client";

import { useState } from "react";

type Highlight = { id: string; text: string; icon?: string };

const INITIAL_SHOW = 6;

export default function HighlightsList({ highlights }: { highlights: Highlight[] }) {
  const [expanded, setExpanded] = useState(false);
  const showAll = expanded || highlights.length <= INITIAL_SHOW;
  const visible = showAll ? highlights : highlights.slice(0, INITIAL_SHOW);
  const remaining = highlights.length - INITIAL_SHOW;

  return (
    <div style={{ padding: "14px 18px", background: "#fbf9f6", border: "1px solid var(--line)", borderRadius: 6 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#2A0F3A", margin: "0 0 10px" }}>
        Key Formulation Highlights
      </h3>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "8px 24px",
        }}
      >
        {visible.map((h) => (
          <li
            key={h.id}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              fontSize: 13,
              lineHeight: 1.5,
              color: "#2A0F3A",
            }}
          >
            <span style={{ color: "var(--purple)", fontWeight: 700, flexShrink: 0 }}>{h.icon || "✓"}</span>
            <span>{h.text}</span>
          </li>
        ))}
      </ul>
      {!showAll && remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            marginTop: 10,
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid #D4AF37",
            borderRadius: 4,
            color: "#2A0F3A",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: ".02em",
          }}
        >
          Show {remaining} more highlight{remaining !== 1 ? "s" : ""} ▾
        </button>
      )}
      {expanded && highlights.length > INITIAL_SHOW && (
        <button
          onClick={() => setExpanded(false)}
          style={{
            marginTop: 10,
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid var(--line)",
            borderRadius: 4,
            color: "var(--muted)",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Show less ▴
        </button>
      )}
    </div>
  );
}
