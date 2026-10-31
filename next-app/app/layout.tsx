import type { Metadata } from "next";
import "./globals.css";
import "./premium-animations.css";
import "./premium-homepage.css";
import "./queens-design-system.css";
const fraunces = { variable: "font-fraunces" };
const inter = { variable: "font-inter" };
import { ReticleDev } from "./reticle-dev";
import Providers from "./providers";
import AnalyticsTracker from "./components/AnalyticsTracker";
import AnalyticsBootstrap from "./components/AnalyticsBootstrap";
import AnalyticsConsentBanner from "./components/AnalyticsConsentBanner";
import PremiumAnimations from "./components/PremiumAnimations";
import SitePopup from "./components/SitePopup";
import ChatBot from "./components/ChatBot";
import { getAnalyticsConfig } from "@/lib/analytics/config";
import { pageSettingsStore } from "@/lib/commerce/store-extensions";
import { NavigationProvider } from "./components/navigation/NavigationContext";

export const metadata: Metadata = {
  title: {
    default: "Queens Care Laboratories | Science with Soul",
    template: "%s | Queens Care",
  },
  description:
    "Premium wellness and pharmaceutical care, made with rigorous science and a human touch.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: "Queens Care Laboratories",
    title: "Queens Care Laboratories",
  },
  robots:
    process.env.NODE_ENV === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Server-side analytics config — vendor IDs only, admin-managed.
  const analyticsCfg = await getAnalyticsConfig();
  // Server-side authoritative navigation — eliminates all client-side flashing
  const liveNav = await pageSettingsStore.getLiveHeaderNav();
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      {analyticsCfg.searchConsole.verificationToken ? (
        <head>
          <meta name="google-site-verification" content={analyticsCfg.searchConsole.verificationToken} />
        </head>
      ) : null}
      <body>
        {/* Organization Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Queens Care Laboratories",
          url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          description: "Premium wellness and pharmaceutical care, made with rigorous science and a human touch.",
          sameAs: [],
        }) }} />
        <Providers>
          <NavigationProvider initialNav={liveNav}>
            <AnalyticsTracker />
            <AnalyticsBootstrap />
            <AnalyticsConsentBanner />
            <PremiumAnimations />
            <SitePopup />
            <ChatBot />
            {children}
          </NavigationProvider>
        </Providers>
        {process.env.NODE_ENV === "development" ? <ReticleDev /> : null}
      </body>
    </html>
  );
}