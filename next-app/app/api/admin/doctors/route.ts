import { json, requireUser, safeText } from "@/lib/http";
import { doctorStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const doctors = await doctorStore.list();
  return json({ doctors });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));

  if (!body.name || !body.qualification) {
    return json({ error: "Name and qualifications are required." }, 422);
  }

  const doctor = await doctorStore.create({
    name: safeText(body.name, 100),
    qualification: safeText(body.qualification, 120),
    regNumber: safeText(body.regNumber || body.councilRegNo || "", 60),
    councilRegNo: safeText(body.regNumber || body.councilRegNo || "", 60),
    designation: safeText(body.designation || "Medical Specialist", 100),
    specialty: safeText(body.specialty || "dermatology", 80),
    clinic: safeText(body.clinic || "", 120),
    experience: safeText(body.experience || "", 80),
    email: safeText(body.email || "", 100),
    phone: safeText(body.phone || "", 30),
    bio: safeText(body.bio || body.message || "", 2000),
    photo: String(body.photo || body.image || ""),
    image: String(body.photo || body.image || ""),
    verified: Boolean(body.verified),
    visible: body.visible !== false,
    status: body.status || "approved",
  });

  return json({ doctor }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = safeText(body.name, 100);
  if (body.qualification !== undefined) updates.qualification = safeText(body.qualification, 120);
  if (body.regNumber !== undefined || body.councilRegNo !== undefined) {
    updates.regNumber = safeText(body.regNumber || body.councilRegNo || "", 60);
    updates.councilRegNo = safeText(body.regNumber || body.councilRegNo || "", 60);
  }
  if (body.designation !== undefined) updates.designation = safeText(body.designation, 100);
  if (body.specialty !== undefined) updates.specialty = safeText(body.specialty, 80);
  if (body.clinic !== undefined) updates.clinic = safeText(body.clinic, 120);
  if (body.experience !== undefined) updates.experience = safeText(body.experience, 80);
  if (body.email !== undefined) updates.email = safeText(body.email, 100);
  if (body.phone !== undefined) updates.phone = safeText(body.phone, 30);
  if (body.bio !== undefined) updates.bio = safeText(body.bio, 2000);
  if (body.photo !== undefined || body.image !== undefined) {
    updates.photo = String(body.photo || body.image || "");
    updates.image = String(body.photo || body.image || "");
  }
  if (body.verified !== undefined) updates.verified = Boolean(body.verified);
  if (body.visible !== undefined) updates.visible = Boolean(body.visible);
  if (body.status !== undefined) updates.status = String(body.status);

  const doctor = await doctorStore.update(body.id, updates);
  return json({ doctor });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await doctorStore.delete(id);
  return json({ ok: true });
}
