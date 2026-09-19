import { faqStore } from "@/lib/commerce/store-extensions";
import { store } from "@/lib/commerce/store";
import FAQClient, { FAQItem } from "./FAQClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Frequently Asked Questions | Queens Care Laboratories",
  description:
    "Find answers to common questions about Queens Care pharmaceutical formulations, delivery timelines, guarantees, and clinical quality.",
};

export default async function Page() {
  let serverFaqs: FAQItem[] = [];

  try {
    const rawList = await faqStore.visible();
    if (Array.isArray(rawList) && rawList.length > 0) {
      serverFaqs = rawList.map((f: Record<string, unknown>) => ({
        id: String(f.id || ""),
        question: String(f.question || ""),
        answer: String(f.answer || ""),
        category: f.category ? String(f.category) : "General",
      }));
    } else {
      const cmsItem = await store.content.get("faq");
      const cmsArray = cmsItem?.value as Array<{ q: string; a: string; category?: string }> | undefined;
      if (Array.isArray(cmsArray) && cmsArray.length > 0) {
        serverFaqs = cmsArray.map((c) => ({
          question: c.q,
          answer: c.a,
          category: c.category || "General",
        }));
      }
    }
  } catch (e) {
    console.error("Error loading FAQs:", e);
  }

  return <FAQClient serverFaqs={serverFaqs} />;
}
