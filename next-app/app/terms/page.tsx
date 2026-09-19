import type { Metadata } from "next";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the Queens Care Laboratories website and services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <QueensCareHeader activePage="about" />

      <main style={{ flex: 1, padding: "44px 24px 80px", maxWidth: 880, margin: "0 auto", width: "100%" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#2A0F3A",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
            }}
          >
            ← Return to Queens Care
          </Link>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(42, 15, 58, 0.06)",
              color: "#2A0F3A",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <span>📜</span> Legal &amp; Compliance
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(30px, 4vw, 44px)",
              fontWeight: 800,
              color: "#1E1638",
              margin: "0 0 10px",
            }}
          >
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Last updated: August 2026 • Governing legal agreement for Queens Care Laboratories
          </p>
        </div>

        {/* Content Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "40px 36px",
            border: "1px solid #EAE6DF",
            boxShadow: "0 4px 20px rgba(42, 15, 58, 0.03)",
            lineHeight: 1.75,
            color: "#374151",
            fontSize: 15,
          }}
        >
          <p style={{ marginTop: 0 }}>
            These terms govern your use of the Queens Care Laboratories (&ldquo;Queens Care&rdquo;) website and services. By accessing our site or placing an order, you agree to these terms. Please read them carefully.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>1. Eligibility</h2>
          <p>
            You must be at least 18 years of age and able to form a legally binding contract to use our services. By using the site, you confirm that you meet these requirements and that the information you provide is accurate.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>2. Products and Health Disclaimer</h2>
          <p>
            Our products are wellness and nutritional formulations. They are not intended to diagnose, treat, cure, or prevent any disease, and the information on this site is provided for general educational purposes only. It is not medical advice. Please consult a qualified healthcare professional before starting any supplement, particularly if you are pregnant or nursing, taking medication, or managing a medical condition.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>3. Orders and Acceptance</h2>
          <p>
            Your order is an offer to purchase. We may accept or decline it, and we may cancel an order if a product is unavailable, if pricing or product information was published in error, or if we suspect fraud. Where we cancel an order that you have already paid for, we will issue a full refund to the original payment method.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>4. Pricing and Payment</h2>
          <p>
            All prices are listed in Indian Rupees (₹) and are inclusive of applicable GST unless explicitly indicated otherwise. Payments are processed securely through our RBI-authorized payment partners (Razorpay and Cashfree). By submitting payment details, you authorise our payment partner to charge the applicable amount for your order.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>5. Shipping and Delivery</h2>
          <p>
            We aim to dispatch orders promptly and to deliver within the estimated timeframes shown at checkout. Delivery times are estimates and are not guaranteed. Risk in the products passes to you on delivery.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>6. Returns, Refunds, and Cancellations</h2>
          <p>
            If a product arrives damaged, defective, or incorrect, please contact our care team promptly so we can arrange a replacement or refund under our 15-Day Care Guarantee. For hygiene and safety reasons, opened or used consumable products may not be eligible for return except where required by law. Approved refunds are issued to the original payment method.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>7. Intellectual Property</h2>
          <p>
            All content on this site, including text, graphics, logos, product names, and design, is owned by or licensed to Queens Care and is protected by intellectual property laws. You may not copy, reproduce, or use our content without our prior written permission.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>8. Acceptable Use</h2>
          <p>
            You agree not to misuse the site, including by attempting to gain unauthorised access, interfering with its operation, scraping data, or using it for any unlawful purpose.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>9. Disclaimers and Limitation of Liability</h2>
          <p>
            The site and products are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest extent permitted by law, Queens Care disclaims implied warranties and is not liable for indirect, incidental, or consequential damages arising from your use of the site or products. Nothing in these terms limits any liability that cannot be excluded under applicable law.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>10. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These terms are governed by the laws of India, and the competent courts of India shall have jurisdiction over any dispute arising from them.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>11. Contact &amp; Grievance Redressal</h2>
          <p style={{ marginBottom: 28 }}>
            For any questions about these terms or legal matters, please contact our care team or Grievance Officer via our contact portal or email at <a href="mailto:care@queenscare.in" style={{ color: "#2A0F3A", fontWeight: 600 }}>care@queenscare.in</a>.
          </p>

          <Link
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 8,
              background: "#2A0F3A",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Contact Our Care Team →
          </Link>
        </div>
      </main>

      <QueensCareFooter />
    </div>
  );
}
