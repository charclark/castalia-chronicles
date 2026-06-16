import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DiscoverBooksCover from "@/components/DiscoverBooksCover";
import DiscoverBooksLikeButton from "./DiscoverBooksLikeButton";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  let submissions: {
    id: string;
    bookTitle: string;
    authorName: string;
    coverBgIndex: number | null;
    hasCoverImage: boolean;
    purchaseUrl: string;
    purchaseLinkText: string;
    description: string;
    contentRating: string;
    likeCount: number;
  }[] = [];

  try {
    const raw = await prisma.discoverBooksSubmission.findMany({
      where: { status: "approved" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        bookTitle: true,
        authorName: true,
        coverBgIndex: true,
        coverImageData: true,
        purchaseUrl: true,
        purchaseLinkText: true,
        description: true,
        contentRating: true,
        _count: { select: { likes: true } },
      },
    });
    submissions = raw.map((s) => ({
      id: s.id,
      bookTitle: s.bookTitle,
      authorName: s.authorName,
      coverBgIndex: s.coverBgIndex,
      hasCoverImage: !!s.coverImageData,
      purchaseUrl: s.purchaseUrl,
      purchaseLinkText: s.purchaseLinkText,
      description: s.description,
      contentRating: s.contentRating,
      likeCount: s._count.likes,
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
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
            Discover Books
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
            Published titles will appear here. Check back soon.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
              gap: "clamp(1.5rem, 4vw, 2.5rem)",
            }}
          >
            {submissions.map((sub) => (
              <article
                key={sub.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {/* Cover — clicking opens purchase URL */}
                <a
                  href={sub.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", flexShrink: 0 }}
                  aria-label={`Purchase ${sub.bookTitle}`}
                >
                  <div style={{ width: "100%", aspectRatio: "2/3", overflow: "hidden" }}>
                    <DiscoverBooksCover
                      submissionId={sub.id}
                      hasCoverImage={sub.hasCoverImage}
                      coverBgIndex={sub.coverBgIndex}
                      bookTitle={sub.bookTitle}
                      authorName={sub.authorName}
                      width={300}
                    />
                  </div>
                </a>

                {/* Info panel */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: "clamp(1rem, 3vw, 1.4rem)",
                    gap: "0.5rem",
                  }}
                >
                  {/* Purchase link */}
                  <a
                    href={sub.purchaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.82rem",
                      fontStyle: "italic",
                      color: "var(--color-gold)",
                      textDecoration: "none",
                    }}
                  >
                    {sub.purchaseLinkText}
                  </a>

                  {/* Content rating badge */}
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.62rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-ink-faint)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "2px",
                      padding: "0.06rem 0.4rem",
                      alignSelf: "flex-start",
                    }}
                  >
                    {sub.contentRating}
                  </span>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "clamp(0.88rem, 1.5vw, 0.94rem)",
                      color: "var(--color-ink-muted)",
                      lineHeight: 1.75,
                      flex: 1,
                      margin: 0,
                    }}
                  >
                    {sub.description}
                  </p>

                  {/* Like button */}
                  <DiscoverBooksLikeButton
                    submissionId={sub.id}
                    initialCount={sub.likeCount}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
