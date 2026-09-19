import { json, safeText } from "@/lib/http";
import { inventoryService } from "@/lib/commerce/inventory";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);

  const email = safeText(body?.email, 150);
  const phone = body?.phone ? safeText(body.phone, 30) : undefined;
  const variantId = body?.variantId ? safeText(body.variantId, 80) : undefined;

  if (!email || !email.includes("@")) {
    return json({ error: "Please enter a valid email address." }, 422);
  }

  const result = await inventoryService.subscribeBackInStock({
    productSlug: slug,
    variantId,
    email,
    phone,
  });

  if (!result.success) {
    return json({ error: result.message }, 422);
  }

  return json({
    success: true,
    message: result.message,
    duplicate: result.duplicate,
  });
}
