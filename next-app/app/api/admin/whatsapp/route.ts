import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/http";
import { settingStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export interface WhatsAppCommunicationConfig {
  enabled: boolean;
  phoneNumber: string;
  displayLabel: string;
  defaultMessage: string;
  operatingHoursText: string;
  position: "bottom-right" | "bottom-left";
  pulseAnimation: boolean;
  showTooltip: boolean;
  updatedAt?: string;
}

const DEFAULT_CONFIG: WhatsAppCommunicationConfig = {
  enabled: true,
  phoneNumber: "+91 98765 43210",
  displayLabel: "Chat with Clinical Desk",
  defaultMessage: "Hello Queens Care Laboratories, I would like to consult regarding formulations.",
  operatingHoursText: "Mon – Sat: 9:00 AM – 8:00 PM IST",
  position: "bottom-right",
  pulseAnimation: true,
  showTooltip: true,
};

export async function GET() {
  // Admin-only: the public widget reads /api/whatsapp instead.
  const admin = await requireUser(["admin"]);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  try {
    const row = await settingStore.get("whatsapp_communication_config");
    if (row && row.value) {
      const raw = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
      return json({ config: { ...DEFAULT_CONFIG, ...(raw as object) } });
    }
    return json({ config: DEFAULT_CONFIG });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load WhatsApp config" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireUser(["admin"]);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid payload" }, 400);
    }

    const config: WhatsAppCommunicationConfig = {
      enabled: Boolean(body.enabled),
      phoneNumber: String(body.phoneNumber || "").trim(),
      displayLabel: String(body.displayLabel || "Chat with Clinical Desk").trim(),
      defaultMessage: String(body.defaultMessage || "").trim(),
      operatingHoursText: String(body.operatingHoursText || "Mon – Sat: 9:00 AM – 8:00 PM IST").trim(),
      position: body.position === "bottom-left" ? "bottom-left" : "bottom-right",
      pulseAnimation: body.pulseAnimation !== false,
      showTooltip: body.showTooltip !== false,
      updatedAt: new Date().toISOString(),
    };

    await settingStore.set("whatsapp_communication_config", JSON.stringify(config), "communication");

    return json({ success: true, config });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to save WhatsApp config" }, 500);
  }
}
