import { permanentRedirect } from "next/navigation";
import { store } from "@/lib/commerce/store";
import { redirectStore } from "@/lib/commerce/store-extensions";
import OurStoryClient, { OurStoryData } from "./OurStoryClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const redirectTarget = await redirectStore.resolve("/about");
  if (redirectTarget) {
    permanentRedirect(redirectTarget.destination);
  }

  const item = await store.content.get("about");
  const data = (item?.value || {}) as OurStoryData;

  return <OurStoryClient initialData={data} />;
}

