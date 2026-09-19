import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { fileDb } from "@/lib/commerce/file-db";
import { logAccessAuditEvent, extractClientMeta } from "@/lib/audit";

const CSV_COLUMNS = [
  "slug",
  "name",
  "category",
  "price",
  "mrp",
  "stock",
  "lowStockThreshold",
  "sku",
  "hsn",
  "gstRate",
  "active",
  "description",
  "benefits"
];

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = Array.isArray(val) ? val.join(" | ") : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let inQuotes = false;
    let curr = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j - 1] !== "\\")) {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(curr.trim().replace(/^["']|["']$/g, ""));
        curr = "";
      } else {
        curr += char;
      }
    }
    values.push(curr.trim().replace(/^["']|["']$/g, ""));

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : "";
    });
    rows.push(row);
  }

  return rows;
}

export async function GET(request: Request) {
  const user = await requireUser(request, ["admin"]);
  if (!user || "status" in user) return user ?? json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "export";

  if (action === "template") {
    const sampleRow = [
      "lumine-c-serum",
      "Lumine-C Clinical Radiance Serum",
      "Dermatology",
      "1499",
      "1899",
      "120",
      "15",
      "QC-LUM-01",
      "330499",
      "18",
      "true",
      "20% pure Ethyl Ascorbic Acid clinical radiance formulation",
      "Visibly brightens skin | Stimulates collagen | Fades dark spots"
    ];
    const csvContent = `${CSV_COLUMNS.join(",")}\n${sampleRow.map(escapeCsvField).join(",")}\n`;
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="queens-care-product-template.csv"',
      },
    });
  }

  if (action === "snapshots") {
    const snapshots = fileDb.findMany("bulkProductSnapshots") || [];
    const list = snapshots.map((s: Record<string, unknown>) => ({
      id: s.id,
      timestamp: s.timestamp,
      actorEmail: s.actorEmail,
      itemCount: s.itemCount,
      reason: s.reason,
    })).reverse().slice(0, 15);
    return json({ snapshots: list });
  }

  // Export current catalog
  const products = (await store.products.all()) || [];
  const rows = [CSV_COLUMNS.join(",")];

  for (const p of products) {
    const rec = p as Record<string, unknown>;
    const row = [
      escapeCsvField(rec.slug || rec.id),
      escapeCsvField(rec.name),
      escapeCsvField(rec.category),
      escapeCsvField(rec.price),
      escapeCsvField(rec.mrp),
      escapeCsvField(rec.stock),
      escapeCsvField(rec.lowStockThreshold || 10),
      escapeCsvField(rec.sku || ""),
      escapeCsvField(rec.hsn || ""),
      escapeCsvField(rec.gstRate || 18),
      escapeCsvField(rec.active !== false),
      escapeCsvField(rec.description || ""),
      escapeCsvField(Array.isArray(rec.benefits) ? rec.benefits : ""),
    ];
    rows.push(row.join(","));
  }

  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="queens-care-catalog-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

