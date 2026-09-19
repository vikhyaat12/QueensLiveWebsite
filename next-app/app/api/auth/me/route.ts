import { requireUser, json } from "@/lib/http";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return json({ user: null }, 200);
  }
  return json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status || "active",
    },
  });
}
