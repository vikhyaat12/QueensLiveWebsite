import type { Metadata } from "next";
import "./globals.css";
import "./premium-animations.css";
import "./premium-homepage.css";
const fraunces = { variable: "font-fraunces" };
const inter = { variable: "font-inter" };
import { ReticleDev } from "./reticle-dev";
import Providers from "./providers";
import AnalyticsTracker from "./components/AnalyticsTracker";
import PremiumAnimations from "./components/PremiumAnimations";
import SitePopup from "./components/SitePopup";
import ChatBot from "./components/ChatBot";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
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
          <AnalyticsTracker />
          <PremiumAnimations />
          <SitePopup />
          <ChatBot />
          {children}
        </Providers>
        {process.env.NODE_ENV === "development" ? <ReticleDev /> : null}
      </body>
    </html>
  );
}