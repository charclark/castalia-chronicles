import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SnippetViewer from "./SnippetViewer";

export const dynamic = "force-dynamic";

type BuyLink = { label: string; url: string };

function parseBuyLinks(json: string | null): BuyLink[] {
  if (!json) return [];
  try { return JSON.parse(json); }
  catch { return []; }
}

export default async function BooksPage() {
  const books = await prisma.work.findMany({
    where: { type: "book", status: "published" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      publishMode: true,
      snippet: true,
      coverImageId: true,
      description: true,
      buyLinks: true,
      publishedAt: true,
    },
  });

  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        background: "var(--color-bg)",
        padding: "clamp(3rem, 8vw, 6rem) 1.5rem",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
            Published Books
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
            The Bookshelf
          </h1>
          <div
            aria-hidden
            style={{
              width: "48px",
              height: "1px",
              background: "var(--color-gold-dim)",
              margin: "0 auto",
            }}
          />
        </div>

        {books.length === 0 ? (
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
            Published titles will appear here. Check back soon.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
              gap: "clamp(1.5rem, 4vw, 2.5rem)",
            }}
          >
            {books.map((book) => {
              const buyLinkList = parseBuyLinks(book.buyLinks);
              const hasSnippet = book.publishMode === "snippet" && !!book.snippet;
              const isFreeRead = book.publishMode === "whole";

              return (
                <article
                  key={book.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  {/* Cover image */}
                  <div
                    style={{
                      position: "relative",
                      paddingTop: "150%",
                      background: "var(--color-bg-elevated)",
                      flexShrink: 0,
                    }}
                  >
                    {book.coverImageId ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/api/images/public/${book.coverImageId}`}
                        alt={`Cover of ${book.title}`}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          gap: "0.5rem",
                          padding: "1rem",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "3rem",
                            color: "var(--color-border-light)",
                          }}
                        >
                          ✦
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.72rem",
                            color: "var(--color-ink-faint)",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Book info */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      padding: "clamp(1rem, 3vw, 1.5rem)",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.3rem, 2.5vw, 1.7rem)",
                        fontWeight: 400,
                        color: "var(--color-ink)",
                        letterSpacing: "0.03em",
                        lineHeight: 1.2,
                        marginBottom: "0.6rem",
                      }}
                    >
                      {book.title}
                    </h2>

                    {book.publishedAt && (
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.75rem",
                          color: "var(--color-ink-faint)",
                          fontStyle: "italic",
                          marginBottom: "0.75rem",
                        }}
                      >
                        {book.publishedAt.toLocaleDateString("en-US", {
                          year: "numeric",
                        })}
                      </p>
                    )}

                    {book.description && (
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "clamp(0.88rem, 1.6vw, 0.96rem)",
                          color: "var(--color-ink-muted)",
                          lineHeight: 1.75,
                          marginBottom: "1.25rem",
                          flex: 1,
                        }}
                      >
                        {book.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {/* Buy links */}
                      {buyLinkList.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {buyLinkList.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pub-cta-primary"
                              style={{ fontSize: "0.88rem", padding: "0.55rem 1.1rem" }}
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Sample / read online */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {hasSnippet && book.snippet && (
                          <SnippetViewer title={book.title} snippet={book.snippet} />
                        )}
                        {isFreeRead && (
                          <Link
                            href={`/free-read/${book.id}`}
                            className="pub-cta-secondary"
                            style={{ fontSize: "0.88rem", padding: "0.55rem 1.1rem" }}
                          >
                            Read online
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
