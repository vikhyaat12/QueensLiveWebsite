/**
 * Queens Care — Section Shell (reusable, data-driven)
 *
 * Used by every homepage section so spacing, typography and motion
 * stay consistent. Content (title, subtitle, CTA, background, order,
 * visibility) comes from props / the existing /api/homepage section
 * content — never hardcoded marketing claims.
 */

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  children: ReactNode;
  background?: "white" | "ivory" | "lavender" | "purple";
  id?: string;
};

const BACKGROUNDS: Record<NonNullable<Props["background"]>, string> = {
  white: "#ffffff",
  ivory: "#faf7f1",
  lavender: "#efeaf8",
  purple: "#2a0f3a",
};

export default function QueensSectionShell({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  children,
  background = "white",
  id,
}: Props) {
  const dark = background === "purple";
  return (
    <section
      id={id}
      className="queens-section"
      style={{ background: BACKGROUNDS[background], color: dark ? "#ffffff" : "#2b2b2b" }}
    >
      <div className="queens-container">
        {(eyebrow || title || subtitle) && (
          <header className="queens-section-header">
            {eyebrow ? <p className="queens-eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="queens-serif">{title}</h2> : null}
            {subtitle ? <p className="queens-section-subtitle">{subtitle}</p> : null}
          </header>
        )}
        {children}
        {primaryCta ? (
          <div className="queens-section-cta">
            <Link
              href={primaryCta.href}
              className={`queens-btn ${dark ? "queens-btn-gold" : "queens-btn-outline"}`}
            >
              {primaryCta.label}
            </Link>
          </div>
        ) : null}
      </div>
      <style>{`
        .queens-section-header { max-width: 720px; margin-bottom: 32px; }
        .queens-section-header h2 { font-size: clamp(1.75rem, 4vw, 2.75rem); line-height: 1.1; color: inherit; margin: 12px 0 12px; }
        .queens-section-subtitle { color: inherit; opacity: .85; line-height: 1.7; margin: 0; }
        .queens-section-cta { margin-top: 32px; }
      `}</style>
    </section>
  );
}
