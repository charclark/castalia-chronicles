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

  const works = await prisma.work.findMany({
    where,
    orderBy: { openCount: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      openCount: true,
      publishedAt: true,
    },
  });

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
    </div>
  );
}
