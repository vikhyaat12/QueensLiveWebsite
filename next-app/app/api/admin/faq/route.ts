import { json, requireUser } from "@/lib/http";
import { faqStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  // Admin only — the public /faq page and homepage read faqStore directly
  // server-side; they never call this admin endpoint.
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const faqs = await faqStore.list();
  return json({ faqs });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.question || !body.answer) {
    return json({ error: "Question and answer are required." }, 422);
  }
  const faq = await faqStore.create({
    question: body.question,
    answer: body.answer,
    category: body.category || "General",
    sort: Number(body.sort || 0),
    visible: body.visible !== false,
  });
  return json({ faq }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["question", "answer", "category", "sort", "visible"]) {
    if (k in body) data[k] = body[k];
  }
  const faq = await faqStore.update(body.id, data);
  return json({ faq });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await faqStore.delete(id);
  return json({ ok: true });
}
