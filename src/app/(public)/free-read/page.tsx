import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function FreeReadPage() {
  let works: { id: string; title: string; type: string; content: string | null; publishedAt: Date | null }[] = [];
  try {
    works = await prisma.work.findMany({
      where: { status: "published", publishMode: "whole" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        publishedAt: true,
      },
    });
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
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
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
        {/* Page heading */}
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
            Free Read
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
            Full works made freely available. Read at your leisure — no sign-up required.
          </p>
        </div>

        {works.length === 0 ? (
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
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {works.map((work) => {
              const preview = work.content
                ? stripHtml(work.content).slice(0, 220) + (stripHtml(work.content).length > 220 ? "…" : "")
                : "";

              return (
                <Link
                  key={work.id}
                  href={`/free-read/${work.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <article
                    className="hover-border-light"
                    style={{
                      background: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "4px",
                      padding: "clamp(1.25rem, 3vw, 2rem)",
                      transition: "border-color 0.2s",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "0.6rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.65rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--color-ink-muted)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "2px",
                          padding: "0.1rem 0.45rem",
                        }}
                      >
                        {work.type === "book" ? "Novel" : "Short Story"}
                      </span>
                      {work.publishedAt && (
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.75rem",
                            color: "var(--color-ink-faint)",
                            fontStyle: "italic",
                          }}
                        >
                          {work.publishedAt.toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>

                    <h2
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
                        fontWeight: 400,
                        color: "var(--color-ink)",
                        letterSpacing: "0.03em",
                        marginBottom: preview ? "0.75rem" : 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {work.title}
                    </h2>

                    {preview && (
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "clamp(0.9rem, 1.6vw, 1rem)",
                          color: "var(--color-ink-muted)",
                          lineHeight: 1.75,
                          marginBottom: "1rem",
                        }}
                      >
                        {preview}
                      </p>
                    )}

                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.95rem",
                        letterSpacing: "0.06em",
                        color: "var(--color-gold)",
                      }}
                    >
                      Read →
                    </span>
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
