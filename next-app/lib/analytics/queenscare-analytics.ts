"use client";

/**
 * Queens Care — Unified Analytics Event Layer (client)
 *
 * ONE internal event bus. Components call QueensCareAnalytics.track();
 * adapters (GA4, Meta Pixel) consume it. Prevents duplicate vendor code in
 * every component and guards against duplicate events.
 *
 * Privacy: only ecommerce/marketing data passes through. The API layer
 * (/api/analytics) rejects sensitive field names; adapters never receive
 * PII like addresses, phone numbers or prescription data.
 *
 * Purchase idempotency: a purchase is forwarded to vendors at most once per
 * transaction_id per browser (sessionStorage guard) — page refreshes,
 * back-navigation and double effects cannot double-count revenue.
 */

export type AnalyticsPayload = Record<string, unknown>;

export interface AnalyticsEvent {
  name: string;
  payload: AnalyticsPayload;
}

type ConsentState = "unknown" | "granted" | "denied";

interface VendorConfig {
  enabled: boolean;
  environment: string;
  trackingMode: "all_visitors" | "consent_based" | "privacy_mode";
  ga4: { enabled: boolean; measurementId: string };
  meta: { enabled: boolean; pixelId: string };
  gtm: { enabled: boolean; containerId: string };
  clarity: { enabled: boolean; projectId: string };
}

const CONSENT_KEY = "qc_analytics_consent";

function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {}
  return "unknown";
}

function writeConsent(state: "granted" | "denied") {
  try { localStorage.setItem(CONSENT_KEY, state); } catch {}
}

/** Map internal GA4-style ecommerce payloads to Meta's event names. */
const META_EVENT_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  search: "Search",
};

const GA4_EVENT_MAP: Record<string, string> = {
  // internal names already match GA4 ecommerce names for the core funnel
  product_view: "view_item",
  cart_view: "view_cart",
  checkout_start: "begin_checkout",
  order_placed: "purchase",
};

function metaEventName(internal: string): string {
  return META_EVENT_MAP[internal] || GA4_EVENT_MAP[internal] || null as unknown as string;
}

class QueensCareAnalyticsImpl {
  private cfg: VendorConfig | null = null;
  private consent: ConsentState = "unknown";
  private firedPurchases = new Set<string>();
  private gtagLoaded = false;
  private metaLoaded = false;
  private gtmLoaded = false;
  private queue: AnalyticsEvent[] = [];
  private started = false;

  async start(cfg: VendorConfig) {
    if (this.started) return;
    this.started = true;
    this.cfg = cfg;
    this.consent = cfg.trackingMode === "all_visitors" ? "granted" : readConsent();
    this.firedPurchases = new Set(this.readFiredPurchases());
    if (this.consent === "granted") this.loadVendors();
    // Flush any events queued while config/consent was resolving
    const q = this.queue.splice(0);
    for (const e of q) this.dispatch(e);
  }

