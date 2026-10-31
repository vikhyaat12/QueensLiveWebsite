/**
 * Queens Care — Editorial Product Showcase (data-driven only)
 *
 * Shows ONE admin-selected product with a large original image and
 * composition/specification details supplied by the page from real
 * product data. No composition, specification, claim or result is
 * invented here — if a detail is not supplied, it is not rendered.
 */

import Link from "next/link";

export type QueensShowcaseProduct = {
  name: string;
  image: string;
  description?: string;
  composition?: string[];
  specifications?: Array<{ label: string; value: string }>;
};

type Props = {
  product: QueensShowcaseProduct;
  productHref: string;
  ctaLabel?: string;
};

export default function QueensEditorialShowcase({ product, productHref, ctaLabel = "Explore Product" }: Props) {
  return (
    <div className="queens-showcase">
      <div className="queens-showcase-media">
        {/* Original product image only — label and proportions preserved. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} width={640} height={640} loading="lazy" />
      </div>
      <div className="queens-showcase-copy">
        <h3 className="queens-serif">{product.name}</h3>
        {product.description ? <p>{product.description}</p> : null}
        {product.composition && product.composition.length > 0 ? (
          <>
            <h4>Composition</h4>
            <ul>
              {product.composition.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        {product.specifications && product.specifications.length > 0 ? (
          <dl className="queens-showcase-specs">
            {product.specifications.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <Link href={productHref} className="queens-btn queens-btn-primary">
          {ctaLabel}
        </Link>
      </div>
      <style>{`
        .queens-showcase { display: grid; gap: 32px; align-items: center; }
        @media (min-width: 1024px) { .queens-showcase { grid-template-columns: 1fr 1fr; } }
        .queens-showcase-media { background: #faf7f1; border-radius: 24px; overflow: hidden; }
        .queens-showcase-media img { width: 100%; height: auto; display: block; }
        .queens-showcase-copy h3 { font-size: clamp(1.75rem, 4vw, 2.5rem); line-height: 1.1; color: #2a0f3a; margin: 0 0 16px; }
        .queens-showcase-copy p { line-height: 1.7; color: #333; }
        .queens-showcase-copy h4 { color: #2a0f3a; margin: 24px 0 8px; }
        .queens-showcase-copy ul { margin: 0; padding-left: 20px; line-height: 1.7; }
        .queens-showcase-specs { display: grid; gap: 8px; margin: 24px 0; }
        .queens-showcase-specs div { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid rgba(42,15,58,.1); padding-bottom: 8px; }
        .queens-showcase-specs dt { font-weight: 700; color: #2a0f3a; }
        .queens-showcase-specs dd { margin: 0; text-align: right; }
      `}</style>
    </div>
  );
}
