import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { fileDb } from "@/lib/commerce/file-db";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) {
  let product = await store.products.bySlug(slug);
  if (!product && slug === "lumine-c") {
    product = await store.products.bySlug("lumine-c-serum");
  }
  if (!product) {
    const p = fileDb.findOne("products", (item: Record<string, unknown>) => item.slug === slug || item.id === slug);
    if (p) product = p as any;
  }
  return product;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return json({ error: "Not found" }, 404);

  // Check fileDb first for instant 3D model configuration
  const fileModel = fileDb.findOne("models3d", (m: Record<string, unknown>) => m.productId === product.id || m.productId === slug);
  if (fileModel) {
    return json({ model: fileModel });
  }

  // Fallback to prisma if connected
  try {
    const prismaModel = await prisma.product3DModel.findUnique({ where: { productId: product.id } });
    if (prismaModel) return json({ model: prismaModel });
  } catch {
    // Prisma offline/disconnected, gracefully proceed
  }

  return json({ model: null });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  if (!body.modelUrl) return json({ error: "modelUrl required" }, 422);

  const modelPayload = {
    id: `m3d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: body.name || `${product.name} 3D Model`,
    productId: product.id,
    productName: product.name,
    modelUrl: body.modelUrl,
    format: body.format || "glb",
    posterUrl: body.posterUrl || null,
    enabled: body.enabled !== false,
    visible: body.visible !== false,
    autoRotate: body.autoRotate !== false,
    rotationSpeed: Number(body.rotationSpeed) || 1.0,
    scale: Number(body.scale) || 1.0,
    cameraDistance: Number(body.cameraDistance) || 3.0,
    lightingIntensity: Number(body.lightingIntensity) || 1.5,
    updatedAt: new Date().toISOString(),
  };

  const existing = fileDb.findOne("models3d", (m: Record<string, unknown>) => m.productId === product.id);
  if (existing) {
    fileDb.update("models3d", String(existing.id), modelPayload);
  } else {
    fileDb.insert("models3d", modelPayload);
  }

  try {
    await prisma.product3DModel.upsert({
      where: { productId: product.id },
      update: { modelUrl: body.modelUrl, format: body.format || "glb", posterUrl: body.posterUrl || null, enabled: body.enabled !== false, visible: body.visible !== false, autoRotate: body.autoRotate !== false, rotationSpeed: body.rotationSpeed || 1.0 },
      create: { productId: product.id, modelUrl: body.modelUrl, format: body.format || "glb", posterUrl: body.posterUrl || null, enabled: body.enabled !== false, visible: body.visible !== false, autoRotate: body.autoRotate !== false, rotationSpeed: body.rotationSpeed || 1.0 },
    });
  } catch {}

  return json({ model: modelPayload }, 201);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  const existing = fileDb.findOne("models3d", (m: Record<string, unknown>) => m.productId === product.id);
  if (!existing) return json({ error: "No 3D model for this product" }, 404);

  const updated = fileDb.update("models3d", String(existing.id), {
    ...body,
    updatedAt: new Date().toISOString(),
  });

  try {
    const data: Record<string, unknown> = {};
    for (const k of ["modelUrl", "format", "posterUrl", "enabled", "visible", "autoRotate", "rotationSpeed", "cameraDistance", "mobileFallback"]) { if (k in body) data[k] = body[k]; }
    await prisma.product3DModel.update({ where: { productId: product.id }, data });
  } catch {}

  return json({ model: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return json({ error: "Not found" }, 404);

  const existing = fileDb.findOne("models3d", (m: Record<string, unknown>) => m.productId === product.id);
  if (existing) {
    fileDb.remove("models3d", String(existing.id));
  }

  try {
    await prisma.product3DModel.delete({ where: { productId: product.id } });
  } catch {}

  return json({ ok: true });
}
