import { json } from "@/lib/http";
import { ourPeoplePageStore, employeeStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const [config, rawEmployees] = await Promise.all([
    ourPeoplePageStore.get(),
    employeeStore.list(),
  ]);

  const employees = ((rawEmployees as Record<string, unknown>[]) || []).filter(
    (e) => e.active !== false
  );

  return json({ config, employees });
}
