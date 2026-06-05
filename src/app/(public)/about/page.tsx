import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLACEHOLDER_BIO = `Alexandra Castalia has been weaving tales of the supernatural since she first encountered a ghost in the library stacks — or so she claims. Her fiction explores the long shadows cast by immortality: the weight of centuries, the hunger that never quite fades, the rare and fragile warmth of connection across time.

She writes from somewhere between midnight and dawn, sustained by strong tea and the conviction that monsters deserve their own love stories.`;

export default async function AboutPage() {
  let settings: { bio: string | null; photoData: Uint8Array | null } | null = null;
  try {
    settings = await prisma.siteSettings.findFirst({
      where: { id: "singleton" },
      select: { bio: true, photoData: true },
    });
  } catch {
    // DB unavailable (e.g. local dev without DATABASE_URL) — use placeholders
  }

  const bio = settings?.bio ?? PLACEHOLDER_BIO;
  const hasPhoto = !!settings?.photoData;

  const paragraphs = bio.split(/\n\n+/).filter(Boolean);

  return (
    <main
      style={{
        minHeight: "calc(100vh - 58px)",
        padding: "clamp(3rem, 6vw, 5rem) 1.5rem",
        background:
          "radial-gradient(ellipse at 100% 0%, rgba(139,38,53,0.10) 0%, transparent 50%)," +
          "var(--color-bg)",
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
        {/* Section heading */}
        <div style={{ marginBottom: "clamp(2rem, 5vw, 3.5rem)" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              marginBottom: "0.5rem",
            }}
          >
            About the Author
          </p>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 400,
              letterSpacing: "0.04em",
              color: "var(--color-ink)",
              lineHeight: 1.1,
            }}
          >
            Alexandra Castalia
          </h1>
          <div
            aria-hidden
            style={{
              width: "48px",
              height: "1px",
              background: "var(--color-gold-dim)",
              marginTop: "1rem",
            }}
          />
        </div>

        {/* Content: photo + bio — stacks on mobile, side-by-side on wider screens */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(2rem, 5vw, 4rem)",
            alignItems: "flex-start",
          }}
        >
          {/* Photo */}
          <div style={{ flex: "0 0 auto", width: "clamp(180px, 28vw, 280px)" }}>
            {hasPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/api/site/photo"
                alt="Alexandra Castalia"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: "3px",
                  border: "1px solid var(--color-border)",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  paddingTop: "125%",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "3px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "0.4rem",
                    padding: "1rem",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "2rem",
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
                      fontStyle: "italic",
                    }}
                  >
                    Photo forthcoming
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          <div style={{ flex: "1 1 300px" }}>
            {paragraphs.map((p, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "clamp(1rem, 1.8vw, 1.1rem)",
                  lineHeight: 1.85,
                  color: "var(--color-ink-muted)",
                  marginBottom: "1.25rem",
                }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
