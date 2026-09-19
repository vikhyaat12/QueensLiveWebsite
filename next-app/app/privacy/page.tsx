import type { Metadata } from "next";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Queens Care Laboratories collects, uses, and protects your personal information under the DPDP Act 2023.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
            <span>🔒</span> Data Protection &amp; Confidentiality
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Last updated: August 2026 • Compliant with Digital Personal Data Protection (DPDP) Act, 2023
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
            Your trust is our highest standard. This policy explains how Queens Care Laboratories (&ldquo;Queens Care&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, shares, and protects your personal information when you visit our website, create an account, or place an order. By using our website, you agree to the practices described here.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly, including your name, email address, phone number, shipping and billing address, and the details of the orders you place. When you contact our care team or subscribe to updates, we retain the information you choose to share with us.
          </p>
          <p>
            We also collect limited technical information automatically, such as your device type, browser, approximate location derived from your IP address, and how you interact with our pages. This helps us keep the site secure, measure performance, and improve the experience.
          </p>
          <p>
            We do not store your full card or banking details. Payments are processed by our RBI-authorized payment partners (Razorpay and Cashfree), which handle your payment information under PCI-DSS Level 1 security standards.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>2. How We Use Your Information</h2>
          <p>
            We use your information to process and deliver your orders, confirm payments, provide customer care, prevent fraud and misuse, meet our legal and tax obligations, and, where you have given consent, send you product updates and offers. You can withdraw marketing consent at any time.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>3. Your Consent and Legal Basis</h2>
          <p>
            We process personal data in accordance with applicable Indian law, including the Digital Personal Data Protection Act, 2023. We rely on your consent for optional processing such as marketing, and on legitimate and contractual grounds for the processing needed to fulfil your orders and operate our service.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>4. How We Share Information</h2>
          <p>
            We share information only as needed to run our service: with payment processors to complete transactions, with logistics and courier partners to deliver your orders, and with technology providers who host and support our systems under confidentiality obligations. We may disclose information where required by law or to protect our rights. <strong>We do not sell or monetize your personal information.</strong>
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>5. Cookies &amp; Local Storage</h2>
          <p>
            We use essential cookies to maintain your shopping session, cart contents, and authentication state. With your consent where required, analytics cookies help us measure performance and optimize user experience.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>6. Data Retention &amp; Security</h2>
          <p>
            We retain personal information for as long as needed to provide our services and to meet legal, tax, accounting, and reporting requirements. We apply technical and organisational measures to protect your information, including TLS 1.3 encryption in transit, strict database access controls, and salted password hashing.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>7. Your Statutory Rights</h2>
          <p>
            Under the DPDP Act 2023, you have the right to request access to your personal data, request correction of inaccurate data, request erasure of data where processing is complete, and nominate an individual to exercise your rights in the event of incapacity.
          </p>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1E1638", margin: "32px 0 10px" }}>8. Contact &amp; Grievance Redressal</h2>
          <p style={{ marginBottom: 28 }}>
            For any question about this policy, or to reach our Grievance Officer, please email <a href="mailto:care@queenscare.in" style={{ color: "#2A0F3A", fontWeight: 600 }}>care@queenscare.in</a> or submit a message through our contact portal. We will respond within the timelines required by law.
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
            Contact Grievance Officer →
          </Link>
        </div>
      </main>

      <QueensCareFooter />
    </div>
  );
}
