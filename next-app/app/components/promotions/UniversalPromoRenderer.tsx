"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import UniversalTicker from "./UniversalTicker";
import UniversalMediaBlock from "./UniversalMediaBlock";
import UniversalGamificationBlock from "./UniversalGamificationBlock";
import UniversalAffiliateBlock from "./UniversalAffiliateBlock";
import type {
  PromoComponent,
  PromoSlot,
  PromoRenderContext,
  DeviceTarget,
} from "@/lib/commerce/promotions-types";

interface UniversalPromoRendererProps {
  slot: PromoSlot | string;
  context?: PromoRenderContext;
  previewPromo?: PromoComponent; // Admin preview override
  fallback?: React.ReactNode;    // Non-breaking fallback
  className?: string;
  style?: React.CSSProperties;
}

export default function UniversalPromoRenderer({
  slot,
  context,
  previewPromo,
  fallback = null,
  className = "",
  style,
}: UniversalPromoRendererProps) {
  const [promotions, setPromotions] = useState<PromoComponent[]>([]);
  const [loading, setLoading] = useState<boolean>(!previewPromo);
  const trackedImpressionsRef = useRef<Set<string>>(new Set());

  // Determine client device type
  const [device, setDevice] = useState<DeviceTarget>("desktop");

  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      if (width < 640) setDevice("mobile");
      else if (width < 1024) setDevice("tablet");
      else setDevice("desktop");
    };
    updateDevice();
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  // Track impression
  const trackImpression = useCallback((promoId: string) => {
    if (trackedImpressionsRef.current.has(promoId)) return;
    trackedImpressionsRef.current.add(promoId);

    try {
      fetch("/api/promotions/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotionId: promoId, type: "impression" }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, []);

  // Track click
  const trackClick = useCallback((promoId: string) => {
    try {
      fetch("/api/promotions/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotionId: promoId, type: "click" }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, []);

  // Fetch promotions for slot
  useEffect(() => {
    // If admin preview is provided, use it directly
    if (previewPromo) {
      setPromotions([previewPromo]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadSlotPromotions() {
      try {
        const params = new URLSearchParams();
        params.set("slot", slot);
        if (context?.pageType) params.set("pageType", context.pageType);
        if (context?.route) params.set("route", context.route);
        if (device) params.set("device", device);
        if (context?.cartSubtotal !== undefined) {
          params.set("cartSubtotal", String(context.cartSubtotal));
        }

        const res = await fetch(`/api/promotions?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load promotions");
        const data = await res.json();

        if (isMounted) {
          const list: PromoComponent[] = data.promotions || [];
          setPromotions(list);
          list.forEach((p) => trackImpression(p.id));
        }
      } catch {
        if (isMounted) setPromotions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSlotPromotions();

    return () => {
      isMounted = false;
    };
  }, [slot, context?.pageType, context?.route, context?.cartSubtotal, device, previewPromo, trackImpression]);

  // If loading or no active promotions found, render fallback
  if (loading) return null;
  if (!promotions || promotions.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div
      className={`universal-promo-slot universal-promo-slot-${slot} ${className}`}
      data-slot={slot}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        ...style,
      }}
    >
      {promotions.map((promo) => {
        switch (promo.type) {
          case "ticker":
            return (
              <UniversalTicker
                key={promo.id}
                promo={promo}
                onTrackClick={trackClick}
              />
            );
          case "media_block":
            return (
              <UniversalMediaBlock
                key={promo.id}
                promo={promo}
                onTrackClick={trackClick}
              />
            );
          case "gamification":
            return (
              <UniversalGamificationBlock
                key={promo.id}
                promo={promo}
                onTrackClick={trackClick}
              />
            );
          case "affiliate_block":
            return (
              <UniversalAffiliateBlock
                key={promo.id}
                promo={promo}
                onTrackClick={trackClick}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
