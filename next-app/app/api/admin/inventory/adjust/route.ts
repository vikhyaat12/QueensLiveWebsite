import { json, requireUser, safeText } from "@/lib/http";
import { inventoryService } from "@/lib/commerce/inventory";
import type { InventoryMovementType } from "@/lib/commerce/types";

const VALID_TYPES: InventoryMovementType[] = [
  "RESTOCK",
  "MANUAL_INCREASE",
  "MANUAL_DECREASE",
  "STOCK_CORRECTION",
  "DAMAGED",
  "EXPIRED",
  "QUARANTINE",
  "SAMPLE",
  "RETURN",
  "REFUND",
  "CANCELLATION",
  "ORDER",
  "OTHER",
];

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "Invalid JSON payload" }, 400);

  const productId = safeText(b.productId, 120);
  if (!productId) {
    return json({ error: "Product identifier is required." }, 422);
  }

  const reason = safeText(b.reason, 250);
  if (!reason) {
    return json({ error: "An audit reason is required for manual stock adjustments." }, 422);
  }

  const rawType = String(b.type || "STOCK_CORRECTION").toUpperCase() as InventoryMovementType;
  const type = VALID_TYPES.includes(rawType) ? rawType : "OTHER";

  const delta = b.delta !== undefined ? Number(b.delta) : undefined;
  const newStock = b.newStock !== undefined ? Number(b.newStock) : undefined;

  if (delta === undefined && newStock === undefined) {
    return json({ error: "Either delta or newStock must be specified." }, 422);
  }

  const result = await inventoryService.adjustStock({
    productId,
    variantId: b.variantId ? safeText(b.variantId, 80) : undefined,
    delta,
    newStock,
    type,
    reason,
    notes: b.notes ? safeText(b.notes, 500) : undefined,
    actor: user.name || user.email || "Staff Admin",
  });

  if (!result.success) {
    return json({ error: result.error || "Failed to adjust stock." }, 422);
  }

  return json({
    success: true,
    message: "Stock adjusted successfully.",
    transaction: result.transaction,
    newStock: result.newStock,
  });
}
