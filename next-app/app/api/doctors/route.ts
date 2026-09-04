import { json } from "@/lib/http";
import { doctorStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const doctors = await doctorStore.listPublic();
  return json({ doctors });
}
