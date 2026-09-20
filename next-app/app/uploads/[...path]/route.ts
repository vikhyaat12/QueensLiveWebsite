import { NextResponse } from "next/server";
import { join, normalize, extname } from "path";
import { existsSync, readFileSync, statSync } from "fs";

// MIME type dictionary for reliable static asset delivery
const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".pdf": "application/pdf",
  ".json": "application/json",
};

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const pathSegments = (await params).path;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // Sanitize path to prevent directory traversal
    const safeSubPath = normalize(pathSegments.join("/")).replace(/^(\.\.[\/\\])+/, "");

    // Search locations strictly scoped to uploads directories
    const uploadsDir = join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
    const dataUploadsDir = join(/*turbopackIgnore: true*/ process.cwd(), "data", "uploads");
    const candidatePaths = [
      join(/*turbopackIgnore: true*/ uploadsDir, safeSubPath),
      join(/*turbopackIgnore: true*/ dataUploadsDir, safeSubPath),
    ];

    let foundPath = "";
    for (const p of candidatePaths) {
      if (existsSync(p)) {
        const st = statSync(p);
        if (st.isFile()) {
          foundPath = p;
          break;
        }
      }
    }

    if (!foundPath) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const ext = extname(foundPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileBuffer = readFileSync(foundPath);
    const stat = statSync(foundPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error serving upload static asset:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
