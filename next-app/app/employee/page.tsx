import Link from "next/link";
import type { Metadata } from "next";
import { employeeStore, ourPeoplePageStore } from "@/lib/commerce/store-extensions";
import { currentSession } from "@/lib/auth";
import OurPeopleExperience, { OurPeopleMember } from "@/app/components/OurPeopleExperience";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await ourPeoplePageStore.get();
  return {
    title: config.seo?.metaTitle || "Our People, Our Strength — Queens Care Laboratories",
    description:
      config.seo?.metaDescription ||
      "Meet the visionary leaders, formulation scientists, regulatory directors, and care specialists driving pharmaceutical excellence at Queens Care Laboratories.",
    robots: { index: true, follow: true },
    openGraph: {
      title: config.seo?.metaTitle || "Our People, Our Strength — Queens Care Laboratories",
      description: config.seo?.metaDescription,
      images: config.seo?.ogImage ? [{ url: config.seo.ogImage }] : undefined,
    },
  };
}

export default async function EmployeeDirectoryPage() {
  const [pageConfig, session, rawEmployees] = await Promise.all([
    ourPeoplePageStore.get(),
    currentSession(),
    employeeStore.list(),
  ]);

  const isAdmin = session?.role === "admin";
  const isPageActive = pageConfig.active !== false;

  if (!isPageActive && !isAdmin) {
    return (
      <main
        style={{
          background: "#fdfbf7",
          minHeight: "100vh",
          padding: "60px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 12,
            padding: "48px 36px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          }}
        >
          <span
            style={{
              font: "36px var(--font-display, serif)",
              color: "#D4AF37",
              display: "block",
              marginBottom: 12,
            }}
          >
            👑
          </span>
          <h2
            style={{
              font: "26px var(--font-display, serif)",
              color: "#2A0F3A",
              margin: "0 0 14px",
            }}
          >
            Our Team Directory Under Scheduled Review
          </h2>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 28 }}>
            The Queens Care clinical and scientific leadership directory is currently undergoing
            scheduled updates. Please return to our storefront or consult our customer care team.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "#2A0F3A",
              color: "#ffffff",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span>←</span> Return to Storefront
          </Link>
        </div>
      </main>
    );
  }

  const employees = ((rawEmployees as unknown as OurPeopleMember[]) || []).filter(
    (e) => e.active !== false
  );

  return (
    <main>
      {!isPageActive && isAdmin && (
        <div
          style={{
            background: "#FEF3C7",
            borderBottom: "1px solid #F59E0B",
            color: "#92400E",
            padding: "8px 20px",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          👁️ ADMIN PREVIEW MODE — This page is marked inactive in CMS settings and hidden from the public.
        </div>
      )}
      <OurPeopleExperience initialConfig={pageConfig} initialEmployees={employees} />
    </main>
  );
}
