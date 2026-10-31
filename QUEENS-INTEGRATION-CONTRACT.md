# Queens Care — Integration Contract (existing admin, later)

## Status
- Workspace implementation pack only. No GitHub branch was created after
  the user declined that approval on 2026-10-31, and no live change was made.
- Nothing here creates a new admin panel, replaces authentication, or
  creates a duplicate product/content database.

## What was inspected (existing app, main branch)
- `next-app/app/page.tsx` → `QueensCareExperience`
- `next-app/app/components/homepage/SectionRenderer.tsx` — sections:
  hero, collection, science, trust, ritual, consult, faq, newsletter,
  plus banner and marquee
- `next-app/app/components/CinematicHeroStage.tsx` — existing cinematic
  hero with a 5-phase entrance, Three.js particles and a 3D product visual.
  Doctor image default: `/images/hero/dr-queens-hd.webp`
  Product image default: `/images/hero/likoq-hero-staged.webp`
- `next-app/app/components/DoctorCharacter.tsx` — cute doctor character
  (SVG fallback + optional Lottie), kept unchanged
- `next-app/app/components/FemaleDoctorHeroVisual.tsx`,
  `DoctorCinematicScene.tsx`, `Hero3DProductVisual.tsx`,
  `ProductCard.tsx`, `QueensCareHeader.tsx`, `QueensCareFooter.tsx`
- `next-app/package.json` — Next.js, React, TypeScript, Tailwind,
  Three.js, GSAP, lottie-web. No React Three Fiber / Drei is installed;
  do not add them unless a genuine 3D model need justifies it.
- Data already exists: `/api/homepage`, `/api/settings`, `/api/products`,
  `/api/blog`, `/api/testimonials`, `/api/social-links`

## Files in this pack
- `next-app/app/queens-design-system.css`
  Official palette: Deep Purple #2A0F3A, Premium Gold #C19A6B,
  Pure White #FFFFFF, Charcoal #333333, plus ivory, cream, lavender,
  champagne gold. Typography, spacing, buttons (normal/hover/active/
  focus/disabled/loading), cards, inputs, section rhythm, reduced motion.
- `next-app/lib/queens-homepage-content.ts`
  Types for hero, character, showcase, homepage sections and global
  settings, plus `toHomepageSection()` for the existing `/api/homepage`
  shape: { id, type, active, visible, sort, content (JSON string) }.
- `next-app/app/components/queens/QueensCinematicHero.tsx`
  Data-driven hero. 8-step entrance, desktop-only gentle parallax,
  no WebGL dependency, static fallback, Skip animation, reduced motion.
  Character and product images are props — original images only.
- `next-app/app/components/queens/QueensProductCard.tsx`
  Data-driven card. Real price, real MRP discount, real stock, genuine
  rating only when supplied. Add to Cart uses the page's existing handler.

## How to test locally (no live change)
1. Copy the three `next-app/` files into the same paths in the local project.
2. In `next-app/app/layout.tsx`, after `import "./premium-homepage.css";`,
   add `import "./queens-design-system.css";`.
3. Wire `QueensCinematicHero` from the existing hero section content
   (headline, subtitle, description, character image, hero product image,
   CTAs) instead of hardcoding copy. Keep the existing
   `CinematicHeroStage` as the fallback until this hero is approved.
4. Wire `QueensProductCard` from `/api/products` data, passing the
   existing add-to-cart handler.
5. Run, in `next-app/`:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm run build`
   - Manual homepage checks at 360, 390, 430, 768, 1024, 1440 and 1920px:
     no horizontal overflow, no overlapping hero elements, CTAs work,
     Add to Cart works, checkout and login are unchanged.

## Admin integration (later, no rewrite)
- Hero headline, subtitle, description, background, character image/model,
  hero product, product media, CTAs, animation on/off and intensity,
  display order and mobile media → `QueensHeroContent` → `/api/homepage`
  hero section content.
- Character asset, position, scale, visibility and animation state →
  `QueensCharacterContent`.
- Featured products, order, image selection, visibility and CTA →
  existing product data + homepage showcase section content.
- Section enable/disable, titles, subtitles, images, videos, background,
  content, order and CTAs → `QueensSectionContent`.
- Brand colours, typography, logo, navigation, footer, announcement bar
  and social links → `QueensGlobalSettings` → existing `/api/settings`.

## Hard rules preserved
- Preserve the original bottle, label, logo, product name, colours and
  packaging proportions. Never regenerate or distort it.
- Preserve the existing cute female doctor character. Never present the
  fictional character as a real doctor or medical adviser, and never add
  fake credentials, medical claims, WHO-GMP/ISO certifications, clinical
  evidence or guaranteed results.
- Preserve existing pricing, GST, inventory, prescription workflows,
  checkout restrictions, auth, security and deployment compatibility.
- No placeholder interactions. A button that does nothing must not ship.
- Performance targets to measure, not guarantee: LCP ≤ 2.5s, INP ≤ 200ms,
  CLS ≤ 0.1. Lazy-load below-the-fold content and heavy 3D; hero image
  is priority-loaded.
