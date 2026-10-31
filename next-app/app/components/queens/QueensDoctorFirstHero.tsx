/**
 * Queens Care — Doctor-First Hero (NEW CONCEPT, NO BOTTLE STAGE)
 *
 * User direction 2026-10-31: remove the large bottle from the hero and
 * create a new, creative, eye-catching premium cinematic 3D animation
 * concept. This hero therefore shows NO bottle image at all.
 *
 * What it shows instead:
 * - The original Queens Care gold logo (crowned Q with the female
 *   doctor) — preserved exactly, not regenerated. The doctor is the
 *   hero: entrance, breathing loop and a gentle welcome gesture.
 * - Floating category orbs (real categories only, passed as props)
 *   that link to shop/category pages.
 * - Headline, subtitle and CTAs from admin content (props), so the
 *   hero stays fully editable via the existing admin content model.
 * - A friendly brand-guide note: the character is a fictional brand
 *   guide, not a real medical adviser. No fake claims.
 *
 * Copy the supplied original logo to public/images/hero/queens-care-logo.png
 * for local testing, or pass a different logoImage URL from admin settings.
 */

type Cta = { label: string; href: string };

type Props = {
  headline?: string;
  subtitle?: string;
  logoImage?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  categoryOrbs?: Cta[];
  characterNote?: string;
};

export default function QueensDoctorFirstHero({
  headline = "Your Queen of Wellness",
  subtitle = "Premium wellness and pharmaceutical care, made with rigorous science and a human touch.",
  logoImage = "/images/hero/queens-care-logo.png",
  primaryCta = { label: "Shop Now", href: "/shop" },
  secondaryCta = { label: "Our Science", href: "/science" },
  categoryOrbs = [],
  characterNote = "A friendly brand guide — not a medical adviser.",
}: Props) {
  return (
    <section className="queens-doctor-first-hero" aria-label="Queens Care welcome">
      <div className="queens-doctor-first-grid">
        <div className="queens-doctor-first-copy">
          <p className="queens-doctor-first-eyebrow">Queens Care Laboratories</p>
          <h1>{headline}</h1>
          <p>{subtitle}</p>
          <div className="queens-doctor-first-ctas">
            <a className="queens-btn queens-btn-white" href={primaryCta.href}>{primaryCta.label}</a>
            <a className="queens-btn queens-btn-outline" href={secondaryCta.href}>{secondaryCta.label}</a>
          </div>
          <p className="queens-doctor-first-note">{characterNote}</p>
        </div>
        <div className="queens-doctor-first-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="queens-doctor-first-logo" src={logoImage} alt="Queens Care logo with female doctor" />
          <div className="queens-doctor-first-orbs">
            {categoryOrbs.map((orb) => (
              <a key={orb.href} className="queens-doctor-first-orb" href={orb.href}>{orb.label}</a>
            ))}
          </div>
          <p className="queens-doctor-first-speech">Hi! Main aapka swagat karti hoon — chalo, apni care choose karo</p>
        </div>
      </div>
      <style jsx>{`
        .queens-doctor-first-hero { background: radial-gradient(circle at 70% 20%, rgba(193,154,107,.35), transparent 45%), linear-gradient(135deg, #2a0f3a, #4b2366 50%, #faf7f1); color: #fff; padding: 32px 20px 56px; overflow: hidden; }
        .queens-doctor-first-grid { max-width: 1040px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; }
        @media (max-width: 768px) { .queens-doctor-first-grid { grid-template-columns: 1fr; } }
        .queens-doctor-first-eyebrow { letter-spacing: .18em; font-size: 11px; color: #e6cfa5; font-weight: 800; }
        h1 { font-family: Georgia, serif; font-size: clamp(38px, 6vw, 68px); line-height: 1; animation: queensSlideUp .7s .4s ease both; opacity: 0; }
        .queens-doctor-first-visual { text-align: center; perspective: 1000px; }
        .queens-doctor-first-logo { width: 100%; max-width: 420px; height: auto; filter: drop-shadow(0 30px 50px rgba(0,0,0,.45)); animation: queensLogoIn 1s ease both, queensDoctorBreath 4s 1.2s ease-in-out infinite, queensDoctorGesture 12s 4s ease-in-out infinite; }
        .queens-doctor-first-orb { display: inline-block; background: rgba(255,255,255,.92); color: #2a0f3a; padding: 10px 16px; border-radius: 999px; font-weight: 800; margin: 5px; text-decoration: none; animation: queensFloaty 3.5s ease-in-out infinite; }
        .queens-doctor-first-speech { background: #fff; color: #2a0f3a; padding: 14px 18px; border-radius: 18px; display: inline-block; margin-top: 16px; font-weight: 700; animation: queensPop .5s 1.6s ease both; opacity: 0; }
        @keyframes queensSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes queensPop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes queensLogoIn { from { opacity: 0; transform: scale(.88) rotate(-2deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
        @keyframes queensDoctorBreath { 0%,100% { translate: 0 0; } 50% { translate: 0 -9px; } }
        @keyframes queensDoctorGesture { 0%,70%,100% { rotate: 0deg; } 80% { rotate: .8deg; } 90% { rotate: -.4deg; } }
        @keyframes queensFloaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @media (prefers-reduced-motion: reduce) { .queens-doctor-first-logo, .queens-doctor-first-orb { animation: none !important; } }
      `}</style>
    </section>
  );
}
