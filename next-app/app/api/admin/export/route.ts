import { requireUser } from "@/lib/http";
import { NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function generateCSV(headers: string[], rows: Array<Record<string, unknown>>): string {
  const headerRow = headers.map(escapeCSV).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCSV(row[h] ?? "")).join(",")
  );
  // Prepend UTF-8 BOM so Excel opens Hindi/Special chars correctly
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get("dataset") || "b2b";
  const dateStr = new Date().toISOString().slice(0, 10);

  let csvContent = "";
  const filename = `queenscare-${dataset}-${dateStr}.csv`;

  switch (dataset) {
    case "b2b": {
      const records = fileDb.findMany("b2bApplications", () => true);
      const headers = [
        "id",
        "company",
        "businessType",
        "name",
        "designation",
        "email",
        "phone",
        "whatsapp",
        "website",
        "address",
        "city",
        "state",
        "country",
        "pincode",
        "gstNumber",
        "drugLicence",
        "panNumber",
        "yearsInBusiness",
        "distributionNetwork",
        "storeCount",
        "regionsCovered",
        "partnershipType",
        "productInterest",
        "requirementVolume",
        "territory",
        "existingBrands",
        "additionalRequirements",
        "message",
        "documentUrl",
        "documentFileName",
        "consent",
        "status",
        "notes",
        "createdAt",
      ];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "stores":
    case "locations": {
      const records = fileDb.findMany("storeLocations", () => true);
      const headers = [
        "id",
        "name",
        "type",
        "contactPerson",
        "phone",
        "whatsapp",
        "email",
        "address",
        "city",
        "state",
        "pincode",
        "country",
        "latitude",
        "longitude",
        "region",
        "productsHandled",
        "openingHours",
        "website",
        "directionsUrl",
        "isAuthorized",
        "isFeatured",
        "isActive",
        "isVisible",
        "createdAt",
      ];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "careers": {
      const records = fileDb.findMany("careerApplications", () => true);
      const headers = [
        "id",
        "name",
        "email",
        "phone",
        "whatsapp",
        "position",
        "department",
        "city",
        "experience",
        "currentCompany",
        "currentDesignation",
        "highestQualification",
        "linkedinUrl",
        "portfolioUrl",
        "message",
        "resumeUrl",
        "resumeFileName",
        "status",
        "consent",
        "notes",
        "createdAt",
      ];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "customers": {
      const records = fileDb.findMany("users", () => true);
      const headers = ["id", "name", "email", "phone", "role", "createdAt"];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "subscribers": {
      const records = fileDb.findMany("newsletterSubscribers", () => true);
      const headers = ["id", "email", "source", "status", "createdAt"];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "orders": {
      const records = fileDb.findMany("orders", () => true);
      const headers = [
        "id",
        "trackingCode",
        "total",
        "subtotal",
        "status",
        "paymentStatus",
        "paymentMethod",
        "createdAt",
      ];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "contacts": {
      const records = fileDb.findMany("contactEnquiries", () => true);
      const headers = ["id", "name", "email", "phone", "subject", "message", "status", "createdAt"];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "reviews": {
      const records = fileDb.findMany("reviews", () => true);
      const headers = ["id", "productId", "rating", "title", "content", "userName", "verified", "createdAt"];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "tax":
    case "gst": {
      const orders = fileDb.findMany("orders", () => true);
      const settings = fileDb.findMany("settings", (s: Record<string, unknown>) => String(s.key || "").startsWith("invoice_snapshot_"));
      const snapshotMap = new Map<string, Record<string, unknown>>();
      for (const s of settings) {
        const orderId = String(s.key).replace("invoice_snapshot_", "");
        const val = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        if (val) snapshotMap.set(orderId, val as Record<string, unknown>);
      }

      const rows: Array<Record<string, unknown>> = [];
      for (const o of orders) {
        const snap = snapshotMap.get(String(o.id));
        const shipping = (o.shipping || snap?.shipping || {}) as Record<string, unknown>;
        const invNo = String(snap?.invoiceNo || o.invoiceNo || `QC-INV-${o.id}`);
        const date = String(snap?.createdAt || o.createdAt || "").slice(0, 10);
        const customerName = String(shipping.fullName || o.customerName || "Customer");
        const state = String(shipping.state || o.state || "Maharashtra");
        const gstin = String(shipping.gstin || "");
        const isIntra = snap?.totalCgst ? Number(snap.totalCgst) > 0 : true;
        const supplyType = isIntra ? "INTRA_STATE" : "INTER_STATE";

        if (snap && Array.isArray(snap.lines) && snap.lines.length > 0) {
          for (const l of snap.lines as Array<Record<string, unknown>>) {
            rows.push({
              invoiceNumber: invNo,
              orderId: o.id,
              date,
              customerName,
              placeOfSupply: state,
              customerGstin: gstin,
              supplyType,
              hsnCode: l.hsnCode || "3004",
              itemName: l.name || l.productId,
              quantity: l.quantity || 1,
              unitPrice: l.unitPrice || 0,
              discount: l.discount || 0,
              taxableValue: l.taxableValue || 0,
              gstRate: `${l.gstRate || 0}%`,
              cgst: l.cgst || 0,
              sgst: l.sgst || 0,
              igst: l.igst || 0,
              totalTax: l.gstTotal || 0,
              lineTotal: l.lineTotal || 0,
              grandTotal: snap.grandTotal || o.total || 0,
              paymentMethod: o.paymentMethod || snap.paymentMethod || "cod",
              status: o.status || "pending",
            });
          }
        } else {
          rows.push({
            invoiceNumber: invNo,
            orderId: o.id,
            date,
            customerName,
            placeOfSupply: state,
            customerGstin: gstin,
            supplyType,
            hsnCode: "3004",
            itemName: "Products Order",
            quantity: 1,
            unitPrice: o.subtotal || o.total || 0,
            discount: o.discount || 0,
            taxableValue: o.subtotal || o.total || 0,
            gstRate: "12%",
            cgst: isIntra ? Math.round((Number(o.total || 0) * 0.06) * 100) / 100 : 0,
            sgst: isIntra ? Math.round((Number(o.total || 0) * 0.06) * 100) / 100 : 0,
            igst: !isIntra ? Math.round((Number(o.total || 0) * 0.12) * 100) / 100 : 0,
            totalTax: Math.round((Number(o.total || 0) * 0.12) * 100) / 100,
            lineTotal: o.total || 0,
            grandTotal: o.total || 0,
            paymentMethod: o.paymentMethod || "cod",
            status: o.status || "pending",
          });
        }
      }

      const headers = [
        "invoiceNumber", "orderId", "date", "customerName", "placeOfSupply", "customerGstin",
        "supplyType", "hsnCode", "itemName", "quantity", "unitPrice", "discount", "taxableValue",
        "gstRate", "cgst", "sgst", "igst", "totalTax", "lineTotal", "grandTotal",
        "paymentMethod", "status",
      ];
      csvContent = generateCSV(headers, rows);
      break;
    }

    default: {
      return new NextResponse("Unknown dataset. Supported: b2b, careers, customers, subscribers, orders, contacts, reviews, gst, tax", { status: 400 });
    }
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
