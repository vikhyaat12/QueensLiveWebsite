import { json, requireUser } from "@/lib/http";
import {
  listTaxRules,
  saveTaxRule,
  retireTaxRule,
  countTaxRuleUsage,
  type TaxCategory,
} from "@/lib/commerce/tax-rules";
import { getTaxConfig, saveTaxConfig } from "@/lib/commerce/pricing-engine";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  try {
    const [rules, taxConfig] = await Promise.all([
      listTaxRules(),
      getTaxConfig(),
    ]);

    const enrichedRules = await Promise.all(
      rules.map(async (r) => {
        const usage = await countTaxRuleUsage(r.id);
        return {
          ...r,
          productCount: usage.productCount,
          orderCount: usage.orderCount,
        };
      })
    );

    return json({ rules: enrichedRules, taxConfig });
  } catch (err) {
    console.error("Failed to fetch tax rules:", err);
    return json({ error: "Failed to load tax configuration." }, 500);
  }
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload." }, 400);

  // If saving business tax configuration
  if (body.action === "save_tax_config" || body.type === "tax_config") {
    const configInput = body.taxConfig || body;
    const updatedConfig = await saveTaxConfig({
      businessGstin: configInput.businessGstin,
      businessState: configInput.businessState,
      defaultGstRate: configInput.defaultGstRate !== undefined ? Number(configInput.defaultGstRate) : undefined,
      inclusivePricingDefault: configInput.inclusivePricingDefault !== undefined ? Boolean(configInput.inclusivePricingDefault) : undefined,
      shippingTaxable: configInput.shippingTaxable !== undefined ? Boolean(configInput.shippingTaxable) : undefined,
      shippingGstRate: configInput.shippingGstRate !== undefined ? Number(configInput.shippingGstRate) : undefined,
      rounding: configInput.rounding,
      isCompositionScheme: configInput.isCompositionScheme !== undefined ? Boolean(configInput.isCompositionScheme) : undefined,
    });
    return json({ success: true, taxConfig: updatedConfig });
  }

  // Otherwise saving / creating a Tax Rule
  const { id, name, description, gstRate, taxCategory, hsnCodes, isDefault, active } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return json({ error: "Tax rule name is required." }, 422);
  }

  const numericGstRate = Number(gstRate);
  if (isNaN(numericGstRate) || numericGstRate < 0 || numericGstRate > 100) {
    return json({ error: "GST rate must be a valid percentage between 0 and 100." }, 422);
  }

  let formattedHsn: string[] | undefined;
  if (Array.isArray(hsnCodes)) {
    formattedHsn = hsnCodes.map((c) => String(c).trim()).filter(Boolean);
  } else if (typeof hsnCodes === "string") {
    formattedHsn = hsnCodes.split(/[\s,]+/).map((c) => c.trim()).filter(Boolean);
  }

  try {
    const saved = await saveTaxRule({
      id: id ? String(id) : undefined,
      name: name.trim(),
      description: description ? String(description).trim() : undefined,
      gstRate: numericGstRate,
      taxCategory: (taxCategory as TaxCategory) || "pharmaceuticals",
      hsnCodes: formattedHsn,
      isDefault: Boolean(isDefault),
      active: active !== undefined ? Boolean(active) : true,
    });

    const usage = await countTaxRuleUsage(saved.id);
    return json({
      success: true,
      rule: {
        ...saved,
        productCount: usage.productCount,
        orderCount: usage.orderCount,
      },
    });
  } catch (err) {
    console.error("Failed to save tax rule:", err);
    return json({ error: "Failed to save tax rule." }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Rule ID is required." }, 400);

  try {
    const result = await retireTaxRule(id);
    if (!result.success) {
      return json({ error: result.reason || "Failed to delete/retire rule." }, 400);
    }
    return json(result);
  } catch (err) {
    console.error("Failed to retire tax rule:", err);
    return json({ error: "Failed to retire tax rule." }, 500);
  }
}
