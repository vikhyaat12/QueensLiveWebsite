import { notFound } from "next/navigation";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";
import ProductCard from "@/app/components/ProductCard";
import UniversalPromoRenderer from "@/app/components/promotions/UniversalPromoRenderer";
import { promotionsStore } from "@/lib/commerce/promotions-store";
import { store } from "@/lib/commerce/store";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await promotionsStore.getAffiliateCampaignBySlug(slug);
  if (!campaign) return { title: "Campaign Not Found | Queens Care Laboratories" };

  return {
    title: campaign.seoTitle || `${campaign.name} | Queens Care Laboratories`,
    description: campaign.seoDescription || campaign.heroSubtitle,
    robots: { index: true, follow: true },
  };
}

export default async function AffiliateCampaignPage({ params }: Props) {
  const { slug } = await params;
  const campaign = await promotionsStore.getAffiliateCampaignBySlug(slug);

  if (!campaign || !campaign.enabled || campaign.status !== "active") {
    notFound();
  }

  // Load featured products if specified
  const allProducts = await store.products.list();
  const featuredProducts = (campaign.featuredProductIds || [])
    .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
    .filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FAF8F5" }}>
      <QueensCareHeader activePage="home" />

      {/* Campaign-Specific Slot */}
      <UniversalPromoRenderer
        slot="affiliate_campaign"
        context={{ affiliateCampaignId: campaign.id, pageType: "affiliate" }}
      />

      <main style={{ flex: 1 }}>
        {/* Co-Branded Partner Hero */}
        <section
          style={{
            background: "linear-gradient(135deg, #2A0F3A 0%, #15061F 100%)",
            color: "#FFFFFF",
            padding: "clamp(48px, 8vw, 84px) 24px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "860px", margin: "0 auto", position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                borderRadius: "50px",
                background: "rgba(212, 175, 55, 0.15)",
                border: "1px solid rgba(212, 175, 55, 0.35)",
                color: "#E9CA91",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              <span>✦</span>
              <span>{campaign.partnerName || "Practitioner Collaboration"}</span>
              <span>✦</span>
            </div>

            <h1
              style={{
                margin: "0 0 16px",
                fontSize: "clamp(30px, 5vw, 48px)",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
              }}
            >
              {campaign.heroTitle}
            </h1>

            {campaign.heroSubtitle && (
              <p
                style={{
                  margin: "0 auto 24px",
                  fontSize: "clamp(15px, 2.5vw, 18px)",
                  lineHeight: 1.6,
                  color: "#E5E7EB",
                  maxWidth: "680px",
                }}
              >
                {campaign.heroSubtitle}
              </p>
            )}

            {/* Exclusive Privilege Coupon Badge */}
            {campaign.couponCode && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 22px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px dashed #D4AF37",
                  borderRadius: "10px",
                  marginBottom: "28px",
                }}
              >
                <span style={{ fontSize: "13px", color: "#F3F4F6" }}>Exclusive Partner Privilege:</span>
                <strong style={{ fontSize: "16px", letterSpacing: "0.08em", color: "#D4AF37", fontFamily: "monospace" }}>
                  {campaign.couponCode}
                </strong>
                {campaign.commissionRate && (
                  <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
                    ({campaign.commissionRate}% Benefit Applied)
                  </span>
                )}
              </div>
            )}

            {/* Primary CTA */}
            {campaign.ctaLink && (
              <div>
                <Link
                  href={campaign.ctaLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 32px",
                    borderRadius: "50px",
                    background: "linear-gradient(135deg, #D4AF37 0%, #B45309 100%)",
                    color: "#FFFFFF",
                    fontSize: "14.5px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 8px 24px rgba(212, 175, 55, 0.3)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span>{campaign.ctaText || "Explore Curated Formulations"}</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Trust Bullets Bar */}
        {campaign.trustBullets && campaign.trustBullets.length > 0 && (
          <section
            style={{
              background: "#FFFFFF",
              borderBottom: "1px solid #EAE6DF",
              padding: "18px 24px",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "24px 48px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#2A0F3A",
              }}
            >
              {campaign.trustBullets.map((bullet, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#D4AF37" }}>✓</span>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Formulations Section */}
        {featuredProducts.length > 0 && (
          <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "56px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#2A0F3A", margin: "0 0 8px" }}>
                Curated Recommended Formulations
              </h2>
              <p style={{ margin: 0, fontSize: "15px", color: "#6B7280" }}>
                Formulations selected for high bioavailability and verified clinical efficacy.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px",
              }}
            >
              {featuredProducts.map((p: any) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </section>
        )}

        {/* Partner FAQs */}
        {campaign.faqs && campaign.faqs.length > 0 && (
          <section
            style={{
              maxWidth: "800px",
              margin: "0 auto 64px",
              padding: "0 24px",
            }}
          >
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#2A0F3A", textAlign: "center", marginBottom: "24px" }}>
              Frequently Asked Questions
            </h3>

            <div style={{ display: "grid", gap: "12px" }}>
              {campaign.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#FFFFFF",
                    padding: "18px 22px",
                    borderRadius: "10px",
                    border: "1px solid #EAE6DF",
                  }}
                >
                  <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#2A0F3A" }}>
                    {faq.question}
                  </h4>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "#4B5563", lineHeight: 1.55 }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <UniversalPromoRenderer slot="global_above_footer" />
      <QueensCareFooter />
    </div>
  );
}
