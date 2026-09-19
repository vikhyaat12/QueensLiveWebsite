import "server-only";
import { settingStore } from "./store-extensions";
import { fileDb } from "./file-db";
import { prisma } from "@/lib/prisma";

const usePrisma = Boolean(process.env.DATABASE_URL);

export type TaxCategory = "goods" | "services" | "exempt";
export type TaxMode = "taxable" | "exempt" | "zero_rated";

export interface TaxRule {
  id: string;
  name: string;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  hsnCodes: string[];
  taxCategory: TaxCategory;
  description: string;
  isDefault: boolean;
  active: boolean;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TAX_RULES: TaxRule[] = [
  {
    id: "rule-exempt-0",
    name: "Exempt / Nil-Rated Formulations (0%)",
    gstRate: 0,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    hsnCodes: ["3002", "3006"],
    taxCategory: "exempt",
    description: "Human blood and its components, contraceptives, life-saving exemptions.",
    isDefault: false,
    active: true,
    effectiveDate: "2024-01-01",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "rule-pharma-5",
    name: "Essential Medicines & Vaccines (5%)",
    gstRate: 5,
    cgstRate: 2.5,
    sgstRate: 2.5,
    igstRate: 5,
    hsnCodes: ["3004", "3002", "9018"],
    taxCategory: "goods",
    description: "Life-saving drugs, diagnostic kits, vaccines, artificial limbs.",
    isDefault: false,
    active: true,
    effectiveDate: "2024-01-01",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "rule-pharma-12",
    name: "Standard Medicines & Ayurvedic Formulations (12%)",
    gstRate: 12,
    cgstRate: 6,
    sgstRate: 6,
    igstRate: 12,
    hsnCodes: ["30049011", "30049012", "3004"],
    taxCategory: "goods",
    description: "Standard pharmaceutical medicines, Ayurvedic preparations, surgical dressings.",
    isDefault: true,
    active: true,
    effectiveDate: "2024-01-01",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "rule-wellness-18",
    name: "Healthcare Cosmetics & Wellness (18%)",
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    hsnCodes: ["3304", "3305", "2106"],
    taxCategory: "goods",
    description: "Derma-skincare, restorative elixirs, nutraceuticals, health supplements.",
    isDefault: false,
    active: true,
    effectiveDate: "2024-01-01",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "rule-luxury-28",
    name: "Luxury Healthcare & Special Formulations (28%)",
    gstRate: 28,
    cgstRate: 14,
    sgstRate: 14,
    igstRate: 28,
    hsnCodes: ["3303", "3307"],
    taxCategory: "goods",
    description: "Luxury health aromatics, specialized preparations.",
    isDefault: false,
    active: true,
    effectiveDate: "2024-01-01",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

/**
 * List all configured Tax Rules. Falls back to DEFAULT_TAX_RULES.
 */
export async function listTaxRules(): Promise<TaxRule[]> {
  try {
    const s = await settingStore.get("tax_rules_master");
    if (s && s.value) {
      const val = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
      if (Array.isArray(val) && val.length > 0) {
        return val as TaxRule[];
      }
    }
  } catch {}

  // Check fileDb collection
  try {
    const fromDb = fileDb.findMany("tax_rules" as never);
    if (fromDb && fromDb.length > 0) {
      return fromDb as unknown as TaxRule[];
    }
  } catch {}

  return DEFAULT_TAX_RULES;
}

/**
 * Retrieve a tax rule by its unique ID.
 */
export async function getTaxRuleById(id: string): Promise<TaxRule | null> {
  const rules = await listTaxRules();
  return rules.find((r) => r.id === id) || null;
}

/**
 * Retrieve the active default tax rule.
 */
export async function getDefaultTaxRule(): Promise<TaxRule> {
  const rules = await listTaxRules();
  const def = rules.find((r) => r.isDefault && r.active);
  if (def) return def;
  const anyActive = rules.find((r) => r.active);
  if (anyActive) return anyActive;
  return DEFAULT_TAX_RULES[2]; // rule-pharma-12
}

/**
 * Save or update a tax rule in the settings store and fileDb.
 */
export async function saveTaxRule(input: Partial<TaxRule> & { name: string; gstRate: number }): Promise<TaxRule> {
  const rules = await listTaxRules();
  const id = input.id || `rule-${Date.now().toString(36)}`;
  const gstRate = Math.max(0, Math.min(100, Number(input.gstRate) || 0));
  const cgstRate = Math.round((gstRate / 2) * 100) / 100;
  const sgstRate = cgstRate;
  const igstRate = gstRate;
  const now = new Date().toISOString();

  const isDefault = Boolean(input.isDefault);

  const rule: TaxRule = {
    id,
    name: input.name.trim(),
    gstRate,
    cgstRate,
    sgstRate,
    igstRate,
    hsnCodes: Array.isArray(input.hsnCodes) ? input.hsnCodes.map(s => String(s).trim()).filter(Boolean) : ["3004"],
    taxCategory: input.taxCategory || "goods",
    description: input.description || "",
    isDefault,
    active: input.active !== false,
    effectiveDate: input.effectiveDate || now.slice(0, 10),
    createdAt: input.createdAt || now,
    updatedAt: now,
  };

  let updatedList = [...rules];
  const existingIdx = updatedList.findIndex((r) => r.id === id);

  if (isDefault) {
    // Demote any other defaults
    updatedList = updatedList.map((r) => ({ ...r, isDefault: r.id === id }));
  }

  if (existingIdx >= 0) {
    updatedList[existingIdx] = rule;
  } else {
    updatedList.push(rule);
  }

  // Persist to setting store
  await settingStore.set("tax_rules_master", updatedList, "tax");
  fileDb.update("tax_rules" as never, id, rule as unknown as Record<string, unknown>);

  return rule;
}

/**
 * Count how many products reference a tax rule.
 */
export async function getProductUsageCount(ruleId: string): Promise<number> {
  try {
    if (usePrisma) {
      const count = await prisma.product.count({
        where: {
          OR: [
            { taxRuleId: ruleId } as never,
          ],
        },
      });
      return count;
    }
  } catch {}

  const products = fileDb.findMany("products");
  return products.filter((p: Record<string, unknown>) => p.taxRuleId === ruleId).length;
}

/**
 * Count product and order usage for admin tax rule management.
 */
export async function countTaxRuleUsage(ruleId: string): Promise<{ productCount: number; orderCount: number }> {
  const productCount = await getProductUsageCount(ruleId);
  const orders = fileDb.findMany("orders");
  const orderCount = orders.filter((o: Record<string, unknown>) => {
    const lines = Array.isArray(o.lines) ? o.lines : [];
    return lines.some((l: Record<string, unknown>) => l.taxRuleId === ruleId);
  }).length;
  return { productCount, orderCount };
}

/**
 * Safely deactivates/retires a rule. Rejects destructive deletion if products or orders reference it.
 */
export async function deleteOrRetireTaxRule(ruleId: string): Promise<{ success: boolean; retiredOnly?: boolean; reason?: string; error?: string }> {
  const usageCount = await getProductUsageCount(ruleId);
  if (usageCount > 0) {
    // Cannot hard delete — safely retire by marking active: false
    const rules = await listTaxRules();
    const target = rules.find((r) => r.id === ruleId);
    if (!target) return { success: false, error: "Rule not found." };
    if (target.isDefault) {
      return { success: false, error: "Cannot retire the default tax rule. Set another rule as default first." };
    }
    target.active = false;
    target.updatedAt = new Date().toISOString();
    await settingStore.set("tax_rules_master", rules, "tax");
    fileDb.update("tax_rules" as never, ruleId, target as unknown as Record<string, unknown>);
    return { success: true, retiredOnly: true };
  }

  // Check historical orders in fileDb or prisma
  const orders = fileDb.findMany("orders");
  const orderHasRule = orders.some((o: Record<string, unknown>) => {
    const lines = Array.isArray(o.lines) ? o.lines : [];
    return lines.some((l: Record<string, unknown>) => l.taxRuleId === ruleId);
  });

  if (orderHasRule) {
    // Safely retire
    const rules = await listTaxRules();
    const target = rules.find((r) => r.id === ruleId);
    if (target) {
      target.active = false;
      target.updatedAt = new Date().toISOString();
      await settingStore.set("tax_rules_master", rules, "tax");
      fileDb.update("tax_rules" as never, ruleId, target as unknown as Record<string, unknown>);
    }
    return { success: true, retiredOnly: true };
  }

  // No products or orders reference this rule: remove safely
  const rules = await listTaxRules();
  const filtered = rules.filter((r) => r.id !== ruleId);
  await settingStore.set("tax_rules_master", filtered, "tax");
  fileDb.remove("tax_rules" as never, ruleId);
  return { success: true };
}

export const retireTaxRule = deleteOrRetireTaxRule;

/**
 * Resolves the effective tax parameters for a product.
 * Hierarchy:
 * 1. Product-level override (if taxRate/gstRate is set on product)
 * 2. Product's assigned Tax Rule
 * 3. Default Tax Rule
 */
export async function resolveProductTax(product: {
  taxRuleId?: string;
  gstRate?: number;
  taxRate?: number;
  hsnCode?: string;
  taxCategory?: string;
  taxMode?: "taxable" | "exempt" | "zero_rated";
  taxInclusive?: boolean;
}): Promise<{
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  hsnCode: string;
  taxCategory: TaxCategory;
  taxMode: TaxMode;
  taxInclusive: boolean;
  ruleId: string;
  ruleName: string;
  isOverride: boolean;
}> {
  const defaultRule = await getDefaultTaxRule();
  let rule: TaxRule = defaultRule;

  if (product.taxRuleId) {
    const assigned = await getTaxRuleById(product.taxRuleId);
    if (assigned && assigned.active) {
      rule = assigned;
    }
  }

  const taxMode: TaxMode = product.taxMode || (product.taxCategory === "exempt" ? "exempt" : "taxable");

  if (taxMode === "exempt" || taxMode === "zero_rated") {
    return {
      gstRate: 0,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      hsnCode: product.hsnCode || (rule.hsnCodes?.[0] ?? "3004"),
      taxCategory: "exempt",
      taxMode,
      taxInclusive: Boolean(product.taxInclusive),
      ruleId: rule.id,
      ruleName: `${rule.name} (${taxMode})`,
      isOverride: true,
    };
  }

  // Product specific rate override
  const directRate = typeof product.gstRate === "number" ? product.gstRate : product.taxRate;
  const isOverride = directRate !== undefined && directRate !== null && !isNaN(directRate) && directRate !== rule.gstRate;
  const effectiveGstRate = isOverride ? Math.max(0, directRate) : rule.gstRate;
  const cgstRate = Math.round((effectiveGstRate / 2) * 100) / 100;
  const sgstRate = cgstRate;
  const igstRate = effectiveGstRate;

  const hsnCode = product.hsnCode || (rule.hsnCodes?.[0] ?? "3004");
  const taxCategory: TaxCategory = (product.taxCategory as TaxCategory) || rule.taxCategory || "goods";
  const taxInclusive = Boolean(product.taxInclusive);

  return {
    gstRate: effectiveGstRate,
    cgstRate,
    sgstRate,
    igstRate,
    hsnCode,
    taxCategory,
    taxMode: "taxable",
    taxInclusive,
    ruleId: rule.id,
    ruleName: rule.name,
    isOverride,
  };
}
