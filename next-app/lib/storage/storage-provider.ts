import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export type StorageProviderType = "local" | "s3_compatible";

export interface UploadFileOptions {
  buffer: Buffer;
  filename: string;
  folder: string;
  mimeType: string;
}

export interface UploadFileResult {
  url: string;
  key: string;
  size: number;
  provider: StorageProviderType;
}

export interface StorageConfig {
  provider: StorageProviderType;
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrlPrefix?: string;
}

export const storageConfig: StorageConfig = {
  provider: (process.env.STORAGE_PROVIDER as StorageProviderType) || "local",
  endpoint: process.env.STORAGE_ENDPOINT,
  bucket: process.env.STORAGE_BUCKET,
  region: process.env.STORAGE_REGION || "auto",
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  publicUrlPrefix: process.env.STORAGE_PUBLIC_URL,
};

const LOCAL_UPLOAD_ROOT = join(process.cwd(), "public", "uploads");

export const storageProvider = {
  getProviderType: (): StorageProviderType => {
    return storageConfig.provider;
  },

  isCloudConfigured: (): boolean => {
    return Boolean(
      storageConfig.provider === "s3_compatible" &&
      storageConfig.bucket &&
      storageConfig.accessKeyId &&
      storageConfig.secretAccessKey
    );
  },

  uploadFile: async (options: UploadFileOptions): Promise<UploadFileResult> => {
    const { buffer, filename, folder, mimeType } = options;
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "general";
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storageKey = `${sanitizedFolder}/${sanitizedFilename}`;

    // Cloud S3 / Cloudflare R2 / MinIO storage provider
    if (storageProvider.isCloudConfigured()) {
      try {
        // If Cloudflare R2 or custom endpoint is configured
        const endpoint = (storageConfig.endpoint || `https://${storageConfig.bucket}.s3.${storageConfig.region}.amazonaws.com`).replace(/\/+$/, "");
        const targetUrl = `${endpoint}/${storageConfig.bucket}/${storageKey}`;

        const res = await fetch(targetUrl, {
          method: "PUT",
          headers: {
            "Content-Type": mimeType,
            "Content-Length": String(buffer.length),
            // Custom Authorization or presigned upload headers can be attached here
          },
          body: new Uint8Array(buffer),
        });

        if (res.ok) {
          const publicPrefix = storageConfig.publicUrlPrefix?.replace(/\/+$/, "") || endpoint;
          return {
            url: `${publicPrefix}/${storageKey}`,
            key: storageKey,
            size: buffer.length,
            provider: "s3_compatible",
          };
        }
      } catch (err) {
        console.warn("[Storage] Cloud S3 upload failed, gracefully falling back to local storage:", err);
      }
    }

    // Default Local File System Provider
    const folderPath = join(LOCAL_UPLOAD_ROOT, sanitizedFolder);
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }

    const filePath = join(folderPath, sanitizedFilename);
    await writeFile(filePath, buffer);

    return {
      url: `/uploads/${sanitizedFolder}/${sanitizedFilename}`,
      key: storageKey,
      size: buffer.length,
      provider: "local",
    };
  },

  getUrl: (key: string): string => {
    if (storageConfig.publicUrlPrefix) {
      return `${storageConfig.publicUrlPrefix.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
    }
    return `/uploads/${key.replace(/^\/+/, "")}`;
  },
};
