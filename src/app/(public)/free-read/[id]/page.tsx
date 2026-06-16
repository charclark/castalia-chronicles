import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LikeButton from "./LikeButton";

export const dynamic = "force-dynamic";

type ContentSection = { title: string | null; html: string };

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sub = await prisma.freeReadSubmission.findFirst({
    where: { id, status: "approved" },
    select: {
      id: true,
      submissionType: true,
      selectedChapterIds: true,
      contentSnapshot: true,
      title: true,
      description: true,
      contentRating: true,
      coverBgIndex: true,
      coverImageData: true,
      publishedAt: true,
      user: { select: { username: true } },
      // Only fetched for backward-compat fallback when no snapshot exists
      work: {
        select: {
          id: true,
          type: true,
          content: true,
          chapters: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, content: true, order: true },
          },
        },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!sub) notFound();

  const hasCoverImage = !!sub.coverImageData;
  const coverSrc = hasCoverImage
    ? `/api/free-read-cover/${sub.id}`
    : sub.coverBgIndex
    ? `/cover-backgrounds/cover-bg-${sub.coverBgIndex}.jpg`
    : null;

  // Build content sections — prefer frozen snapshot, fall back to live content
  // for older approved submissions that predate the snapshot feature.
  const sections: ContentSection[] = [];

  if (sub.contentSnapshot) {
    try {
      const snap = JSON.parse(sub.contentSnapshot) as { sections: ContentSection[] };
      sections.push(...snap.sections);
    } catch { /* malformed snapshot — fall through to live content */ }
  }

  if (sections.length === 0) {
    // Fallback: read from live work/chapter content (pre-snapshot records)
    if (sub.submissionType === "full") {
      if (sub.work.content) {
        sections.push({ title: null, html: sub.work.content });
      }
    } else {
      let ids: string[] = [];
      try { ids = JSON.parse(sub.selectedChapterIds ?? "[]") as string[]; } catch { /* ignore */ }
      const idSet = new Set(ids);
      const ordered = sub.work.chapters
        .filter((c) => idSet.has(c.id))
        .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      for (const ch of ordered) {
        sections.push({ title: ch.title, html: ch.content ?? "" });
      }
    }
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        background: "var(--color-bg)",
        padding: "clamp(2.5rem, 6vw, 5rem) 1.5rem",
      }}
    >
      <article style={{ maxWidth: "680px", margin: "0 auto" }}>
        {/* Back link */}
        <Link
          href="/free-read"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--color-ink-faint)",
            textDecoration: "none",
            marginBottom: "2.5rem",
          }}
        >
          ← Back to Stories
        </Link>

        {/* Cover */}
        {coverSrc && (
          <div
            style={{
              width: "100%",
              maxWidth: "260px",
              margin: "0 auto 2.5rem",
              borderRadius: "4px",
              overflow: "hidden",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt=""
              style={{ width: "100%", display: "block", aspectRatio: "2/3", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Title block */}
        <header style={{ marginBottom: "2.5rem", textAlign: coverSrc ? "center" : "left" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-ink-faint)",
              marginBottom: "0.4rem",
            }}
          >
            {sub.work.type === "book" ? "Novel" : "Short Story"} · {sub.contentRating}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 400,
              color: "var(--color-ink)",
              letterSpacing: "0.04em",
              lineHeight: 1.15,
              marginBottom: "0.5rem",
            }}
          >
            {sub.title}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              color: "var(--color-ink-faint)",
              marginBottom: "1.25rem",
            }}
          >
            by @{sub.user.username}
          </p>
          <div
            aria-hidden
            style={{
              width: "48px",
              height: "1px",
              background: "var(--color-gold-dim)",
              margin: coverSrc ? "0 auto 1.25rem" : "0 0 1.25rem",
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(0.9rem, 1.6vw, 1rem)",
              fontStyle: "italic",
              color: "var(--color-ink-muted)",
              lineHeight: 1.75,
            }}
          >
            {sub.description}
          </p>
        </header>

        {/* Like button */}
        <div style={{ marginBottom: "3rem" }}>
          <LikeButton submissionId={sub.id} initialCount={sub._count.likes} />
        </div>

        {/* Content */}
        {sections.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
            {sections.map((sec, i) => (
              <section key={i}>
                {sec.title && (
                  <h2
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.4rem",
                      fontWeight: 400,
                      color: "var(--color-ink)",
                      marginBottom: "1.5rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {sec.title}
                  </h2>
                )}
                {sec.html ? (
                  <div className="tiptap-writing-area">
                    <div className="tiptap" dangerouslySetInnerHTML={{ __html: sec.html }} />
                  </div>
                ) : (
                  <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "var(--color-ink-faint)" }}>
                    Content coming soon.
                  </p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              fontStyle: "italic",
              color: "var(--color-ink-faint)",
            }}
          >
            Content coming soon.
          </p>
        )}

        {/* Footer ornament */}
        <div
          aria-hidden
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            marginTop: "4rem",
            marginBottom: "2rem",
          }}
        >
          <span style={{ display: "block", width: "60px", height: "1px", background: "linear-gradient(to right, transparent, var(--color-border-light))" }} />
          <span style={{ color: "var(--color-gold)", fontSize: "0.65rem", opacity: 0.8 }}>✦</span>
          <span style={{ display: "block", width: "60px", height: "1px", background: "linear-gradient(to left, transparent, var(--color-border-light))" }} />
        </div>

        {/* Bottom like + back */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <Link
            href="/free-read"
            style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-faint)", textDecoration: "none" }}
          >
            ← Back to Stories
          </Link>
          <LikeButton submissionId={sub.id} initialCount={sub._count.likes} />
        </div>
      </article>
    </main>
  );
}
