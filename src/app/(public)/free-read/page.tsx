import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FreeReadPage() {
  let submissions: {
    id: string;
    title: string;
    description: string;
    contentRating: string;
    coverBgIndex: number | null;
    hasCoverImage: boolean;
    publishedAt: Date | null;
    likeCount: number;
    user: { username: string };
    work: { type: string };
  }[] = [];

  try {
    const raw = await prisma.freeReadSubmission.findMany({
      where: { status: "approved" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        contentRating: true,
        coverBgIndex: true,
        coverImageData: true,
        publishedAt: true,
        user: { select: { username: true } },
        work: { select: { type: true } },
        _count: { select: { likes: true } },
      },
    });
    submissions = raw.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      contentRating: s.contentRating,
      coverBgIndex: s.coverBgIndex,
      hasCoverImage: !!s.coverImageData,
      publishedAt: s.publishedAt,
      likeCount: s._count.likes,
      user: s.user,
      work: s.work,
    }));
  } catch {
    // DB unavailable in local dev — render empty state
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        background: "var(--color-bg)",
        padding: "clamp(3rem, 8vw, 6rem) 1.5rem",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--color-ink-faint)",
            textDecoration: "none",
            letterSpacing: "0.04em",
            marginBottom: "2rem",
          }}
        >
          ← Home
        </Link>

        <div style={{ marginBottom: "clamp(2.5rem, 6vw, 4rem)", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              marginBottom: "0.75rem",
            }}
          >
            Start Reading
          </p>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 400,
              color: "var(--color-ink)",
              letterSpacing: "0.04em",
              marginBottom: "1rem",
              lineHeight: 1.1,
            }}
          >
            Stories &amp; Excerpts
          </h1>
          <div
            aria-hidden
            style={{
              width: "48px",
              height: "1px",
              background: "var(--color-gold-dim)",
              margin: "0 auto 1.25rem",
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(0.95rem, 1.8vw, 1.05rem)",
              fontStyle: "italic",
              color: "var(--color-ink-muted)",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: 1.75,
            }}
          >
            Full works and excerpts made freely available. Read at your leisure — no sign-up required.
          </p>
        </div>

        {submissions.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              fontStyle: "italic",
              color: "var(--color-ink-faint)",
              textAlign: "center",
              marginTop: "2rem",
            }}
          >
            No works available yet. Check back soon.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1.75rem",
            }}
          >
            {submissions.map((sub) => {
              const coverSrc = sub.hasCoverImage
                ? `/api/free-read-cover/${sub.id}`
                : sub.coverBgIndex
                ? `/cover-backgrounds/cover-bg-${sub.coverBgIndex}.jpg`
                : null;

              const desc =
                sub.description.length > 150
                  ? sub.description.slice(0, 150).trimEnd() + "…"
                  : sub.description;

              return (
                <Link
                  key={sub.id}
                  href={`/free-read/${sub.id}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <article
                    className="hover-border-light"
                    style={{
                      background: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      transition: "border-color 0.2s",
                      cursor: "pointer",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Cover */}
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "2/3",
                        background: "var(--color-bg-elevated)",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {coverSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverSrc}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #1a1015 0%, #0d0810 100%)" }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {/* Type + Rating badges */}
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.6rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--color-ink-faint)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "2px",
                            padding: "0.08rem 0.4rem",
                          }}
                        >
                          {sub.work.type === "book" ? "Novel" : "Short Story"}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.6rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--color-ink-faint)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "2px",
                            padding: "0.08rem 0.4rem",
                          }}
                        >
                          {sub.contentRating}
                        </span>
                      </div>

                      <h2
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "1.1rem",
                          fontWeight: 400,
                          color: "var(--color-ink)",
                          lineHeight: 1.25,
                          margin: 0,
                        }}
                      >
                        {sub.title}
                      </h2>

                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.75rem",
                          color: "var(--color-ink-faint)",
                          margin: 0,
                        }}
                      >
                        @{sub.user.username}
                      </p>

                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.82rem",
                          color: "var(--color-ink-muted)",
                          lineHeight: 1.65,
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        {desc}
                      </p>

                      {sub.likeCount > 0 && (
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.72rem",
                            color: "var(--color-ink-faint)",
                            margin: 0,
                          }}
                        >
                          Liked by {sub.likeCount.toLocaleString()} reader{sub.likeCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
