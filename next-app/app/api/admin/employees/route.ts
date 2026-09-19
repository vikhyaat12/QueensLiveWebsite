import { json, requireUser, safeText } from "@/lib/http";
import { employeeStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const employees = await employeeStore.list();
  return json({ employees });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const name = safeText(body.name, 80);
  if (!name) return json({ error: "Name required" }, 422);
  const slug = safeText(body.slug, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  try {
    const employee = await employeeStore.create({
      name,
      slug,
      employeeId: body.employeeId || null,
      designation: body.designation || null,
      department: body.department || null,
      photo: body.photo || body.profileImage || null,
      profileImage: body.photo || body.profileImage || null,
      phone: body.phone || null,
      email: body.email || null,
      bio: body.bio || null,
      active: body.active !== false,
      verified: body.verified !== false,
      privacySettings: body.privacySettings || {},
      keyStats: Array.isArray(body.keyStats) ? body.keyStats : [],
      heroBadges: Array.isArray(body.heroBadges) ? body.heroBadges : [],
      quote: body.quote || null,
      eyebrow: body.eyebrow || null,
      location: body.location || null,
      featuredProductIds: Array.isArray(body.featuredProductIds) ? body.featuredProductIds : [],
      featuredVideo: body.featuredVideo || null,
      heroBannerImage: body.heroBannerImage || null,
      heroBannerPosition: body.heroBannerPosition || null,
      heroBannerOpacity: typeof body.heroBannerOpacity === "number" ? body.heroBannerOpacity : null,
      heroBannerVisible: body.heroBannerVisible !== false,
      journeyHtml: body.journeyHtml || null,
      visionHtml: body.visionHtml || null,
      leadershipHtml: body.leadershipHtml || null,
      initiativesHtml: body.initiativesHtml || null,
      newsHtml: body.newsHtml || null,
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
      videos: Array.isArray(body.videos) ? body.videos : [],
      heroSubtitle: body.heroSubtitle || null,
      heroQuote: body.heroQuote || null,
      signatureText: body.signatureText || null,
      heroPlaqueQuote: body.heroPlaqueQuote || null,
      heroPlaqueAuthor: body.heroPlaqueAuthor || null,
      aboutIcon: body.aboutIcon || null,
      aboutTitle: body.aboutTitle || null,
      aboutSubtitle: body.aboutSubtitle || null,
      aboutParagraph1: body.aboutParagraph1 || null,
      aboutParagraph2: body.aboutParagraph2 || null,
      aboutCtaLabel: body.aboutCtaLabel || null,
      aboutCtaUrl: body.aboutCtaUrl || null,
      aboutQuoteText: body.aboutQuoteText || null,
      aboutQuoteAuthor: body.aboutQuoteAuthor || null,
      momentsGrid: Array.isArray(body.momentsGrid) ? body.momentsGrid : [],
      sidebarPromo: body.sidebarPromo || null,
      footerBadges: Array.isArray(body.footerBadges) ? body.footerBadges : [],
      footerTagline: body.footerTagline || null,
      photoSettings: body.photoSettings || {
        desktopSize: 180,
        mobileSize: 130,
        borderRadius: 50,
        objectFit: "cover",
        borderWidth: 3,
        borderColor: "#D4AF37",
        shadow: true,
      },
    });
    return json({ employee }, 201);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed" }, 409);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of [
    "name",
    "slug",
    "employeeId",
    "designation",
    "heroSubtitle",
    "department",
    "photo",
    "profileImage",
    "phone",
    "email",
    "bio",
    "active",
    "verified",
    "featured",
    "sortOrder",
    "gallery",
    "videos",
    "photoSettings",
    "themeColors",
    "socialLinks",
    "privacySettings",
    "keyStats",
    "heroBadges",
    "quote",
    "eyebrow",
    "heroQuote",
    "signatureText",
    "heroPlaqueQuote",
    "heroPlaqueAuthor",
    "aboutIcon",
    "aboutTitle",
    "aboutSubtitle",
    "aboutParagraph1",
    "aboutParagraph2",
    "aboutCtaLabel",
    "aboutCtaUrl",
    "aboutQuoteText",
    "aboutQuoteAuthor",
    "location",
    "featuredProductIds",
    "featuredVideo",
    "momentsGrid",
    "sidebarPromo",
    "footerBadges",
    "footerTagline",
    "heroBannerImage",
    "heroBannerPosition",
    "heroBannerOpacity",
    "heroBannerVisible",
    "journeyHtml",
    "visionHtml",
    "leadershipHtml",
    "initiativesHtml",
    "newsHtml",
  ]) {
    if (k in body) data[k] = body[k];
  }
  if (body.photo || body.profileImage) {
    data.photo = body.photo || body.profileImage;
    data.profileImage = data.photo;
  }
  const employee = await employeeStore.update(body.id, data);
  return json({ employee });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await employeeStore.delete(id);
  return json({ ok: true });
}
