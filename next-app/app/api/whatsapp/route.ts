import { json } from "@/lib/http";
import { settingStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await settingStore.get("whatsapp_communication_config");
    if (!row || !row.value) {
      // Default fallback
      return json({
        enabled: true,
        phoneNumber: "+91 98765 43210",
        displayLabel: "Chat with Clinical Desk",
        defaultMessage: "Hello Queens Care Laboratories, I would like to consult regarding formulations.",
        operatingHoursText: "Mon – Sat: 9:00 AM – 8:00 PM IST",
        position: "bottom-right",
        pulseAnimation: true,
        showTooltip: true,
      });
    }

    try {
      const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
      if (!parsed.enabled || !parsed.phoneNumber) {
        return json({ enabled: false });
      }
      return json({
        enabled: true,
        phoneNumber: parsed.phoneNumber,
        displayLabel: parsed.displayLabel || "Chat with Clinical Desk",
        defaultMessage: parsed.defaultMessage || "",
        operatingHoursText: parsed.operatingHoursText || "",
        position: parsed.position || "bottom-right",
        pulseAnimation: parsed.pulseAnimation !== false,
        showTooltip: parsed.showTooltip !== false,
      });
    } catch {
      return json({ enabled: false });
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load WhatsApp public config" }, 500);
  }
}
