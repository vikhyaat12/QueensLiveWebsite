import Link from "next/link";
import type { Metadata } from "next";
import { employeeStore, pageSettingsStore, ourPeoplePageStore } from "@/lib/commerce/store-extensions";
import { store } from "@/lib/commerce/store";
import { currentSession } from "@/lib/auth";
import EmployeeProfileClient, { EmployeeData } from "./EmployeeProfileClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const employee = (await employeeStore.bySlug(slug)) as Record<string, unknown> | null;
    if (!employee) return { title: "Employee Not Found — Queens Care Laboratories" };
    return {
      title: `${String(employee.name)} | Official Staff Profile — Queens Care Laboratories`,
      description: `${String(employee.name)}, ${String(employee.designation || "")} at Queens Care Laboratories. ${String(employee.bio || "").slice(0, 140)}...`,
      robots: { index: employee.active !== false, follow: employee.active !== false },
    };
  } catch {
    return { title: "Employee Profile — Queens Care Laboratories" };
  }
}

export default async function EmployeeProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [pageConfig, ourPeopleConfig, session, rawEmployee, allList, allProducts] = await Promise.all([
    pageSettingsStore.bySlug("employee"),
    ourPeoplePageStore.get(),
    currentSession(),
    employeeStore.bySlug(slug) as Promise<Record<string, unknown> | null>,
    employeeStore.list() as Promise<Record<string, unknown>[]>,
    store.products.list().catch(() => []),
  ]);

  const isAdmin = session?.role === "admin";
  const isPageActive = pageConfig ? pageConfig.active !== false : true;

  if (!isPageActive && !isAdmin) {
    return (
      <main className="portal" style={{ maxWidth: 540, margin: "60px auto", textAlign: "center", padding: "50px 24px", background: "#ffffff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Queens Care Laboratories</p>
        <h1 style={{ font: "26px var(--font-display)", color: "#2A0F3A", marginTop: 12 }}>Team Directory Inactive</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
          The staff directory is currently undergoing maintenance.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "10px 24px",
            background: "#2A0F3A",
            color: "#ffffff",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Return to Queens Care →
        </Link>
      </main>
    );
  }

  if (!rawEmployee || (rawEmployee.active === false && !isAdmin)) {
    return (
      <main className="portal" style={{ maxWidth: 540, margin: "60px auto", textAlign: "center", padding: "50px 24px", background: "#ffffff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Queens Care Laboratories</p>
        <h1 style={{ font: "26px var(--font-display)", color: "#2A0F3A", marginTop: 12 }}>Employee Profile Not Found</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
          This staff profile may be currently inactive, archived, or the specified credential URL is incorrect.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "10px 24px",
            background: "#2A0F3A",
            color: "#ffffff",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Return to Queens Care →
        </Link>
      </main>
    );
  }

  // Filter products for this employee
  const featuredIds = Array.isArray(rawEmployee.featuredProductIds) ? (rawEmployee.featuredProductIds as string[]) : [];
  let matchingProducts = allProducts.filter(p => featuredIds.includes(p.id) || featuredIds.includes(p.slug));
  if (matchingProducts.length === 0) {
    matchingProducts = allProducts.slice(0, 4);
  }

  const privacySettings = (rawEmployee.privacySettings as any) || {};
  const showEmail = privacySettings.showEmail !== false;
  const showPhone = privacySettings.showPhone !== false;

  const socialLinks = { ...(rawEmployee.socialLinks as any || {}) };
  if (!showEmail && socialLinks.email) {
    delete socialLinks.email;
  }

  const employee: EmployeeData = {
    id: String(rawEmployee.id || ""),
    name: String(rawEmployee.name || ""),
    slug: String(rawEmployee.slug || slug),
    employeeId: String(rawEmployee.employeeId || rawEmployee.slug || ""),
    designation: String(rawEmployee.designation || ""),
    heroSubtitle: String(rawEmployee.heroSubtitle || ""),
    department: String(rawEmployee.department || ""),
    photo: String(rawEmployee.photo || rawEmployee.profileImage || ""),
    profileImage: String(rawEmployee.profileImage || rawEmployee.photo || ""),
    phone: showPhone ? String(rawEmployee.phone || "") : "",
    email: showEmail ? String(rawEmployee.email || "") : "",
    location: String(rawEmployee.location || ""),
    bio: String(rawEmployee.bio || ""),
    active: rawEmployee.active !== false,
    verified: rawEmployee.verified !== false,
    quote: String(rawEmployee.quote || ""),
    eyebrow: String(rawEmployee.eyebrow || ""),
    heroQuote: String(rawEmployee.heroQuote || rawEmployee.quote || ""),
    signatureText: String(rawEmployee.signatureText || rawEmployee.name || ""),
    heroPlaqueQuote: String(rawEmployee.heroPlaqueQuote || ""),
    heroPlaqueAuthor: String(rawEmployee.heroPlaqueAuthor || ""),
    heroBadges: Array.isArray(rawEmployee.heroBadges) ? (rawEmployee.heroBadges as any) : undefined,
    aboutIcon: String(rawEmployee.aboutIcon || "👤"),
    aboutTitle: String(rawEmployee.aboutTitle || ""),
    aboutSubtitle: String(rawEmployee.aboutSubtitle || ""),
    aboutParagraph1: String(rawEmployee.aboutParagraph1 || ""),
    aboutParagraph2: String(rawEmployee.aboutParagraph2 || ""),
    aboutCtaLabel: String(rawEmployee.aboutCtaLabel || "Read Full Story →"),
    aboutCtaUrl: String(rawEmployee.aboutCtaUrl || "#journey"),
    aboutQuoteText: String(rawEmployee.aboutQuoteText || ""),
    aboutQuoteAuthor: String(rawEmployee.aboutQuoteAuthor || ""),
    keyStats: Array.isArray(rawEmployee.keyStats) ? (rawEmployee.keyStats as any) : undefined,
    featuredProductIds: featuredIds,
    featuredVideo: (rawEmployee.featuredVideo as any) || undefined,
    momentsGrid: Array.isArray(rawEmployee.momentsGrid) ? (rawEmployee.momentsGrid as any) : undefined,
    sidebarPromo: (rawEmployee.sidebarPromo as any) || undefined,
    footerBadges: Array.isArray(rawEmployee.footerBadges) ? (rawEmployee.footerBadges as any) : undefined,
    footerTagline: String(rawEmployee.footerTagline || ""),
    journeyHtml: String(rawEmployee.journeyHtml || ""),
    visionHtml: String(rawEmployee.visionHtml || ""),
    leadershipHtml: String(rawEmployee.leadershipHtml || ""),
    initiativesHtml: String(rawEmployee.initiativesHtml || ""),
    newsHtml: String(rawEmployee.newsHtml || ""),
    heroBannerImage: String(rawEmployee.heroBannerImage || "/images/hero/executive-library-bg.jpg"),
    heroBannerPosition: String(rawEmployee.heroBannerPosition || "center 30%"),
    heroBannerOpacity: typeof rawEmployee.heroBannerOpacity === "number" ? rawEmployee.heroBannerOpacity : 0.38,
    heroBannerVisible: rawEmployee.heroBannerVisible !== false,
    privacySettings: privacySettings,
    gallery: Array.isArray(rawEmployee.gallery) ? rawEmployee.gallery : [],
    videos: Array.isArray(rawEmployee.videos) ? rawEmployee.videos : [],
    themeColors: (rawEmployee.themeColors as any) || {},
    socialLinks: socialLinks,
    photoSettings: (rawEmployee.photoSettings as EmployeeData["photoSettings"]) || {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true,
    },
  };

  const allEmployees: EmployeeData[] = allList
    .filter((m) => m.active !== false)
    .map((m) => ({
      id: String(m.id || ""),
      name: String(m.name || ""),
      slug: String(m.slug || ""),
      designation: String(m.designation || ""),
      department: String(m.department || ""),
      photo: String(m.photo || m.profileImage || ""),
      profileImage: String(m.profileImage || m.photo || ""),
      active: m.active !== false,
    }));

  return (
    <EmployeeProfileClient
      employee={employee}
      allEmployees={allEmployees}
      pageConfig={ourPeopleConfig}
      featuredProducts={matchingProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        originalPrice: (p as any).originalPrice || (p as any).mrp || Math.round(p.price * 1.3),
        badge: (p as any).badge || (p as any).badgeText || (p.price > 600 ? "Popular" : p.price > 500 ? "New" : "Bestseller"),
        badgeColor: (p as any).badgeColor || "#D4AF37",
        category: p.category,
        image: p.image || (p.images && p.images[0]) || "",
        images: p.images,
        rating: p.rating || 4.8,
        reviewCount: p.reviewCount || 480,
        shortDescription: (p as any).subtitle || p.shortDescription || p.description?.slice(0, 80),
      }))}
    />
  );
}
