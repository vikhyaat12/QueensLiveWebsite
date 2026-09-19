import { json, requireUser } from "@/lib/http";
import { ticketStore, ticketConfigStore } from "@/lib/support/ticket-store";

export const dynamic = "force-dynamic";

/** GET — real support analytics for the Admin Reports tab. No fabricated numbers. */
export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  return json({
    reports: ticketStore.reports(),
    config: ticketConfigStore.get(),
  });
}