export async function POST(request: Request) {
  const user = await requireUser(request, ["admin"]);
  if (!user || "status" in user) return user ?? json({ error: "Unauthorized" }, 401);

  const clientMeta = extractClientMeta(request);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON payload" }, 400);

  const { action } = body;

  // 1. PREVIEW UPLOADED CSV
  if (action === "preview") {
    const rawCsv = String(body.csvText || "");
    if (!rawCsv.trim()) return json({ error: "CSV data is empty" }, 400);

    const rows = parseCsv(rawCsv);
    if (!rows.length) return json({ error: "No product rows found in CSV" }, 400);

    const existingProducts = (await store.products.all()) || [];
    const diffs: Array<{
      slug: string;
      name: string;
      isNew: boolean;
      changes: Array<{ field: string; oldVal: unknown; newVal: unknown }>;
      errors: string[];
    }> = [];

    let totalErrors = 0;

    for (const r of rows) {
      const slug = (r.slug || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const name = (r.name || "").trim();
      const errors: string[] = [];

      if (!slug && !name) {
        errors.push("Missing both product name and slug");
      }

      const price = parseFloat(r.price);
      if (isNaN(price) || price < 0) {
        errors.push(`Invalid price '${r.price}'`);
      }

      if (r.stock !== undefined && r.stock !== "") {
        const stock = parseInt(r.stock, 10);
        if (isNaN(stock) || stock < 0) {
          errors.push(`Invalid stock '${r.stock}'`);
        }
      }

      if (r.gstRate !== undefined && r.gstRate !== "") {
        const gst = parseFloat(r.gstRate);
        if (isNaN(gst) || gst < 0 || gst > 100) {
          errors.push(`Invalid GST rate '${r.gstRate}'`);
        }
      }

      if (errors.length) totalErrors++;

      const existing = existingProducts.find((p) => p.slug === slug || (slug === "" && p.name.toLowerCase() === name.toLowerCase()));
      const changes: Array<{ field: string; oldVal: unknown; newVal: unknown }> = [];

      if (existing) {
        const ex = existing as Record<string, unknown>;
        if (r.name && r.name !== ex.name) changes.push({ field: "name", oldVal: ex.name, newVal: r.name });
        if (!isNaN(price) && price !== ex.price) changes.push({ field: "price", oldVal: ex.price, newVal: price });
        if (r.mrp && Number(r.mrp) !== ex.mrp) changes.push({ field: "mrp", oldVal: ex.mrp, newVal: Number(r.mrp) });
        if (r.stock !== "" && parseInt(r.stock, 10) !== ex.stock) changes.push({ field: "stock", oldVal: ex.stock, newVal: parseInt(r.stock, 10) });
        if (r.category && r.category !== ex.category) changes.push({ field: "category", oldVal: ex.category, newVal: r.category });
        if (r.sku && r.sku !== ex.sku) changes.push({ field: "sku", oldVal: ex.sku, newVal: r.sku });
        if (r.hsn && r.hsn !== ex.hsn) changes.push({ field: "hsn", oldVal: ex.hsn, newVal: r.hsn });
        if (r.gstRate && Number(r.gstRate) !== ex.gstRate) changes.push({ field: "gstRate", oldVal: ex.gstRate, newVal: Number(r.gstRate) });
      }

      diffs.push({
        slug: slug || existing?.slug || "new-product",
        name: name || existing?.name || "Unnamed",
        isNew: !existing,
        changes,
        errors,
      });
    }

    return json({
      valid: totalErrors === 0,
      totalRows: rows.length,
      errorCount: totalErrors,
      preview: diffs,
    });
  }

  // 2. COMMIT UPLOADED ROWS
  if (action === "commit") {
    const rawCsv = String(body.csvText || "");
    if (!rawCsv.trim()) return json({ error: "CSV data is empty" }, 400);

    const rows = parseCsv(rawCsv);
    if (!rows.length) return json({ error: "No product rows found" }, 400);

    // Save rollback snapshot
    const currentProducts = (await store.products.all()) || [];
    const snapshotId = `SNAP-${Date.now()}`;
    fileDb.insert("bulkProductSnapshots", {
      id: snapshotId,
      timestamp: new Date().toISOString(),
      actorId: user.id,
      actorEmail: user.email,
      itemCount: currentProducts.length,
      reason: "Bulk CSV Catalog Import",
      catalog: currentProducts,
    });

    let updatedCount = 0;
    let createdCount = 0;

    for (const r of rows) {
      const slug = (r.slug || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const name = (r.name || "").trim();
      if (!slug && !name) continue;

      const price = parseFloat(r.price);
      if (isNaN(price) || price < 0) continue;

      const payload: Record<string, unknown> = {
        name,
        price,
      };

      if (slug) payload.slug = slug;
      if (r.category) payload.category = r.category.trim();
      if (r.mrp && !isNaN(parseFloat(r.mrp))) payload.mrp = parseFloat(r.mrp);
      if (r.stock !== "" && !isNaN(parseInt(r.stock, 10))) payload.stock = parseInt(r.stock, 10);
      if (r.lowStockThreshold && !isNaN(parseInt(r.lowStockThreshold, 10))) payload.lowStockThreshold = parseInt(r.lowStockThreshold, 10);
      if (r.sku) payload.sku = r.sku.trim();
      if (r.hsn) payload.hsn = r.hsn.trim();
      if (r.gstRate && !isNaN(parseFloat(r.gstRate))) payload.gstRate = parseFloat(r.gstRate);
      if (r.active !== "") payload.active = r.active.toLowerCase() === "true";
      if (r.description) payload.description = r.description.trim();
      if (r.benefits) payload.benefits = r.benefits.split("|").map((b) => b.trim()).filter(Boolean);

      const existing = currentProducts.find((p) => p.slug === slug || p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        await store.products.save({ ...existing, ...payload });
        updatedCount++;
      } else {
        await store.products.save(payload);
        createdCount++;
      }
    }

    await logAccessAuditEvent({
      action: "bulk_catalog_import",
      actorId: user.id,
      actorName: user.name || "Admin",
      actorEmail: user.email,
      targetId: snapshotId,
      targetName: "Product Catalog",
      targetEmail: "catalog@queenscare.in",
      details: `Bulk imported catalog: ${updatedCount} updated, ${createdCount} created. Snapshot: ${snapshotId}`,
      status: "success",
      ip: clientMeta.ip,
      userAgent: clientMeta.userAgent,
    });

    return json({
      ok: true,
      snapshotId,
      updatedCount,
      createdCount,
      totalProcessed: updatedCount + createdCount,
    });
  }

  // 3. BATCH FORMULA ADJUSTMENT (Price, Stock, GST)
  if (action === "batch_adjust") {
    const { targetCategory, adjustType, operation, value } = body;
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return json({ error: "Invalid adjustment value" }, 400);

    const currentProducts = (await store.products.all()) || [];
    const targets = targetCategory && targetCategory !== "all"
      ? currentProducts.filter((p) => p.category?.toLowerCase() === String(targetCategory).toLowerCase())
      : currentProducts;

    if (!targets.length) return json({ error: "No matching products found for adjustment" }, 400);

    // Save snapshot
    const snapshotId = `SNAP-${Date.now()}`;
    fileDb.insert("bulkProductSnapshots", {
      id: snapshotId,
      timestamp: new Date().toISOString(),
      actorId: user.id,
      actorEmail: user.email,
      itemCount: currentProducts.length,
      reason: `Batch ${adjustType} ${operation} (${value}) on ${targetCategory || "all"}`,
      catalog: currentProducts,
    });

    let affectedCount = 0;

    for (const p of targets) {
      const rec = p as Record<string, unknown>;
      const patch: Record<string, unknown> = { id: p.id, slug: p.slug };

      if (adjustType === "price") {
        const curPrice = Number(rec.price || 0);
        let newPrice = curPrice;
        if (operation === "percentage_increase") newPrice = Math.round(curPrice * (1 + numVal / 100));
        else if (operation === "percentage_decrease") newPrice = Math.max(1, Math.round(curPrice * (1 - numVal / 100)));
        else if (operation === "flat_increase") newPrice = curPrice + numVal;
        else if (operation === "flat_decrease") newPrice = Math.max(1, curPrice - numVal);
        else if (operation === "set_value") newPrice = numVal;
        patch.price = newPrice;
      } else if (adjustType === "stock") {
        const curStock = Number(rec.stock || 0);
        let newStock = curStock;
        if (operation === "flat_increase") newStock = curStock + Math.round(numVal);
        else if (operation === "flat_decrease") newStock = Math.max(0, curStock - Math.round(numVal));
        else if (operation === "set_value") newStock = Math.max(0, Math.round(numVal));
        patch.stock = newStock;
      } else if (adjustType === "gst") {
        patch.gstRate = numVal;
      }

      await store.products.save({ ...p, ...patch });
      affectedCount++;
    }

    await logAccessAuditEvent({
      action: "batch_product_adjustment",
      actorId: user.id,
      actorName: user.name || "Admin",
      actorEmail: user.email,
      targetId: snapshotId,
      targetName: "Product Catalog",
      targetEmail: "catalog@queenscare.in",
      details: `Batch adjusted ${adjustType} (${operation} ${value}) for ${affectedCount} products in ${targetCategory || "all"}. Snapshot: ${snapshotId}`,
      status: "success",
      ip: clientMeta.ip,
      userAgent: clientMeta.userAgent,
    });

    return json({
      ok: true,
      snapshotId,
      affectedCount,
    });
  }

  // 4. ROLLBACK
  if (action === "rollback") {
    const { snapshotId } = body;
    if (!snapshotId) return json({ error: "Missing snapshot ID" }, 400);

    const snapshot = fileDb.findOne("bulkProductSnapshots", (s) => s.id === snapshotId);
    if (!snapshot || !Array.isArray(snapshot.catalog)) {
      return json({ error: "Snapshot not found or corrupted" }, 404);
    }

    // Restore catalog
    for (const p of snapshot.catalog) {
      await store.products.save(p as Record<string, unknown>);
    }

    await logAccessAuditEvent({
      action: "rollback_product_catalog",
      actorId: user.id,
      actorName: user.name || "Admin",
      actorEmail: user.email,
      targetId: snapshotId,
      targetName: "Product Catalog",
      targetEmail: "catalog@queenscare.in",
      details: `Rolled back product catalog to snapshot ${snapshotId} (${snapshot.catalog.length} items restored).`,
      status: "success",
      ip: clientMeta.ip,
      userAgent: clientMeta.userAgent,
    });

    return json({
      ok: true,
      restoredCount: snapshot.catalog.length,
      snapshotTimestamp: snapshot.timestamp,
    });
  }

  // 5. BULK MULTI-SELECT UPDATE
  if (action === "bulk_update") {
    const { productIds, updates } = body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return json({ error: "productIds must be a non-empty array" }, 400);
    }
    if (!updates || typeof updates !== "object") {
      return json({ error: "updates must be a valid object" }, 400);
    }

    const validatedPatch: Record<string, unknown> = {};

    if (updates.active !== undefined) {
      validatedPatch.active = Boolean(updates.active);
    }
    if (updates.visible !== undefined) {
      validatedPatch.visible = Boolean(updates.visible);
      // Sync active if not explicitly specified
      if (updates.active === undefined) {
        validatedPatch.active = Boolean(updates.visible);
      }
    }
    if (updates.price !== undefined) {
      const price = parseFloat(String(updates.price));
      if (isNaN(price) || price < 0) {
        return json({ error: "Price must be a valid non-negative number" }, 400);
      }
      validatedPatch.price = price;
    }
    if (updates.mrp !== undefined) {
      const mrp = parseFloat(String(updates.mrp));
      if (isNaN(mrp) || mrp < 0) {
        return json({ error: "MRP must be a valid non-negative number" }, 400);
      }
      validatedPatch.mrp = mrp;
      validatedPatch.originalPrice = mrp;
    }
    if (updates.stock !== undefined) {
      const stock = parseInt(String(updates.stock), 10);
      if (isNaN(stock) || stock < 0) {
        return json({ error: "Stock must be a valid non-negative integer" }, 400);
      }
      validatedPatch.stock = stock;
    }
    if (updates.gstRate !== undefined) {
      const gst = parseFloat(String(updates.gstRate));
      if (isNaN(gst) || gst < 0 || gst > 100) {
        return json({ error: "GST rate must be between 0% and 100%" }, 400);
      }
      validatedPatch.gstRate = gst;
    }
    if (updates.hsn !== undefined) {
      validatedPatch.hsn = String(updates.hsn).trim();
    }
    if (updates.category !== undefined) {
      const cat = String(updates.category).trim();
      if (!cat) {
        return json({ error: "Category cannot be empty" }, 400);
      }
      validatedPatch.category = cat;
    }
    if (updates.lowStockThreshold !== undefined) {
      const thresh = parseInt(String(updates.lowStockThreshold), 10);
      if (isNaN(thresh) || thresh < 0) {
        return json({ error: "Low stock threshold must be a non-negative integer" }, 400);
      }
      validatedPatch.lowStockThreshold = thresh;
    }

    let priceAdj: { operation: string; value: number } | null = null;
    if (updates.priceAdjustment && typeof updates.priceAdjustment === "object") {
      const { operation, value } = updates.priceAdjustment as { operation: string; value: number };
      const numVal = parseFloat(String(value));
      if (!isNaN(numVal)) {
        priceAdj = { operation, value: numVal };
      }
    }

    let stockAdj: { operation: string; value: number } | null = null;
    if (updates.stockAdjustment && typeof updates.stockAdjustment === "object") {
      const { operation, value } = updates.stockAdjustment as { operation: string; value: number };
      const numVal = parseInt(String(value), 10);
      if (!isNaN(numVal)) {
        stockAdj = { operation, value: numVal };
      }
    }

    if (Object.keys(validatedPatch).length === 0 && !priceAdj && !stockAdj) {
      return json({ error: "No valid fields to update" }, 400);
    }

    const currentProducts = (await store.products.all()) || [];
    const idSet = new Set(productIds.map(String));

    const targets = currentProducts.filter(
      (p) => idSet.has(String(p.id)) || (p.slug && idSet.has(String(p.slug)))
    );

    if (targets.length === 0) {
      return json({ error: "No matching products found for the provided IDs" }, 404);
    }

    // Save snapshot before mutating
    const snapshotId = `SNAP-${Date.now()}`;
    const opDesc = [
      ...Object.keys(validatedPatch),
      priceAdj ? `priceAdj(${priceAdj.operation}: ${priceAdj.value})` : null,
      stockAdj ? `stockAdj(${stockAdj.operation}: ${stockAdj.value})` : null,
    ].filter(Boolean).join(", ");

    fileDb.insert("bulkProductSnapshots", {
      id: snapshotId,
      timestamp: new Date().toISOString(),
      actorId: user.id,
      actorEmail: user.email,
      itemCount: currentProducts.length,
      reason: `Bulk Update on ${targets.length} products (${opDesc})`,
      catalog: currentProducts,
    });

    let updatedCount = 0;
    for (const p of targets) {
      const rec = p as Record<string, unknown>;
      const itemPatch: Record<string, unknown> = { ...validatedPatch };

      if (priceAdj) {
        const curPrice = Number(rec.price || 0);
        let newPrice = curPrice;
        if (priceAdj.operation === "percentage_increase") newPrice = Math.round(curPrice * (1 + priceAdj.value / 100));
        else if (priceAdj.operation === "percentage_decrease") newPrice = Math.max(1, Math.round(curPrice * (1 - priceAdj.value / 100)));
        else if (priceAdj.operation === "flat_increase") newPrice = curPrice + priceAdj.value;
        else if (priceAdj.operation === "flat_decrease") newPrice = Math.max(1, curPrice - priceAdj.value);
        else if (priceAdj.operation === "set_value") newPrice = Math.max(0, priceAdj.value);
        itemPatch.price = newPrice;
      }

      if (stockAdj) {
        const curStock = Number(rec.stock || 0);
        let newStock = curStock;
        if (stockAdj.operation === "add") newStock = curStock + stockAdj.value;
        else if (stockAdj.operation === "subtract") newStock = Math.max(0, curStock - stockAdj.value);
        else if (stockAdj.operation === "set_value") newStock = Math.max(0, stockAdj.value);
        itemPatch.stock = newStock;
      }

      await store.products.save({
        ...p,
        ...itemPatch,
      });
      updatedCount++;
    }

    await logAccessAuditEvent({
      action: "bulk_product_update",
      actorId: user.id,
      actorName: user.name || "Admin",
      actorEmail: user.email,
      targetId: snapshotId,
      targetName: "Product Catalog",
      targetEmail: "catalog@queenscare.in",
      details: `Bulk updated ${updatedCount} products with fields: ${JSON.stringify(validatedPatch)}. Snapshot: ${snapshotId}`,
      status: "success",
      ip: clientMeta.ip,
      userAgent: clientMeta.userAgent,
    });

    return json({
      ok: true,
      snapshotId,
      updatedCount,
      modifiedFields: Object.keys(validatedPatch),
    });
  }

  return json({ error: "Unknown action" }, 400);
}
