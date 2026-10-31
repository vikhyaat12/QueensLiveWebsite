"use client";

/**
 * Queens Care — Blog Page (branch only, new file)
 *
 * Posts come via props from /api/blog (existing API). Featured-image
 * fallback: NO external Unsplash stock photo (audit issue on main).
 * If a post has no image, no image is rendered. No post, author or
 * date is invented here.
 */

import Link from "next/link";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

export type QueensBlogPost = { slug: string; title: string; excerpt?: string; image?: string; category?: string; date?: string };

type Props = { posts: QueensBlogPost[]; categories?: string[]; cartCount?: number };

export default function QueensBlogPage({ posts, categories = [], cartCount = 0 }: Props) {
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <QueensSectionShell eyebrow="The care journal" title="Blog & Education" subtitle="Real posts from the existing blog API.">
        {categories.length > 0 ? (
          <div className="queens-blog-cats">
            {categories.map((c) => <Link key={c} href={`/blog?category=${encodeURIComponent(c)}`} className="queens-blog-chip">{c}</Link>)}
          </div>
        ) : null}
        {posts.length === 0 ? <p>No posts are published right now.</p> : (
          <div className="queens-blog-grid">
            {posts.map((post, i) => (
              <article key={post.slug} className="queens-card queens-blog-card" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
                {post.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.image} alt={post.title} loading="lazy" />
                ) : null}
                <div className="queens-blog-body">
                  {post.category ? <p className="queens-eyebrow">{post.category}</p> : null}
                  <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
                  {post.excerpt ? <p>{post.excerpt}</p> : null}
                  {post.date ? <p className="queens-blog-date">{post.date}</p> : null}
                  <Link href={`/blog/${post.slug}`} className="queens-btn queens-btn-outline">Read →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </QueensSectionShell>
      <style>{`
        .queens-blog-cats { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
        .queens-blog-chip { background: #faf7f1; color: #2a0f3a; padding: 8px 14px; border-radius: 999px; font-weight: 700; text-decoration: none; }
        .queens-blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .queens-blog-card { overflow: hidden; animation: queensBlogUp .5s ease both; }
        .queens-blog-card img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
        .queens-blog-body { padding: 20px; display: grid; gap: 10px; }
        .queens-blog-body h3 a { color: #2a0f3a; text-decoration: none; }
        .queens-blog-date { color: #6b6570; font-size: 13px; }
        @keyframes queensBlogUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .queens-blog-card { animation: none; } }
      `}</style>
    </main>
  );
}
