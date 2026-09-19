import { json, requireUser } from "@/lib/http";
import { settingStore, STANDARD_REJECTION_REASONS } from "@/lib/commerce/store-extensions";

export const DEFAULT_SHIPPING_SETTINGS = {
  senderName: "Queens Care Laboratories",
  legalEntity: "Queens Care Laboratories Pvt. Ltd.",
  addressLine1: "Queens Care House, Plot 42, Health City",
  addressLine2: "Off S.V. Road, Andheri West",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  phone: "+91 1800 123 7833",
  email: "care@queenscare.in",
  drugLicenseNo: "MH-MZ4-2024-QC09 / 20B/21B",
  gstin: "27AABCQ1234F1Z5",
  returnInstructions: "If undelivered, return to sender. Temperature sensitive formulation.",
};

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const rawShipping = await settingStore.get("shipping_label_config");
  const shippingConfig = rawShipping?.value
    ? { ...DEFAULT_SHIPPING_SETTINGS, ...(rawShipping.value as Record<string, unknown>) }
    : DEFAULT_SHIPPING_SETTINGS;

  const rawReasons = await settingStore.get("rejection_reasons_config");
  const rejectionReasons = Array.isArray(rawReasons?.value)
    ? rawReasons.value
    : STANDARD_REJECTION_REASONS;

  return json({
    shippingConfig,
    rejectionReasons,
  });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  if (body.shippingConfig && typeof body.shippingConfig === "object") {
    await settingStore.set("shipping_label_config", body.shippingConfig, "logistics");
  }
  if (Array.isArray(body.rejectionReasons) && body.rejectionReasons.length > 0) {
    await settingStore.set("rejection_reasons_config", body.rejectionReasons, "orders");
  }

  const updatedShipping = await settingStore.get("shipping_label_config");
  const updatedReasons = await settingStore.get("rejection_reasons_config");

  return json({
    ok: true,
    shippingConfig: updatedShipping?.value || DEFAULT_SHIPPING_SETTINGS,
    rejectionReasons: updatedReasons?.value || STANDARD_REJECTION_REASONS,
  });
}
