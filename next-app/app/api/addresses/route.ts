import { json, requireUser } from "@/lib/http";
import { addressStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const addresses = await addressStore.list(user.id);
  return json({ addresses });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const { fullName, phone, address, city, state, pincode } = body;
  if (!fullName || !phone || !address || !city || !state || !pincode) {
    return json({ error: "All fields required (Full name, phone, address, city, state, pincode)" }, 422);
  }
  const addr = await addressStore.create(user.id, {
    label: body.label || "Home",
    fullName,
    phone,
    address,
    city,
    state,
    pincode,
    isDefault: Boolean(body.isDefault),
  });
  return json({ address: addr }, 201);
}

