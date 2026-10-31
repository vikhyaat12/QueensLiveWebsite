/**
 * Queens Care — Preview page (branch only, NOT the live homepage)
 *
 * Purpose: let the user preview the Crown Q Stage hero on the
 * cinematic-luxury-home branch without changing the existing homepage
 * (next-app/app/page.tsx) or any commerce logic.
 *
 * To see the logo and bottle images, copy the user-supplied originals to:
 * - public/images/hero/queens-care-logo.png
 * - public/images/hero/liko-q-bottle.png
 * Until then the hero will render with alt text in place of those images.
 *
 * Headline/subtitle below are taken from the existing site metadata:
 * "Queens Care Laboratories | Science with Soul" and
 * "Premium wellness and pharmaceutical care, made with rigorous science
 * and a human touch." No new claim is added here.
 */

import QueensCrownQHero from "@/app/components/queens/QueensCrownQHero";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function QueensPreviewPage() {
  return (
    <QueensCrownQHero
      headline="Science with Soul"
      subtitle="Premium wellness and pharmaceutical care, made with rigorous science and a human touch."
      primaryCta={{ label: "Explore Products", href: "/shop" }}
      secondaryCta={{ label: "Discover Our Story", href: "/about" }}
      productHref="/shop"
    />
  );
}
