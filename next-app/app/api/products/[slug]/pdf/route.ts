/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/commerce/store";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

const PURPLE = "#2A0F3A";
const GOLD = "#C19A6B";
const WHITE = "#FFFFFF";
const LIGHT_BG = "#FAF8F5";

async function fetchImageAsBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const product = await store.products.bySlug(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch extended data
  let full: any = null;
  try {
    full = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sort: "asc" } },
        variants: { where: { active: true }, orderBy: { sort: "asc" } },
        specifications: { orderBy: { sort: "asc" } },
        aplusSections: { where: { active: true }, orderBy: { sort: "asc" } },
      },
    });
  } catch {}

  // Get logo
  let logoBuffer: Buffer | null = null;
  try {
    const settings = (await import("@/lib/commerce/file-db")).fileDb.findMany("settings");
    const logoSetting = settings.find((s: any) => s.key === "logo");
    if (logoSetting?.value) {
      logoBuffer = await fetchImageAsBuffer(String(logoSetting.value));
    }
  } catch {}

  // Get product image
  let productImageBuffer: Buffer | null = null;
  if (product.image) {
    productImageBuffer = await fetchImageAsBuffer(product.image);
  }

  // Pre-fetch gallery images (can't await inside Promise executor)
  const galleryBuffers: Array<{ buf: Buffer; xPos: number }> = [];
  const galleryImages = full?.images || [];
  if (galleryImages.length > 1) {
    let xPos = 50;
    for (const img of galleryImages.slice(0, 4)) {
      if (!img.url) continue;
      const imgBuf = await fetchImageAsBuffer(img.url);
      if (imgBuf) galleryBuffers.push({ buf: imgBuf, xPos });
      xPos += 125;
    }
  }

  return new Promise<NextResponse>((resolve) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
      info: {
        Title: `${product.name} - Queens Care Laboratories`,
        Author: "Queens Care Laboratories",
        Subject: product.description || product.name,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(
        new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${slug}-queens-care.pdf"`,
            "Cache-Control": "no-store",
          },
        })
      );
    });
    doc.on("error", () => {
      resolve(NextResponse.json({ error: "PDF generation failed" }, { status: 500 }));
    });

    // ─── HEADER BAR ───
    doc.rect(0, 0, doc.page.width, 90).fill(PURPLE);

    // Logo
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 18, { fit: [54, 54] });
      } catch {}
    }

    // Brand text
    doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("QUEENS CARE LABORATORIES", logoBuffer ? 115 : 50, 28, { width: 400 });
    doc.font("Helvetica").fontSize(8).fillColor(GOLD).text("Pharmaceutical Excellence", logoBuffer ? 115 : 50, 50, { width: 400 });

    // Gold accent line
    doc.rect(0, 90, doc.page.width, 3).fill(GOLD);

    let y = 110;

    // ─── PRODUCT IMAGE ───
    if (productImageBuffer) {
      try {
        doc.image(productImageBuffer, 50, y, { fit: [200, 200] });
        doc.x = 270;
        const imgRightStart = 270;
        // Product name
        doc.font("Helvetica-Bold").fontSize(22).fillColor(PURPLE);
        doc.text(product.name, imgRightStart, y, { width: 280 });
        y += 35;

        if (product.category) {
          doc.font("Helvetica").fontSize(10).fillColor(GOLD);
          doc.text(String(product.category).toUpperCase(), imgRightStart, y, { width: 280 });
          y += 18;
        }

        // Price
        doc.font("Helvetica-Bold").fontSize(18).fillColor(PURPLE);
        doc.text(`\u20B9${product.price.toLocaleString("en-IN")}`, imgRightStart, y, { width: 280 });
        if (product.mrp && product.mrp > product.price) {
          doc.font("Helvetica").fontSize(12).fillColor("#888");
          doc.text(`MRP: \u20B9${product.mrp.toLocaleString("en-IN")}`, imgRightStart + 120, y + 4, { width: 160 });
        }
        y += 40;

        // Stock status
        const inStock = product.stock > 0;
        doc.font("Helvetica-Bold").fontSize(10).fillColor(inStock ? "#2d8a4e" : "#c0392b");
        doc.text(inStock ? "In Stock" : "Out of Stock", imgRightStart, y, { width: 280 });
        y += 20;

        // Tags
        if (product.tags) {
          doc.font("Helvetica").fontSize(9).fillColor("#666");
          doc.text(`Tags: ${product.tags}`, imgRightStart, y, { width: 280 });
          y += 15;
        }
        if ((product as Record<string, unknown>).sku) {
          doc.font("Helvetica").fontSize(9).fillColor("#666");
          doc.text(`SKU: ${(product as Record<string, unknown>).sku}`, imgRightStart, y, { width: 280 });
          y += 15;
        }

        y = Math.max(y, 270);
        doc.x = 50;
      } catch {
        // Fallback without image
        doc.font("Helvetica-Bold").fontSize(22).fillColor(PURPLE);
        doc.text(product.name, 50, y, { width: 500 });
        y += 35;
      }
    } else {
      // No image — full width text
      doc.font("Helvetica-Bold").fontSize(24).fillColor(PURPLE);
      doc.text(product.name, 50, y, { width: 500 });
      y += 35;

      if (product.category) {
        doc.font("Helvetica").fontSize(10).fillColor(GOLD);
        doc.text(String(product.category).toUpperCase(), 50, y, { width: 500 });
        y += 18;
      }

      doc.font("Helvetica-Bold").fontSize(18).fillColor(PURPLE);
      doc.text(`\u20B9${product.price.toLocaleString("en-IN")}`, 50, y, { width: 500 });
      if (product.mrp && product.mrp > product.price) {
        doc.font("Helvetica").fontSize(12).fillColor("#888");
        doc.text(`MRP: \u20B9${product.mrp.toLocaleString("en-IN")}`, 170, y + 4, { width: 200 });
      }
      y += 40;

      const inStock = product.stock > 0;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(inStock ? "#2d8a4e" : "#c0392b");
      doc.text(inStock ? "In Stock" : "Out of Stock", 50, y, { width: 500 });
      y += 25;
    }

    // ─── DIVIDER ───
    doc.moveTo(50, y).lineTo(545, y).strokeColor(GOLD).lineWidth(1).stroke();
    y += 15;

    // ─── DESCRIPTION ───
    if (product.description) {
      doc.font("Helvetica-Bold").fontSize(12).fillColor(PURPLE);
      doc.text("Description", 50, y, { width: 495 });
      y += 18;
      doc.font("Helvetica").fontSize(10).fillColor("#333");
      doc.text(String(product.description), 50, y, { width: 495, lineGap: 4 });
      y = doc.y + 15;
    }

    // ─── BENEFITS ───
    if (product.benefits) {
      if (y > 680) { doc.addPage(); y = 50; }
      doc.font("Helvetica-Bold").fontSize(12).fillColor(PURPLE);
      doc.text("Benefits", 50, y, { width: 495 });
      y += 18;
      doc.font("Helvetica").fontSize(10).fillColor("#333");
      doc.text(String(product.benefits), 50, y, { width: 495, lineGap: 4 });
      y = doc.y + 15;
    }

    // ─── INGREDIENTS ───
    if (product.ingredients) {
      if (y > 680) { doc.addPage(); y = 50; }
      doc.font("Helvetica-Bold").fontSize(12).fillColor(PURPLE);
      doc.text("Ingredients", 50, y, { width: 495 });
      y += 18;
      doc.font("Helvetica").fontSize(10).fillColor("#333");
      doc.text(String(product.ingredients), 50, y, { width: 495, lineGap: 4 });
      y = doc.y + 15;
    }

    // ─── HOW TO USE ───
    if (product.usage) {
      if (y > 680) { doc.addPage(); y = 50; }
      doc.font("Helvetica-Bold").fontSize(12).fillColor(PURPLE);
      doc.text("How to Use", 50, y, { width: 495 });
      y += 18;
      doc.font("Helvetica").fontSize(10).fillColor("#333");
      doc.text(String(product.usage), 50, y, { width: 495, lineGap: 4 });
      y = doc.y + 15;
    }

    // ─── SPECIFICATIONS ───
    const specs = full?.specifications || [];
    if (specs.length > 0) {
      if (y > 650) { doc.addPage(); y = 50; }
      doc.font("Helvetica-Bold").fontSize(12).fillColor(PURPLE);
      doc.text("Specifications", 50, y, { width: 495 });
      y += 18;
      for (const spec of specs) {
        if (y > 750) { doc.addPage(); y = 50; }
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#333");
        doc.text(`${spec.name}:`, 50, y, { width: 200 });
        doc.font("Helvetica").fontSize(10).fillColor("#555");
        doc.text(String(spec.value), 260, y, { width: 285 });
        y += 16;
      }
      y += 10;
    }

    // ─── VARIANTS ───
    const variants = full?.variants || [];
    if (variants.length > 0) {
      if (y > 680) { doc.addPage(); y = 50; }
      doc.font("Helvetica-Bold").fontSize(12).fillColor(PURPLE);
      doc.text("Available Variants", 50, y, { width: 495 });
      y += 18;
      for (const v of variants) {
        if (y > 750) { doc.addPage(); y = 50; }
        doc.font("Helvetica").fontSize(10).fillColor("#333");
        const variantPrice = v.price ? ` - \u20B9${Number(v.price).toLocaleString("en-IN")}` : "";
        doc.text(`\u2022 ${v.name || "Variant"}${variantPrice}`, 60, y, { width: 480 });
        y += 16;
      }
      y += 10;
    }

    // Gallery images are pre-fetched before doc creation
    // (see galleryBuffers above) — render them here
    for (const gb of galleryBuffers) {
      if (y > 620) { doc.addPage(); y = 50; gb.xPos = 50; }
      try {
        doc.image(gb.buf, gb.xPos, y, { fit: [115, 115] });
        gb.xPos += 125;
      } catch {}
    }
    if (galleryBuffers.length > 0) y += 130;

    // ─── FOOTER ───
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      // Footer bar
      doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(PURPLE);
      doc.font("Helvetica").fontSize(8).fillColor(WHITE);
      doc.text(
        `Queens Care Laboratories  |  queenscare.in/products/${slug}  |  Generated ${new Date().toLocaleDateString("en-IN")}`,
        50,
        doc.page.height - 28,
        { width: 495, align: "center" }
      );
      // Page number
      doc.font("Helvetica").fontSize(8).fillColor(GOLD);
      doc.text(`Page ${i + 1} of ${pageCount}`, 500, doc.page.height - 28, { width: 50, align: "right" });
    }

    doc.end();
  });
}
