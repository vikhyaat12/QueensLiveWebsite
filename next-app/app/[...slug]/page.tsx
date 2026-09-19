import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { pageSettingsStore, redirectStore, normalizePath } from "@/lib/commerce/store-extensions";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const segments = (await params).slug || [];
  const fullPath = normalizePath("/" + segments.join("/"));
  const rawSlug = segments.join("/");

  // Check 301 redirect
  const redirectTarget = await redirectStore.resolve(fullPath);
  if (redirectTarget) {
    permanentRedirect(redirectTarget.destination);
  }

  // Check CMS page
  const page =
    (await pageSettingsStore.bySlug(rawSlug)) ||
    (await pageSettingsStore.bySlug(fullPath)) ||
    (segments.length === 1 ? await pageSettingsStore.bySlug(segments[0]) : null);

  if (page && page.active !== false) {
    return {
      title: `${page.title || page.label || "Page"} | Queens Care Laboratories`,
      description: String(page.description || "Queens Care Laboratories clinical formulations and wellness solutions."),
      alternates: { canonical: fullPath },
    };
  }

  return {
    title: "Queens Care Laboratories",
    robots: { index: false, follow: false },
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const segments = (await params).slug || [];
  const fullPath = normalizePath("/" + segments.join("/"));
  const rawSlug = segments.join("/");

  // Check 301 redirect
  const redirectTarget = await redirectStore.resolve(fullPath);
  if (redirectTarget) {
    permanentRedirect(redirectTarget.destination);
  }

  // Check CMS page
  const page =
    (await pageSettingsStore.bySlug(rawSlug)) ||
    (await pageSettingsStore.bySlug(fullPath)) ||
    (segments.length === 1 ? await pageSettingsStore.bySlug(segments[0]) : null);

  if (!page || page.active === false) {
    return notFound();
  }

  return (
    <>
      <QueensCareHeader />
      <main style={{ minHeight: "75vh", background: "#FAF8F5", padding: "60px 5% 100px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", background: "#fff", padding: "48px 40px", borderRadius: 8, border: "1px solid var(--line)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#997B4D", margin: "0 0 10px" }}>
            Queens Care Laboratories
          </p>
          <h1 style={{ font: "clamp(28px, 4vw, 42px) var(--font-display)", color: "var(--purple)", margin: "0 0 20px" }}>
            {String(page.title || page.label)}
          </h1>
          {page.content ? (
            <div
              style={{ fontSize: 15, lineHeight: 1.8, color: "#475569" }}
              dangerouslySetInnerHTML={{ __html: String(page.content) }}
            />
          ) : (
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#64748B" }}>
              {String(page.description || "Welcome to Queens Care Laboratories.")}
            </p>
          )}
        </div>
      </main>
      <QueensCareFooter />
    </>
  );
}
