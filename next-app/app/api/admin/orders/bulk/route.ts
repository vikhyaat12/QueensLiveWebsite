import { json, requireUser } from "@/lib/http";
import { orderStoreExtended } from "@/lib/commerce/store-extensions";

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  const { orderIds, action, reason, customNote } = body || {};

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return json({ error: "Please select at least one order." }, 422);
  }

  if (action !== "accept" && action !== "reject") {
    return json({ error: "Action must be 'accept' or 'reject'." }, 422);
  }

  if (action === "reject") {
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return json({ error: "A rejection reason is mandatory." }, 422);
    }
    if (reason === "Other" && (!customNote || typeof customNote !== "string" || !customNote.trim())) {
      return json({ error: "Please specify the custom reason for 'Other'." }, 422);
    }
  }

  const result = await orderStoreExtended.bulkUpdateStatus(
    orderIds,
    action,
    reason,
    customNote,
    String(user.id || user.email)
  );

  return json(result, result.success ? 200 : 422);
}
