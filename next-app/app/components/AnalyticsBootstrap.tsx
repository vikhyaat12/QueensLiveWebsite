"use client";

import { useEffect } from "react";
import { QueensCareAnalytics } from "@/lib/analytics/queenscare-analytics";

interface PublicConfig {
  enabled: boolean;
  environment: string;
  trackingMode: "all_visitors" | "consent_based" | "privacy_mode";
  ga4: { enabled: boolean; measurementId: string };
  meta: { enabled: boolean; pixelId: string };
  gtm: { enabled: boolean; containerId: string };
  clarity: { enabled: boolean; projectId: string };
}

/**
 * AnalyticsBootstrap — mounts once in the root layout.
 * 1. Fetches the public (vendor-IDs-only) analytics config.
 * 2. Starts QueensCareAnalytics (loads vendor scripts when allowed).
 * 3. Bridges the legacy window.__qc_track_* helpers onto the unified layer
 *    so existing component call-sites keep working.
 */
export default function AnalyticsBootstrap() {
  useEffect(() => {
    // Bridge legacy helpers IMMEDIATELY so no early events are lost,
    // then start vendor loading once config arrives.
    bridgeLegacyHelpers();
    let cancelled = false;
    fetch("/api/analytics/config")
      .then((r) => r.json())
      .then((data: { config?: PublicConfig }) => {
        if (cancelled || !data.config) return;
        QueensCareAnalytics.start(data.config);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Bridge existing window.__qc_track_* call-sites to the unified layer.
  // IMPORTANT: chain to (not replace) AnalyticsTracker's recorders so the
  // internal analytics DB keeps receiving events; we ADD vendor forwarding.
  function bridgeLegacyHelpers() {
    const w = window as unknown as Record<string, unknown>;
    const map: Array<[string, string, (args: unknown[]) => Record<string, unknown>]> = [
      ["__qc_track_product_view", "product_view", ([slug, name]) => ({ productSlug: slug, product: name, item_id: slug, item_name: name })],
      ["__qc_track_add_to_cart", "add_to_cart", ([slug, name, value]) => ({ productSlug: slug, product: name, value, item_id: slug, item_name: name, currency: "INR" })],
      ["__qc_track_remove_from_cart", "remove_from_cart", ([slug, name]) => ({ productSlug: slug, product: name, item_id: slug, item_name: name })],
      ["__qc_track_cart_view", "cart_view", () => ({})],
      ["__qc_track_checkout_start", "checkout_start", () => ({})],
      ["__qc_track_order_placed", "order_placed", ([orderId, value, extra]) => ({ transaction_id: orderId, orderId, value, currency: "INR", ...((extra && typeof extra === "object") ? extra as Record<string, unknown> : {}) })],
      ["__qc_track_pdf_download", "pdf_download", ([slug, name]) => ({ productSlug: slug, product: name })],
      ["__qc_track_search", "search", ([query]) => ({ search_string: query })],
      ["__qc_track_cta_click", "cta_click", ([label, page]) => ({ ctaLabel: label, page })],
    ];
    for (const [key, eventName, build] of map) {
      const existing = w[key] as ((...args: unknown[]) => void) | undefined;
      if ((w as Record<string, unknown>)[`__qc_bridged_${key}`]) continue; // idempotent bridge
      (w as Record<string, unknown>)[`__qc_bridged_${key}`] = true;
      (w as Record<string, unknown>)[key] = (...args: unknown[]) => {
        try { existing?.(...args); } catch {} // internal recorder (AnalyticsTracker)
        QueensCareAnalytics.track(eventName, build(args)); // vendor adapters
      };
    }
    const prevTrack = w.__qc_track as ((name: string, payload?: Record<string, unknown>) => void) | undefined;
    if (!(w as Record<string, unknown>).__qc_bridged___qc_track) {
      (w as Record<string, unknown>).__qc_bridged___qc_track = true;
      (w as Record<string, unknown>).__qc_track = (name: string, payload?: Record<string, unknown>) => {
        try { prevTrack?.(name, payload); } catch {}
        QueensCareAnalytics.track(name, payload);
      };
    }
  }

  return null;
}
