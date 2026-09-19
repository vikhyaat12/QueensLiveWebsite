import { json, requireUser } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const analytics = supportStore.getAnalytics();
  return json({ analytics });
}
