import type { MetadataRoute } from "next";
import { store } from "@/lib/commerce/store";
import { pageSettingsStore, categoryStore, redirectStore, normalizePath } from "@/lib/commerce/store-extensions";

const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticBase = ["", "/shop", "/about", "/manufacturing", "/research-development", "/quality-assurance", "/contact", "/faq", "/b2b", "/doctors", "/blog", "/careers", "/privacy", "/terms", "/track-order"];

  const [products, posts, categories, cmsPages, activeRedirects] = await Promise.all([
    store.products.list(),
    store.posts.list(),
    categoryStore.list(),
    pageSettingsStore.active(),
    redirectStore.list({ active: true }),
  ]);

  const redirectedSources = new Set(activeRedirects.map((r) => normalizePath(r.source)));

  const isNotRedirected = (path: string) => !redirectedSources.has(normalizePath(path));

  const urls: MetadataRoute.Sitemap = [];

  // Base pages
  for (const path of staticBase) {
    if (isNotRedirected(path)) {
      urls.push({
        url: `${origin}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.7,
      });
    }
  }

  // CMS Pages
  for (const p of cmsPages) {
    const slug = String(p.slug || "").trim();
    if (slug && !slug.startsWith("#") && !slug.startsWith("http")) {
      const path = slug.startsWith("/") ? slug : `/${slug}`;
      if (!staticBase.includes(path) && isNotRedirected(path)) {
        urls.push({
          url: `${origin}${path}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  // Active Products
  for (const p of products) {
    const path = `/products/${p.slug}`;
    if (isNotRedirected(path)) {
      urls.push({
        url: `${origin}${path}`,
        lastModified: new Date(p.updatedAt || p.createdAt || new Date()),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Active Blog Posts
  for (const p of posts) {
    const path = `/blog/${p.slug}`;
    if (isNotRedirected(path)) {
      urls.push({
        url: `${origin}${path}`,
        lastModified: new Date(p.updatedAt || p.createdAt || new Date()),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // Active Categories
  for (const c of categories) {
    if (c.active !== false && c.visible !== false) {
      const path = `/categories/${c.slug}`;
      if (isNotRedirected(path)) {
        urls.push({
          url: `${origin}${path}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  return urls;
}

