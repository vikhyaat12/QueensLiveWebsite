import { NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";
import { DEFAULT_FOOTER_CONFIG, interpolateFooterTokens, FooterConfig } from "@/lib/commerce/footer-schema";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = fileDb.get();
    const config = (db.footerConfig || DEFAULT_FOOTER_CONFIG) as unknown as FooterConfig;

    const isPlaceholder = (val?: string | null): boolean => {
      if (!val || typeof val !== "string") return true;
      const s = val.trim().toLowerCase();
      if (!s) return true;
      if (s.includes("27aaaaq1234f1z5") || s.includes("aaaaq1234") || s.includes("00aaaaa0000a0z0")) return true;
      if (s.includes("123 wellness avenue") || s.includes("central formulation hub") || s.includes("123 main st")) return true;
      if (s === "4050 8800" || s.includes("1800 123 4567") || s.includes("1234567890") || s.includes("9876543210")) return true;
      if (s === "test" || s === "demo" || s === "placeholder" || s === "sample" || s === "example" || s === "dummy") return true;
      return false;
    };

    // Fetch company_info if available in settings
    let companyLegalName = "Queens Care Laboratories";
    let regulatoryData: {
      drugLicenseNo?: string;
      fssaiNo?: string;
      gstin?: string;
      pharmacistInfo?: string;
      grievanceEmail?: string;
    } = {};

    const bizSetting = db.settings?.find((s: Record<string, unknown>) => s.key === "business_info");
    if (bizSetting && bizSetting.value) {
      try {
        const raw = typeof bizSetting.value === "string" ? JSON.parse(bizSetting.value as string) : bizSetting.value;
        if (typeof raw === "object" && raw !== null) {
          if (raw.legalName && !isPlaceholder(String(raw.legalName))) {
            companyLegalName = String(raw.legalName).trim();
          } else if (raw.tradeName && !isPlaceholder(String(raw.tradeName))) {
            companyLegalName = String(raw.tradeName).trim();
          }
          regulatoryData = {
            drugLicenseNo: raw.drugLicenseNo && !isPlaceholder(String(raw.drugLicenseNo)) ? String(raw.drugLicenseNo) : undefined,
            fssaiNo: raw.fssaiLicenseNo && !isPlaceholder(String(raw.fssaiLicenseNo)) ? String(raw.fssaiLicenseNo) : undefined,
            gstin: raw.gstin && !isPlaceholder(String(raw.gstin)) ? String(raw.gstin) : undefined,
            pharmacistInfo: raw.pharmacistName && !isPlaceholder(String(raw.pharmacistName))
              ? `${raw.pharmacistName} ${raw.pharmacistRegNo && !isPlaceholder(String(raw.pharmacistRegNo)) ? `(Reg. #${raw.pharmacistRegNo})` : ""}`.trim()
              : undefined,
            grievanceEmail: (raw.grievanceEmail || raw.supportEmail) && !isPlaceholder(String(raw.grievanceEmail || raw.supportEmail))
              ? String(raw.grievanceEmail || raw.supportEmail)
              : undefined,
          };
        }
      } catch {}
    }

    // Merge company regulatory if configured to use company settings
    const mergedRegulatory = { ...config.regulatory };
    if (config.regulatory?.useCompanyInfoSettings) {
      mergedRegulatory.customDrugLicenseNo = regulatoryData.drugLicenseNo || "";
      mergedRegulatory.customFssaiNo = regulatoryData.fssaiNo || "";
      mergedRegulatory.customGstin = regulatoryData.gstin || "";
      mergedRegulatory.customPharmacistInfo = regulatoryData.pharmacistInfo || "";
      mergedRegulatory.customGrievanceEmail = regulatoryData.grievanceEmail || "";
    } else {
      if (isPlaceholder(mergedRegulatory.customDrugLicenseNo)) mergedRegulatory.customDrugLicenseNo = "";
      if (isPlaceholder(mergedRegulatory.customFssaiNo)) mergedRegulatory.customFssaiNo = "";
      if (isPlaceholder(mergedRegulatory.customGstin)) mergedRegulatory.customGstin = "";
      if (isPlaceholder(mergedRegulatory.customPharmacistInfo)) mergedRegulatory.customPharmacistInfo = "";
      if (isPlaceholder(mergedRegulatory.customGrievanceEmail)) mergedRegulatory.customGrievanceEmail = "";
    }

    // Interpolate copyright string
    const interpolatedCopyright = interpolateFooterTokens(config.copyright?.template || "© {{YEAR}} {{COMPANY_NAME}}. All rights reserved.", {
      year: new Date().getFullYear(),
      companyName: companyLegalName,
    });

    // Sanitize brand certifications against placeholders
    const sanitizedBrand = {
      ...config.brand,
      certificationsText: isPlaceholder(config.brand?.certificationsText) ? "" : config.brand?.certificationsText,
    };

    // Sanitize contact info against placeholders
    const sanitizedContact = {
      ...config.contact,
      headquartersText: isPlaceholder(config.contact?.headquartersText) ? "" : config.contact?.headquartersText,
      helplineText: isPlaceholder(config.contact?.helplineText) ? "" : config.contact?.helplineText,
      verificationText: isPlaceholder(config.contact?.verificationText) ? "" : config.contact?.verificationText,
      badges: (config.contact?.badges || []).filter((b) => !isPlaceholder(b.label)),
    };

    // Sanitize clinical notice content
    const sanitizedClinicalNotice = {
      ...config.clinicalNotice,
      contentHtml: sanitizeHtml(config.clinicalNotice?.contentHtml || ""),
    };

    const clientConfig: FooterConfig = {
      ...config,
      brand: sanitizedBrand,
      contact: sanitizedContact,
      regulatory: mergedRegulatory,
      clinicalNotice: sanitizedClinicalNotice,
      copyright: {
        ...config.copyright,
        template: interpolatedCopyright,
      },
    };

    return NextResponse.json(
      {
        success: true,
        config: clientConfig,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/footer] Error:", error);
    return NextResponse.json(
      {
        success: true,
        config: DEFAULT_FOOTER_CONFIG,
      },
      { status: 200 }
    );
  }
}
