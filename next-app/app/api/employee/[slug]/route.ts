import { json } from "@/lib/http";
import { employeeStore } from "@/lib/commerce/store-extensions";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = (await employeeStore.bySlug(slug)) as Record<string, unknown> | null;
  if (!employee || employee.active === false) return json({ error: "Employee not found" }, 404);

  return json({
    employee: {
      id: employee.id,
      name: employee.name,
      employeeId: employee.employeeId || employee.slug,
      designation: employee.designation || "",
      department: employee.department || "",
      photo: employee.photo || employee.profileImage || "",
      profileImage: employee.profileImage || employee.photo || "",
      bio: employee.bio || "",
      phone: employee.phone || "",
      email: employee.email || "",
      slug: employee.slug,
      verified: employee.verified !== false,
      quote: employee.quote || "",
      eyebrow: employee.eyebrow || "",
      location: employee.location || "",
      privacySettings: employee.privacySettings || {},
      keyStats: Array.isArray(employee.keyStats) ? employee.keyStats : [],
      heroBadges: Array.isArray(employee.heroBadges) ? employee.heroBadges : [],
      featuredProductIds: Array.isArray(employee.featuredProductIds) ? employee.featuredProductIds : [],
      featuredVideo: employee.featuredVideo || null,
      journeyHtml: employee.journeyHtml || "",
      visionHtml: employee.visionHtml || "",
      leadershipHtml: employee.leadershipHtml || "",
      themeColors: employee.themeColors || {},
      socialLinks: employee.socialLinks || {},
      gallery: Array.isArray(employee.gallery) ? employee.gallery : [],
      videos: Array.isArray(employee.videos) ? employee.videos : [],
      photoSettings: employee.photoSettings || {
        desktopSize: 180,
        mobileSize: 130,
        borderRadius: 50,
        objectFit: "cover",
        borderWidth: 3,
        borderColor: "#D4AF37",
        shadow: true,
      },
    },
  });
}
