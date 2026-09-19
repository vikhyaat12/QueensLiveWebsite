import { json, requireUser } from "@/lib/http";
import { mediaStore } from "@/lib/commerce/store-extensions";
import { storageProvider } from "@/lib/storage/storage-provider";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];
const ALLOWED_3D_TYPES = ["model/gltf-binary", "model/gltf+json", "application/octet-stream", "application/json"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_3D_TYPES];
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_3D_SIZE = 50 * 1024 * 1024; // 50MB

function detectImageDimensions(buffer: Buffer, ext: string): { width: number; height: number } | null {
  try {
    if (ext === "png" && buffer.length >= 24) {
      // PNG header: 8-byte signature, then IHDR chunk
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    if ((ext === "jpg" || ext === "jpeg") && buffer.length >= 2) {
      // Scan JPEG SOF markers
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const segLen = buffer.readUInt16BE(offset + 2);
        offset += 2 + segLen;
      }
    }
    if (ext === "gif" && buffer.length >= 10) {
      // GIF header: width at offset 6, height at offset 8 (little-endian)
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      return { width, height };
    }
    if (ext === "webp" && buffer.length >= 30) {
      // WebP RIFF header
      if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
        const fmt = buffer.toString("ascii", 12, 16);
        if (fmt === "VP8 " && buffer.length >= 30) {
          const width = buffer.readUInt16LE(26) & 0x3FFF;
          const height = buffer.readUInt16LE(28) & 0x3FFF;
          return { width, height };
        }
      }
    }
  } catch { /* ignore dimension detection errors */ }
  return null;
}

function isGifAnimated(buffer: Buffer): boolean {
  try {
    if (buffer.length < 13) return false;
    if (buffer.toString("ascii", 0, 3) !== "GIF") return false;
    // Check for multiple frames by looking for image descriptor markers after the first
    let offset = 13; // Skip GIF header
    let frameCount = 0;
    while (offset < buffer.length - 1) {
      if (buffer[offset] === 0x2C) { // Image Descriptor
        frameCount++;
        if (frameCount > 1) return true;
        // Skip image descriptor (9 bytes) + local color table
        offset += 10;
        if (buffer[offset] & 0x80) {
          const colorTableSize = Math.pow(2, (buffer[offset] & 0x07) + 1);
          offset += 1 + colorTableSize * 3;
        }
        offset++; // LZW minimum code size
        // Skip sub-blocks
        while (offset < buffer.length && buffer[offset] !== 0) {
          offset += buffer[offset] + 1;
        }
        offset++; // Skip terminator
      } else if (buffer[offset] === 0x21) { // Extension
        offset += 2; // Skip extension introducer + label
        while (offset < buffer.length && buffer[offset] !== 0) {
          offset += buffer[offset] + 1;
        }
        offset++; // Skip terminator
      } else {
        break;
      }
    }
  } catch { /* ignore */ }
  return false;
}

function sanitizeSvg(buffer: Buffer): boolean {
  const content = buffer.toString("utf8");
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /<foreignObject/i,
    /on\w+\s*=/i,
    /<!ENTITY/i,
    /<!DOCTYPE/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  return !dangerousPatterns.some((pattern) => pattern.test(content));
}

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const rawFolder = (formData.get("folder") as string) || "general";
    const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "general";

    if (!files || files.length === 0) {
      return json({ error: "No files provided" }, 400);
    }

    const results: Array<{
      url: string; name: string; size: number;
      type: string; width?: number; height?: number;
      isAnimated?: boolean; error?: string;
    }> = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const mime = file.type || "";
      const isImage = ALLOWED_IMAGE_TYPES.includes(mime) || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(mime) || ["mp4", "webm"].includes(ext);
      const is3D = ALLOWED_3D_TYPES.includes(mime) || ["glb", "gltf"].includes(ext);

      // Validate file type
      if (!isImage && !isVideo && !is3D) {
        results.push({ url: "", name: file.name, size: file.size, type: mime, error: `Unsupported file type: ${mime || ext}. Supported: JPG, PNG, WEBP, GIF, SVG, MP4, WEBM, GLB, GLTF` });
        continue;
      }

      // Validate file size
      const maxSize = is3D ? MAX_3D_SIZE : isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        const maxMB = is3D ? 50 : isVideo ? 100 : 15;
        results.push({ url: "", name: file.name, size: file.size, type: mime, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${maxMB}MB` });
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sanitize SVG against Stored XSS
      if (ext === "svg" || mime === "image/svg+xml") {
        if (!sanitizeSvg(buffer)) {
          results.push({ url: "", name: file.name, size: file.size, type: mime, error: "SVG rejected: Disallowed scripts or insecure elements detected" });
          continue;
        }
      }

      // Generate safe filename with timestamp
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase()
        .slice(0, 60);
      const filename = `${baseName}-${Date.now()}.${ext}`;

      const uploadResult = await storageProvider.uploadFile({
        buffer,
        filename,
        folder,
        mimeType: mime || (is3D ? "model/gltf-binary" : isVideo ? "video/mp4" : "image/jpeg"),
      });

      const url = uploadResult.url;

      // Detect dimensions for images
      let width: number | undefined;
      let height: number | undefined;
      let isAnimated = false;

      if (isImage) {
        const dims = detectImageDimensions(buffer, ext);
        if (dims) { width = dims.width; height = dims.height; }
        if (ext === "gif") { isAnimated = isGifAnimated(buffer); }
      }

      // Index uploaded file in media store
      try {
        await mediaStore.create({
          filename: filename,
          type: is3D ? "model3d" : isVideo ? "video" : "image",
          url,
          mimeType: mime || (is3D ? "model/gltf-binary" : isVideo ? "video/mp4" : "image/jpeg"),
          size: file.size,
          alt: file.name.replace(/\.[^.]+$/, ""),
          title: file.name,
          usedBy: folder,
          visible: true,
          createdAt: new Date().toISOString(),
        });
      } catch {}

      results.push({
        url,
        name: file.name,
        size: file.size,
        type: mime || ext,
        width,
        height,
        isAnimated,
      });
    }

    return json({ files: results });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Upload failed" }, 500);
  }
}
