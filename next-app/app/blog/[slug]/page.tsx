import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { store } from "@/lib/commerce/store";
import { sanitizeHtml } from "@/lib/sanitize";
import { redirectStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const post = await store.posts.bySlug(slug);
  if (!post) {
    const redirectTarget = await redirectStore.resolve(`/blog/${slug}`);
    if (redirectTarget) {
      permanentRedirect(redirectTarget.destination);
    }
    return { title: "Post not found" };
  }
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: (post.ogImage || post.image) ? [post.ogImage || post.image!] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const post = await store.posts.bySlug(slug);
  if (!post) {
    const redirectTarget = await redirectStore.resolve(`/blog/${slug}`);
    if (redirectTarget) {
      permanentRedirect(redirectTarget.destination);
    }
    return notFound();
  }

  const allPosts = await store.posts.list();
  const currentIndex = allPosts.findIndex((p) => p.slug === post.slug);
  const prev = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const next = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const related = allPosts
    .filter((p) => p.slug !== post.slug && (p.category === post.category || p.tags?.split(",").some((t) => post.tags?.includes(t.trim()))))
    .slice(0, 3);

  const tags = post.tags ? post.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const articleImages = post.images ? post.images.split(",").map((i) => i.trim()).filter(Boolean) : [];

  return (
    <main className="editorial">
      <Link href="/blog" className="back">&larr; The Care Journal</Link>
      <p className="eyebrow">Queens Care Laboratories</p>

      <article style={{ maxWidth: 800 }}>
        {/* Category & meta */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12, color: "var(--muted)", marginBottom: 16, flexWrap: "wrap" }}>
          {post.category && <span style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>{post.category}</span>}
          {post.readTime && <span>{post.readTime}</span>}
          <span>{new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>

        {/* Title */}
        <h1 style={{ font: "clamp(36px,5vw,64px)/1.1 var(--font-display)", margin: "0 0 16px", letterSpacing: "-.03em" }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--muted)", marginBottom: 32, fontStyle: "italic" }}>
            {post.excerpt}
          </p>
        )}

        {/* Author */}
        {post.author && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, padding: "16px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}>
              {post.author.charAt(0)}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{post.author}</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* Featured image */}
        {post.image && (
          <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", marginBottom: 40 }}>
            <Image src={post.image} alt={post.title} fill sizes="(max-width: 820px) 100vw, 800px" style={{ objectFit: "cover", borderRadius: 4 }} priority />
          </div>
        )}

        {/* Article body */}
        <div style={{ fontSize: 17, lineHeight: 1.9, color: "var(--ink)", maxWidth: 720 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || post.body || "") }} />

        {/* Article images gallery */}
        {articleImages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 40 }}>
            {articleImages.map((img, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
                <Image src={img} alt={`${post.title} - Image ${i + 1}`} fill sizes="(max-width: 650px) 100vw, 33vw" style={{ objectFit: "cover", borderRadius: 4 }} />
              </div>
            ))}
          </div>
        )}

        {/* Video */}
        {post.videoUrl && (
          <div style={{ marginTop: 40, marginBottom: 40 }}>
            {post.videoTitle && <h3 style={{ font: "20px var(--font-display)", marginBottom: 12 }}>{post.videoTitle}</h3>}
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
              <iframe
                src={post.videoUrl.replace("watch?v=", "embed/")}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                allowFullScreen
                title={post.videoTitle || post.title}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 40, padding: "20px 0", borderTop: "1px solid var(--line)" }}>
            {tags.map((tag) => (
              <span key={tag} style={{ padding: "4px 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", background: "var(--paper)", border: "1px solid var(--line)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Share */}
        <div style={{ display: "flex", gap: 16, marginTop: 24, padding: "20px 0", borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Share this article</span>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`/blog/${post.slug}`)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--purple)" }}>Twitter</a>
          <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`/blog/${post.slug}`)}&title=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--purple)" }}>LinkedIn</a>
        </div>

        {/* Prev/Next navigation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 40, padding: "24px 0", borderTop: "1px solid var(--line)" }}>
          {prev ? (
            <Link href={`/blog/${prev.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>&larr; Previous</p>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{prev.title}</p>
            </Link>
          ) : <div />}
          {next && (
            <Link href={`/blog/${next.slug}`} style={{ textDecoration: "none", color: "inherit", textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Next &rarr;</p>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{next.title}</p>
            </Link>
          )}
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <div style={{ marginTop: 60, paddingTop: 40, borderTop: "1px solid var(--line)" }}>
          <h2 style={{ font: "28px var(--font-display)", marginBottom: 24 }}>Continue reading</h2>
          <div className="journal-grid">
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <article>
                  {r.image && (
                    <div style={{ position: "relative", aspectRatio: "3/2", overflow: "hidden" }}>
                      <Image src={r.image} alt={r.title} fill sizes="(max-width: 650px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                    </div>
                  )}
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginTop: 12 }}>{(r.category || "").toUpperCase()}</p>
                  <h3 style={{ font: "18px var(--font-display)", margin: "6px 0" }}>{r.title}</h3>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back to journal */}
      <div style={{ display: "flex", gap: 24, marginTop: 60, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/blog" className="text-link">Back to journal <span>&larr;</span></Link>
        <Link href="/#collection" className="button">Explore the collection <span>&rarr;</span></Link>
      </div>
    </main>
  );
}
