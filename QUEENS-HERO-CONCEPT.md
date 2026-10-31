# Hero concept — original logo + original bottle, no 3D bottle needed

## Assets supplied by the user (2026-10-31, used exactly, never regenerated)
- `assets/queens-care-logo.png` — Queens Care Laboratories gold logo:
  crowned Q with the female doctor in a white coat holding a bottle.
  This IS the cute female doctor character the user wants to keep.
- `assets/liko-q-bottle.png` — Liko Q Suspension, 200ml,
  Lycopene, Vitamins & Minerals, Delicious Orange Flavour.
  Label, logo, colours and proportions are preserved. Do not distort,
  recolour or relabel it.

## User direction
- 3D bottle model is NOT required.
- Use a better idea if possible.
- Make it unique, eye-catching, Gen-Z style ecommerce, cinematic 3D
  animation — while staying premium and pharmaceutical-appropriate.
  No gaming look, no neon overload, no cartoonish UI, no fake claims.

## Unique idea: "Crown Q Stage"
Instead of a 3D bottle model, build the hero around the logo itself:

1. **Opening:** Deep purple studio fades in. The gold Q logo scales in
   softly, like a crown reveal, with a slow gold light sweep.
2. **Doctor:** The doctor inside the Q is the welcome character —
   same logo, same face, same coat. She stays the focus, she is not
   replaced by a new character.
3. **Bottle reveal:** The original Liko Q bottle floats in front of
   the Q on a glass pedestal, with a soft orange glow taken from its
   own orange flavour label, a gold rim light, and a soft shadow.
   Gentle float + desktop-only mouse parallax gives the 3D feel
   without a 3D model.
4. **Orbit chips (from the label only):** Small glass chips orbit
   slowly around the bottle — "Lycopene", "Vitamins", "Minerals",
   "200ml". Nothing else is claimed.
5. **Gen-Z editorial layer:** Oversized serif headline, a short
   punchy brand line, bold "Shop Now" CTA, and a clean marquee
   underneath. Fast, scrollable, mobile-first — no long intro,
   no blocked shopping, Skip animation and reduced-motion support.
6. **Cinematic depth:** Purple + champagne lighting, soft particles
   (restrained, not a particle storm), curved glass shapes behind
   the bottle, and a calm settled state after the entrance.

## What NOT to do
- Do not make a fake 3D bottle and call it a real model.
- Do not change the logo or bottle artwork.
- Do not present the logo character as a real doctor or medical adviser.
- Do not add medical efficacy, certification or guaranteed-result claims.
- Do not use the bottle image for any other product.

## Implementation note
`QueensCinematicHero.tsx` already supports this: pass the logo as
the character/brand image and the Liko Q image as `heroProductImage`.
The 3D feel comes from CSS perspective, parallax, float and light —
not from a GLB model. If a real GLB is supplied later, it can be
passed through `character.modelUrl` / `heroProductModelUrl` in
`queens-homepage-content.ts` without rewriting the hero.
