import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: {
    id: string;
    eyebrowText: string | null;
    headline: string | null;
    bodyText: string | null;
    photoData: Uint8Array | null;
    status: string;
    user: { id: string };
  } | null = null;

  try {
    profile = await prisma.authorProfile.findUnique({
      where: { id },
      select: {
        id: true,
        eyebrowText: true,
        headline: true,
        bodyText: true,
        photoData: true,
        status: true,
        user: { select: { id: true } },
      },
    });
  } catch {
    // DB unavailable
  }

  if (!profile || profile.status !== "approved") notFound();

  const paragraphs = profile.bodyText
    ? profile.bodyText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        padding: "clamp(3rem, 6vw, 5rem) 1.5rem",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <Link
          href="/our-authors"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)",
            textDecoration: "none", letterSpacing: "0.04em", marginBottom: "2.5rem",
          }}
        >
          ← Our Authors
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: profile.photoData ? "minmax(0, 1fr) minmax(0, 2fr)" : "1fr",
            gap: "3rem",
            alignItems: "start",
          }}
        >
          {profile.photoData && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/author-photo/${profile.user.id}`}
                alt={profile.headline ?? "Author"}
                style={{
                  width: "100%", display: "block", borderRadius: "3px",
                  border: "1px solid var(--color-border)",
                }}
              />
            </div>
          )}

          <div>
            {profile.eyebrowText && (
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.18em",
                textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.5rem",
              }}>
                {profile.eyebrowText}
              </p>
            )}

            <h1 style={{
              fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 400, letterSpacing: "0.04em", color: "var(--color-ink)",
              lineHeight: 1.1, marginBottom: "0",
            }}>
              {profile.headline || "Author"}
            </h1>

            <div aria-hidden style={{ width: "48px", height: "1px", background: "var(--color-gold-dim)", margin: "1rem 0 1.75rem" }} />

            {paragraphs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {paragraphs.map((p, i) => (
                  <p key={i} style={{
                    fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.75,
                    color: "var(--color-ink-muted)", margin: 0,
                  }}>
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                No bio available.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
