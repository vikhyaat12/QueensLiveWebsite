import { json } from "@/lib/http";
import { pageSettingsStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const [activePages, liveHeaderNav, footerPages] = await Promise.all([
    pageSettingsStore.active(),
    pageSettingsStore.getLiveHeaderNav(),
    pageSettingsStore.footerVisible(),
  ]);

  return json({
    pages: activePages,
    header: liveHeaderNav,
    footer: footerPages,
  });
}
