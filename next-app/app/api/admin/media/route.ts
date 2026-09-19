import { json, requireUser } from "@/lib/http";
import { readdirSync, statSync, existsSync, unlinkSync } from "fs";
import { join, resolve, normalize } from "path";
import { fileDb } from "@/lib/commerce/file-db";
import { mediaStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const uploadDir = join(process.cwd(), "public", "uploads");
  const folders = ["products", "blog", "logos", "general", "banners", "testimonials", "reviews", "employees", "aplus"];
  const results: Array<{ folder: string; count: number; items: Array<{ name: string; url: string; size: number; type: string; modified: string }> }> = [];

  for (const folder of folders) {
    try {
      const dirPath = join(uploadDir, folder);
      if (!existsSync(dirPath)) continue;
      const files = readdirSync(dirPath).filter((f) => !f.startsWith("."));
      const items = files
        .map((name) => {
          try {
            const filePath = join(dirPath, name);
            const stat = statSync(filePath);
            return {
              name,
              url: `/uploads/${folder}/${name}`,
              size: stat.size,
              type: stat.isDirectory() ? "folder" : name.split(".").pop() || "unknown",
              modified: stat.mtime.toISOString(),
            };
          } catch {
            return { name, url: `/uploads/${folder}/${name}`, size: 0, type: "unknown", modified: "" };
          }
        })
        .filter((f) => f.type !== "folder");

      results.push({ folder, count: items.length, items });
    } catch {
      // Folder doesn't exist
    }
  }

  const allItems = results.flatMap((f) => f.items);
  return json({ folders: results, media: allItems, total: allItems.length });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const force = searchParams.get("force") === "true";

  if (!url || !url.startsWith("/uploads/")) {
    return json({ error: "Valid /uploads/ URL is required" }, 400);
  }

  const uploadDir = resolve(process.cwd(), "public", "uploads");
  const safeRelative = normalize(url.replace(/^\/uploads\//, "")).replace(/^(\.\.[\/\\])+/, "");
  const filePath = resolve(uploadDir, safeRelative);

  // Prevent path traversal outside public/uploads
  if (!filePath.startsWith(uploadDir)) {
    return json({ error: "Access denied: Invalid file path." }, 403);
  }

  // Check references across CMS before deletion unless force=true
  if (!force) {
    const references: string[] = [];
    try {
      const products = fileDb.findMany("products");
      products.forEach((p) => {
        if (p.image === url || p.thumbnail === url || (Array.isArray(p.images) && p.images.includes(url))) {
          references.push(`Product: ${p.name || p.slug}`);
        }
      });

      const sections = fileDb.findMany("homepageSections");
      sections.forEach((s) => {
        const str = JSON.stringify(s.content || "");
        if (str.includes(url)) {
          references.push(`Homepage Section: ${s.title || s.type}`);
        }
      });

      const employees = fileDb.findMany("employees");
      employees.forEach((e) => {
        if (e.photo === url || e.image === url) {
          references.push(`Team Member: ${e.name}`);
        }
      });

      const blogPosts = fileDb.findMany("blogPosts");
      blogPosts.forEach((b) => {
        if (b.image === url) {
          references.push(`Blog Post: ${b.title}`);
        }
      });
    } catch { /* proceed if reference check fails */ }

    if (references.length > 0) {
      return json({
        error: `Asset is currently in use by ${references.length} item(s): ${references.slice(0, 3).join(", ")}${references.length > 3 ? "..." : ""}. Remove references first or pass force=true to delete.`,
        inUse: true,
        references,
      }, 409);
    }
  }

  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      try {
        await mediaStore.delete(url);
      } catch {}
      return json({ success: true, message: "File deleted successfully" });
    }
    return json({ error: "File not found" }, 404);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed to delete file" }, 500);
  }
}

