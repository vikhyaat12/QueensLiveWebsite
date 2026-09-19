import { json, requireUser } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const settings = supportStore.getSettings();
  return json({ settings });
}

export async function PUT(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const agent = {
    id: user.id,
    name: user.name || "Admin",
    role: user.role,
  };

  const updated = supportStore.updateSettings(body, agent);
  return json({ success: true, settings: updated });
}
