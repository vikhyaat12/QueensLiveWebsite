import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  let models = fileDb.findMany("models3d");

  // If initial seed is empty, check if existing products have 3D models to index
  if (models.length === 0) {
    const defaultModel = {
      id: "m3d-liko-q-flagship",
      name: "LIKO-Q™ Active Suspension Bottle",
      description: "Pharmaceutical amber suspension bottle with 360-degree inspection.",
      modelUrl: "/uploads/liko-q-suspension.png",
      format: "glb",
      posterUrl: "/uploads/liko-q-suspension.png",
      productId: "liko-q-suspension",
      isPrimary: true,
      pageAssignment: "homepage",
      sort: 0,
      scale: 1.0,
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      cameraDistance: 4.5,
      lightingIntensity: 1.4,
      autoRotate: true,
      rotationSpeed: 0.8,
      enableShadow: true,
      enableAnimation: true,
      active: true,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fileDb.insert("models3d", defaultModel);
    models = [defaultModel];
  }

  if (productId) {
    models = models.filter((m) => m.productId === productId);
  }

  models.sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));

  // Enrich with product names
  const products = fileDb.findMany("products");
  const enriched = models.map((m) => {
    const prod = products.find((p) => p.slug === m.productId || p.id === m.productId);
    return {
      ...m,
      productName: prod ? prod.name : m.productId ? "Assigned (Custom)" : "Unassigned",
    };
  });

  return json({ models: enriched, total: enriched.length });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();
    if (!body?.name?.trim()) return json({ error: "Model name is required." }, 422);
    if (!body?.modelUrl?.trim()) return json({ error: "Model file URL or path is required." }, 422);

    const id = body.id || `m3d-${randomUUID().slice(0, 8)}`;
    const newModel: Record<string, unknown> = {
      id,
      name: String(body.name).trim(),
      description: String(body.description || "").trim(),
      modelUrl: String(body.modelUrl).trim(),
      format: String(body.format || (body.modelUrl.endsWith(".gltf") ? "gltf" : "glb")),
      posterUrl: String(body.posterUrl || "").trim(),
      productId: body.productId ? String(body.productId).trim() : undefined,
      isPrimary: Boolean(body.isPrimary ?? false),
      pageAssignment: String(body.pageAssignment || "none"),
      sort: Number(body.sort ?? 0),
      scale: Number(body.scale ?? 1.0),
      positionX: Number(body.positionX ?? 0),
      positionY: Number(body.positionY ?? 0),
      positionZ: Number(body.positionZ ?? 0),
      rotationX: Number(body.rotationX ?? 0),
      rotationY: Number(body.rotationY ?? 0),
      rotationZ: Number(body.rotationZ ?? 0),
      cameraDistance: Number(body.cameraDistance ?? 5),
      lightingIntensity: Number(body.lightingIntensity ?? 1.2),
      autoRotate: body.autoRotate !== false,
      rotationSpeed: Number(body.rotationSpeed ?? 0.5),
      enableShadow: body.enableShadow !== false,
      enableAnimation: body.enableAnimation !== false,
      active: body.active !== false,
      visible: body.visible !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fileDb.insert("models3d", newModel);

    // Audit log
    fileDb.insert("auditLogs", {
      action: "model3d_created",
      actorId: String(user.id || user.email),
      targetType: "model3d",
      targetId: id,
      details: `Created 3D model: ${newModel.name}`,
      createdAt: new Date().toISOString(),
    });

    return json({ ok: true, model: newModel }, 201);
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : "Failed to create 3D model." }, 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();
    const id = String(body?.id || "");
    if (!id) return json({ error: "Model ID is required." }, 422);

    const existing = fileDb.findOne("models3d", (m) => m.id === id);
    if (!existing) return json({ error: "3D model not found." }, 404);

    const patch: Record<string, unknown> = {
      ...body,
      updatedAt: new Date().toISOString(),
    };
    delete patch.id;

    fileDb.update("models3d", id, patch);

    return json({ ok: true, model: { ...existing, ...patch } });
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : "Failed to update 3D model." }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const force = searchParams.get("force") === "true";

  if (!id) return json({ error: "Model ID is required." }, 400);

  const model = fileDb.findOne("models3d", (m) => m.id === id);
  if (!model) return json({ error: "3D model not found." }, 404);

  // Reference checking
  if (!force) {
    const references: string[] = [];
    if (model.productId) {
      const prod = fileDb.findOne("products", (p) => p.slug === model.productId || p.id === model.productId);
      if (prod) references.push(`Assigned Product: ${prod.name || prod.slug}`);
    }
    if (model.pageAssignment && model.pageAssignment !== "none") {
      references.push(`Assigned Page: ${model.pageAssignment}`);
    }

    if (references.length > 0) {
      return json({
        error: `Cannot delete 3D model: It is active in: ${references.join(", ")}. Unassign it first or confirm force deletion.`,
        inUse: true,
        references,
      }, 409);
    }
  }

  fileDb.remove("models3d", id);

  fileDb.insert("auditLogs", {
    action: "model3d_deleted",
    actorId: String(user.id || user.email),
    targetType: "model3d",
    targetId: id,
    details: `Deleted 3D model: ${model.name}`,
    createdAt: new Date().toISOString(),
  });

  return json({ ok: true, message: "3D model deleted successfully." });
}
