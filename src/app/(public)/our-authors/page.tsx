import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OurAuthorsPage() {
  let authors: {
    id: string;
    headline: string | null;
    eyebrowText: string | null;
    bodyText: string | null;
    photoData: Uint8Array | null;
    user: { id: string };
  }[] = [];

  try {
    authors = await prisma.authorProfile.findMany({
      where: { status: "approved" },
      orderBy: { approvedAt: "asc" },
      select: {
        id: true,
        headline: true,
        eyebrowText: true,
        bodyText: true,
        photoData: true,
        user: { select: { id: true } },
      },
    });
  } catch {
    // DB unavailable in local dev
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        padding: "clamp(3rem, 6vw, 5rem) 1.5rem",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", textDecoration: "none", letterSpacing: "0.04em", marginBottom: "2rem" }}
        >
          ← Home
        </Link>

        <div style={{ marginBottom: "clamp(2rem, 4vw, 3rem)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem" }}>
            The Writers
          </p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, letterSpacing: "0.04em", color: "var(--color-ink)", lineHeight: 1.1, marginBottom: "0" }}>
            Our Authors
          </h1>
          <div aria-hidden style={{ width: "48px", height: "1px", background: "var(--color-gold-dim)", marginTop: "1rem" }} />
        </div>

        {authors.length === 0 ? (
          <div style={{ padding: "4rem 0", textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", color: "var(--color-border-light)", display: "block", marginBottom: "1rem" }}>✦</span>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              Author profiles coming soon.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {authors.map((author) => {
              const hasPhoto = !!author.photoData;
              const preview = author.bodyText
                ? author.bodyText.length > 140
                  ? author.bodyText.slice(0, 140).trimEnd() + "…"
                  : author.bodyText
                : null;

              return (
                <Link
                  key={author.id}
                  href={`/our-authors/${author.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-gold-dim)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)")}
                  >
                    {/* Photo */}
                    <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "var(--color-bg-surface)" }}>
                      {hasPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/author-photo/${author.user.id}`}
                          alt={author.headline ?? "Author"}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "var(--font-heading)", fontSize: "3rem", color: "var(--color-border-light)" }}>✦</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: "1.25rem" }}>
                      <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                        {author.headline || "Author"}
                      </p>
                      {preview && (
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", lineHeight: 1.6, margin: 0 }}>
                          {preview}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
