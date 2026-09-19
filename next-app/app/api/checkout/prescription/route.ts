import { json } from "@/lib/http";
import { writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

const SECURE_DIR = resolve(process.cwd(), "data", "secure-prescriptions");
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = ["pdf", "jpg", "jpeg", "png", "webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return json({ error: "Invalid Content-Type. Expected multipart/form-data." }, 400);
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return json({ error: "No prescription file provided." }, 400);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mime = file.type || "";

    if (!ALLOWED_EXT.includes(ext) && !ALLOWED_MIME.includes(mime)) {
      return json({
        error: "Invalid file format. Please upload a PDF, JPG, or PNG document.",
      }, 422);
    }

    if (file.size > MAX_SIZE) {
      return json({
        error: `File exceeds maximum allowed size of 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB uploaded).`,
      }, 422);
    }

    if (!existsSync(SECURE_DIR)) {
      await mkdir(SECURE_DIR, { recursive: true });
    }

    const key = `rx_${randomUUID()}.${ext}`;
    const filePath = join(SECURE_DIR, key);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    return json({
      success: true,
      prescriptionKey: key,
      filename: file.name.slice(0, 80),
      size: file.size,
      mimeType: mime || `application/${ext}`,
    });
  } catch (err: unknown) {
    return json({
      error: err instanceof Error ? err.message : "Failed to process prescription upload.",
    }, 500);
  }
}
