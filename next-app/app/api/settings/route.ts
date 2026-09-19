import { json } from "@/lib/http";
import { settingStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const all = await settingStore.getAll();
  // Only expose safe public settings
  const publicKeys = [
    "theme_primary", "theme_secondary", "theme_gold", "theme_accent", "theme_bg", "theme_text", "theme_surface",
    "logo_url", "logo_height_desktop", "logo_height_mobile", "logo_max_width", "logo_alt", "favicon_url",
    "site_name", "site_tagline", "contact_email", "contact_phone", "free_shipping_enabled", "free_shipping_threshold",
    "shipping_charge", "shipping_message", "handling_charge", "handling_charge_enabled", "delivery_enabled",
    "delivery_standard_days", "delivery_express_days", "delivery_cod_enabled", "delivery_same_day",
    "delivery_same_day_cutoff", "delivery_serviceable_pincodes", "delivery_serviceable_ranges", "delivery_metro_pincodes",
    "footer_tagline", "footer_newsletter_title", "footer_copyright", "footer_bg", "footer_text_color",
    "header_nav", "footer_links",
    "login_doctor_enabled", "login_doctor_asset", "login_doctor_size", "login_doctor_position",
    "login_entrance_enabled", "login_animation_enabled", "login_animation_speed",
    "login_bag_enabled", "login_bag_asset", "login_coat_logo", "login_bag_logo",
    "login_bg_style", "login_bg_image", "login_heading", "login_subheading", "login_cta_label", "login_success_message",
    "hero_3d_enabled", "hero_3d_quality", "hero_3d_auto_rotate", "product_3d_enabled", "reduced_motion_mode", "animation_intensity"
  ];
  const safe: Array<Record<string, unknown>> = all.filter((s: Record<string, unknown>) => publicKeys.includes(String(s.key)));

  // Extract safe, configured company and regulatory information
  const bizSetting = all.find((s: Record<string, unknown>) => s.key === "business_info");
  if (bizSetting && bizSetting.value) {
    try {
      const raw = typeof bizSetting.value === "string" ? JSON.parse(bizSetting.value) : bizSetting.value;
      if (typeof raw === "object" && raw !== null) {
        safe.push({
          key: "company_info",
          value: {
            legalName: String(raw.legalName || ""),
            tradeName: String(raw.tradeName || ""),
            address: String(raw.address || ""),
            operatingAddress: String(raw.operatingAddress || ""),
            city: String(raw.city || ""),
            state: String(raw.state || ""),
            pincode: String(raw.pincode || ""),
            country: String(raw.country || "India"),
            phone: String(raw.phone || ""),
            email: String(raw.email || ""),
            supportPhone: String(raw.supportPhone || ""),
            supportEmail: String(raw.supportEmail || ""),
            businessHours: String(raw.businessHours || ""),
            website: String(raw.website || ""),
            gstin: String(raw.gstin || ""),
            drugLicenseNo: String(raw.drugLicenseNo || ""),
            fssaiLicenseNo: String(raw.fssaiLicenseNo || ""),
            pharmacistName: String(raw.pharmacistName || ""),
            pharmacistRegNo: String(raw.pharmacistRegNo || ""),
            grievanceOfficerName: String(raw.grievanceOfficerName || ""),
            grievanceEmail: String(raw.grievanceEmail || ""),
            grievancePhone: String(raw.grievancePhone || ""),
          }
        });
      }
    } catch {}
  }

  return json({ settings: safe });
}
