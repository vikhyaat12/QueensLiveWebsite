import { json, requireUser } from "@/lib/http";
import { settingStore } from "@/lib/commerce/store-extensions";

// GET: Fetch all billing settings (admin only)
export async function GET() {
  if (!(await requireUser(["admin"]))) return json({ error: "Unauthorized" }, 401);

  const keys = [
    "business_info",
    "tax_config",
    "invoice_config",
    "invoice_columns_config",
    "invoice_template_config",
    "other_charges",
    "donation_config",
  ];

  const settings: Record<string, unknown> = {};
  for (const key of keys) {
    const s = await settingStore.get(key);
    if (s && s.value !== undefined) {
      settings[key] = typeof s.value === "string" ? JSON.parse(String(s.value)) : s.value;
    }
  }

  return json({ settings });
}

// PATCH: Update billing settings (admin only)
export async function PATCH(request: Request) {
  if (!(await requireUser(["admin"]))) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid payload" }, 422);

  const allowedKeys = [
    "business_info",
    "tax_config",
    "invoice_config",
    "invoice_columns_config",
    "invoice_template_config",
    "other_charges",
    "donation_config",
  ];

  const saved: string[] = [];
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      // Validate tax_config
      if (key === "tax_config") {
        const tc = body[key];
        if (typeof tc.defaultRate === "number" && (tc.defaultRate < 0 || tc.defaultRate > 100)) {
          return json({ error: "GST rate must be between 0 and 100." }, 422);
        }
      }
      // Validate donation_config
      if (key === "donation_config") {
        const dc = body[key];
        if (dc.customMin !== undefined && dc.customMax !== undefined && dc.customMin > dc.customMax) {
          return json({ error: "Donation minimum cannot exceed maximum." }, 422);
        }
        if (Array.isArray(dc.presetAmounts)) {
          dc.presetAmounts = dc.presetAmounts
            .map((n: unknown) => Math.max(0, Math.round(Number(n) || 0)))
            .filter((n: number) => n > 0);
        }
      }
      // Validate other_charges
      if (key === "other_charges") {
        const charges = body[key];
        if (Array.isArray(charges)) {
          for (const c of charges) {
            if (!c.name || typeof c.name !== "string") {
              return json({ error: "Each charge requires a name." }, 422);
            }
          }
        }
      }
      await settingStore.set(key, body[key], "billing");
      saved.push(key);
    }
  }

  // Log the change
  try {
    const logs = (await settingStore.get("audit_logs") as unknown as Record<string, unknown>) || { value: [] };
    const logArr = Array.isArray(logs.value) ? logs.value : [];
    logArr.push({
      type: "billing_config_change",
      keys: saved,
      timestamp: new Date().toISOString(),
    });
    // Keep last 100 entries
    await settingStore.set("audit_logs", logArr.slice(-100), "audit");
  } catch {}

  return json({ success: true, saved });
}
