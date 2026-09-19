import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface ValidatedMedia {
  id: string;
  originalFilename: string;
  safeFilename: string;
  mimeType: string;
  type: "image" | "video";
  size: number;
  url: string;
  filePath: string;
}

// Allowed MIME types and extensions
const ALLOWED_IMAGES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

const ALLOWED_VIDEOS: Record<string, string[]> = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

// Maximum allowed sizes: Images = 10 MB, Videos = 50 MB
export const IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const VIDEO_MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Verify magic bytes signature to prevent extension/MIME spoofing
 */
export function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  switch (mimeType) {
    case "image/jpeg":
      // JPEG starts with FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case "image/png":
      // PNG starts with 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case "image/webp":
      // WebP starts with RIFF (52 49 46 46) ... WEBP (57 45 42 50)
      return (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      );

    case "image/gif":
      // GIF starts with GIF87a or GIF89a
      return (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) &&
        buffer[5] === 0x61
      );

    case "video/mp4":
      // MP4 typically has 'ftyp' at offset 4 (66 74 79 70)
      return (
        buffer[4] === 0x66 &&
        buffer[5] === 0x74 &&
        buffer[6] === 0x79 &&
        buffer[7] === 0x70
      );

    case "video/webm":
      // WebM starts with standard EBML header: 1A 45 DF A3
      return (
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      );

    default:
      return false;
  }
}

/**
 * Validate and save an uploaded media buffer securely
 */
export async function saveSupportMedia(
  buffer: Buffer,
  originalName: string,
  clientMime: string
): Promise<{ valid: boolean; error?: string; media?: ValidatedMedia }> {
  const mime = clientMime.toLowerCase().trim();
  const isImage = Object.keys(ALLOWED_IMAGES).includes(mime);
  const isVideo = Object.keys(ALLOWED_VIDEOS).includes(mime);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported file type "${mime}". Allowed: JPG, PNG, WebP, GIF, MP4, WebM.`,
    };
  }

  // Size limit validation
  const maxSize = isImage ? IMAGE_MAX_SIZE : VIDEO_MAX_SIZE;
  if (buffer.length > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the limit of ${maxMb}MB for ${isImage ? "images" : "videos"}.`,
    };
  }

  // Magic bytes inspection
  if (!verifyMagicBytes(buffer, mime)) {
    return {
      valid: false,
      error: "File content does not match the expected media format or may be corrupted.",
    };
  }

  // Safe file extension
  let safeExt = "";
  if (isImage) {
    safeExt = ALLOWED_IMAGES[mime][0];
  } else {
    safeExt = ALLOWED_VIDEOS[mime][0];
  }

  // Sanitize original filename for display (strip path, HTML, scripts)
  const sanitizedOriginal = path.basename(originalName || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");

  // Generate safe non-guessable storage filename
  const attachmentId = `att-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const safeFilename = `${attachmentId}${safeExt}`;

  // Target directory inside public/uploads/support
  const uploadDir = path.join(process.cwd(), "public", "uploads", "support");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, safeFilename);
  await fs.promises.writeFile(filePath, buffer);

  const publicUrl = `/uploads/support/${safeFilename}`;

  return {
    valid: true,
    media: {
      id: attachmentId,
      originalFilename: sanitizedOriginal,
      safeFilename,
      mimeType: mime,
      type: isImage ? "image" : "video",
      size: buffer.length,
      url: publicUrl,
      filePath,
    },
  };
}

