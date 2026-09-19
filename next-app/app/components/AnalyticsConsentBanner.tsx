"use client";

import { useEffect, useState } from "react";
import { QueensCareAnalytics } from "@/lib/analytics/queenscare-analytics";

/**
 * Minimal, premium consent banner. Renders ONLY when:
 *  - analytics config is enabled
 *  - trackingMode === "consent_based"
 *  - visitor has not chosen yet
 * The banner is informational, keyboard accessible, and never blocks the
 * page (fixed, small, dismissible). No vendor scripts load before choice.
 */
export default function AnalyticsConsentBanner() {
  const [state, setState] = useState<"loading" | "show" | "hide">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analytics/config")
      .then((r) => r.json())
      .then((data: { config?: { enabled: boolean; trackingMode: string } }) => {
        if (cancelled) return;
        const cfg = data.config;
        if (!cfg || !cfg.enabled || cfg.trackingMode !== "consent_based") { setState("hide"); return; }
        const consent = QueensCareAnalytics.getConsent();
        setState(consent === "unknown" ? "show" : "hide");
      })
      .catch(() => { if (!cancelled) setState("hide"); });
    return () => { cancelled = true; };
  }, []);

  if (state !== "show") return null;

  const choose = (v: "granted" | "denied") => {
    QueensCareAnalytics.setConsent(v);
    setState("hide");
  };

  return (
    <div
      role="dialog"
      aria-label="Privacy preferences"
      style={{
        position: "fixed", bottom: 16, left: 16, right: "auto", zIndex: 9990,
        maxWidth: 360, background: "#fff", border: "1px solid #E2E8F0",
        borderRadius: 12, boxShadow: "0 12px 40px rgba(42,15,58,.18)",
        padding: "16px 18px", fontFamily: "var(--font-inter, system-ui)",
      }}
    >
      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#1E1638" }}>Your privacy matters</p>
      <p style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.55, color: "#52525B" }}>
        We use cookies to understand how our store is used and to improve it. No personal or health information is ever shared.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => choose("granted")}
          style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "none", background: "#1E1638", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Accept
        </button>
        <button
          onClick={() => choose("denied")}
          style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#1E1638", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
