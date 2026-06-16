import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function FreeReadStatsPage() {
  const session = await getSession();
  const isSuperAdmin = session?.isSuperAdmin ?? false;

  const where = isSuperAdmin
    ? { status: "published" as const, publishMode: "whole" as const }
    : {
        status: "published" as const,
        publishMode: "whole" as const,
        universe: { createdByUserId: session?.userId ?? "" },
      };

  const [works, likedSubs, discoverLikedSubs] = await Promise.all([
    prisma.work.findMany({
      where,
      orderBy: { openCount: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        openCount: true,
        publishedAt: true,
      },
    }),
    isSuperAdmin
      ? prisma.freeReadSubmission.findMany({
          where: { status: "approved" },
          orderBy: { title: "asc" },
          select: {
            id: true,
            title: true,
            user: { select: { username: true } },
            _count: { select: { likes: true } },
          },
        })
      : Promise.resolve([]),
    isSuperAdmin
      ? prisma.discoverBooksSubmission.findMany({
          where: { status: "approved" },
          orderBy: { bookTitle: "asc" },
          select: {
            id: true,
            bookTitle: true,
            authorName: true,
            user: { select: { username: true } },
            _count: { select: { likes: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const maxCount = works[0]?.openCount ?? 0;

  return (
    <div style={{ maxWidth: "700px" }}>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.4rem",
        }}
      >
        Free-Read Stats
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "2.5rem",
        }}
      >
        {isSuperAdmin
          ? "Open counts for publicly available free reads, sorted by most-opened."
          : "Open counts for your publicly available free reads, sorted by most-opened."}
      </p>

      {works.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
            padding: "2rem 0",
          }}
        >
          No free reads published yet. Publish a work with "Whole text" to
          track opens here.
        </p>
      ) : (
        <div
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {works.map((work, i) => {
            const barWidth =
              maxCount > 0 ? Math.round((work.openCount / maxCount) * 100) : 0;
            const publishedDate = work.publishedAt
              ? work.publishedAt.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <div
                key={work.id}
                style={{
                  padding: "1.1rem 1.5rem",
                  borderBottom:
                    i < works.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                {/* Title + count */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: "0.55rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.1rem",
                        color: "var(--color-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {work.title}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.75rem",
                        color: "var(--color-ink-faint)",
                        textTransform: "capitalize",
                      }}
                    >
                      {work.type}
                      {publishedDate ? ` · published ${publishedDate}` : ""}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.4rem",
                      color:
                        i === 0
                          ? "var(--color-gold)"
                          : "var(--color-ink-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {work.openCount.toLocaleString()}
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.72rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--color-ink-faint)",
                        marginLeft: "0.35rem",
                      }}
                    >
                      opens
                    </span>
                  </span>
                </div>

                {/* Bar */}
                <div
                  style={{
                    height: "3px",
                    background: "var(--color-border)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidth}%`,
                      background:
                        i === 0
                          ? "var(--color-gold)"
                          : "var(--color-border-light)",
                      borderRadius: "2px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isSuperAdmin && (
        <>
          <div style={{ height: "1px", background: "var(--color-border)", margin: "3.5rem 0" }} />

          {/* Discover Books Likes */}
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
            Discover Books Likes
          </h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.75rem" }}>
            Thumbs-up counts for approved Discover Books listings, alphabetical.
          </p>
          {discoverLikedSubs.length === 0 ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", padding: "0.75rem 0", marginBottom: "2rem" }}>
              No approved Discover Books listings yet.
            </p>
          ) : (
            <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "4px", overflow: "hidden", marginBottom: "2rem" }}>
              {discoverLikedSubs.map((sub, i) => (
                <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.9rem 1.5rem", borderBottom: i < discoverLikedSubs.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", color: "var(--color-ink)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sub.bookTitle}
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)" }}>
                      {sub.authorName} · @{sub.user.username}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "var(--color-ink-muted)", flexShrink: 0 }}>
                    {sub._count.likes.toLocaleString()}
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-faint)", marginLeft: "0.35rem" }}>
                      likes
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: "1px", background: "var(--color-border)", margin: "0.5rem 0 3.5rem" }} />

          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
            Start Reading Likes
          </h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.75rem" }}>
            Thumbs-up counts for approved Start Reading submissions, alphabetical.
          </p>
          {likedSubs.length === 0 ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", padding: "0.75rem 0" }}>
              No approved Start Reading submissions yet.
            </p>
          ) : (
            <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "4px", overflow: "hidden" }}>
              {likedSubs.map((sub, i) => (
                <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.9rem 1.5rem", borderBottom: i < likedSubs.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", color: "var(--color-ink)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sub.title}
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)" }}>
                      @{sub.user.username}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "var(--color-ink-muted)", flexShrink: 0 }}>
                    {sub._count.likes.toLocaleString()}
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-faint)", marginLeft: "0.35rem" }}>
                      likes
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