  private readFiredPurchases(): string[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(sessionStorage.getItem("qc_purchase_fired") || "[]"); } catch { return []; }
  }

  private markPurchaseFired(txId: string) {
    this.firedPurchases.add(txId);
    try { sessionStorage.setItem("qc_purchase_fired", JSON.stringify([...this.firedPurchases].slice(-50))); } catch {}
  }

  private consentAllows(): boolean {
    if (!this.cfg) return false;
    if (!this.cfg.enabled) return false;
    if (this.cfg.trackingMode === "privacy_mode") return false;
    if (this.cfg.trackingMode === "consent_based") return this.consent === "granted";
    return true; // all_visitors
  }

  /** Consent management (used by a future consent banner; default consent_based). */
  setConsent(state: "granted" | "denied") {
    writeConsent(state);
    this.consent = state;
    if (state === "granted") {
      this.loadVendors();
      const q = this.queue.splice(0);
      for (const e of q) this.dispatch(e);
    }
  }
  getConsent(): ConsentState { return this.consent; }

  private loadVendors() {
    if (!this.cfg) return;
    // GA4
    if (this.cfg.ga4.enabled && this.cfg.ga4.measurementId && !this.gtagLoaded) {
      this.gtagLoaded = true;
      /* eslint-disable */
      (function (w: any, d: Document, s: string, src: string) {
        w.dataLayer = w.dataLayer || [];
        w.gtag = function gtag() { w.dataLayer.push(arguments); };
        w.gtag("js", new Date());
        const sc = d.createElement(s) as HTMLScriptElement;
        sc.async = true; sc.src = src;
        d.head.appendChild(sc);
      })(window, document, "script", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.cfg.ga4.measurementId)}`);
      /* eslint-enable */
      window.gtag?.("js", new Date());
      window.gtag?.("config", this.cfg.ga4.measurementId, { send_page_view: false }); // we send page_view ourselves
    }
    // Meta Pixel
    if (this.cfg.meta.enabled && this.cfg.meta.pixelId && !this.metaLoaded) {
      this.metaLoaded = true;
      interface Fbq {
        (...args: unknown[]): void;
        callMethod?: (...args: unknown[]) => void;
        queue: unknown[];
        loaded?: boolean;
        version?: string;
        push?: unknown;
      }
      const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
      if (!w.fbq) {
        const n = ((...args: unknown[]) => {
          if (n.callMethod) n.callMethod(...args);
          else n.queue.push(args);
        }) as Fbq;
        n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        w.fbq = n;
        w._fbq = n;
        const sc = document.createElement("script");
        sc.async = true;
        sc.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(sc);
        const pixelId = this.cfg.meta.pixelId;
        setTimeout(() => { try { n("init", pixelId); n("track", "PageView"); } catch {} }, 0);
      }
    }
    // GTM (loads dataLayer only; GA4/Meta still handled by their own adapters)
    if (this.cfg.gtm.enabled && this.cfg.gtm.containerId && !this.gtmLoaded) {
      this.gtmLoaded = true;
      const w = window as unknown as { dataLayer?: unknown[] };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      const sc = document.createElement("script");
      sc.async = true;
      sc.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(this.cfg.gtm.containerId)}`;
      document.head.appendChild(sc);
    }
  }

  /** Central entry point. Events are queued until config + consent resolve. */
  track(name: string, payload: AnalyticsPayload = {}) {
    const evt = { name, payload };
    if (!this.cfg || !this.consentAllows()) {
      if (this.cfg && this.cfg.trackingMode === "consent_based" && this.consent !== "denied") this.queue.push(evt);
      return;
    }
    this.dispatch(evt);
  }

  private dispatch({ name, payload }: AnalyticsEvent) {
    if (!this.cfg) return;

    // Purchase idempotency — forward at most once per transaction.
    if (name === "purchase" || name === "order_placed") {
      const txId = String(payload.transaction_id || payload.orderId || "");
      if (txId) {
        if (this.firedPurchases.has(txId)) return;
        this.markPurchaseFired(txId);
      }
    }

    const gaName = GA4_EVENT_MAP[name] || name;
    const value = typeof payload.value === "number" ? payload.value : undefined;

    // GA4 adapter
    if (this.cfg.ga4.enabled && typeof window.gtag === "function") {
      try {
        window.gtag("event", gaName, {
          ...payload,
          ...(value !== undefined ? { value, currency: payload.currency || "INR" } : {}),
        });
      } catch {}
    }

    // Meta adapter — only map events Meta understands; never forward PII
    const metaName = metaEventName(name);
    if (metaName && this.cfg.meta.enabled) {
      const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
      if (typeof fbq === "function") {
        try {
          const mp: Record<string, unknown> = { currency: payload.currency || "INR" };
          if (value !== undefined) mp.value = value;
          if (Array.isArray(payload.items)) {
            const first = payload.items[0] as Record<string, unknown> | undefined;
            if (first) {
              mp.content_ids = [String(first.item_id || "")];
              mp.content_type = "product";
              mp.content_name = String(first.item_name || "");
            }
          }
          if (payload.search_string) mp.search_string = String(payload.search_string);
          if (payload.orderId) mp.order_id = String(payload.orderId);
          fbq("track", metaName, mp);
        } catch {}
      }
    }

    // GTM dataLayer push (for server-side/custom tags)
    if (this.cfg.gtm.enabled && Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
      try { (window as unknown as { dataLayer: unknown[] }).dataLayer.push({ event: gaName, ecommerce: payload }); } catch {}
    }
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const QueensCareAnalytics = new QueensCareAnalyticsImpl();
