import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getSession();

  const universes = await prisma.universe.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, description: true },
  });

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("selected-universe")?.value ?? null;
  const currentUniverse =
    universes.find((u) => u.id === cookieId) ?? universes[0] ?? null;

  // Live universe data
  const [charCount, locCount, recentChars, recentLocs, workCount, unreadFeedback, subCount] =
    currentUniverse
      ? await Promise.all([
          prisma.character.count({ where: { universeId: currentUniverse.id } }),
          prisma.location.count({ where: { universeId: currentUniverse.id } }),
          prisma.character.findMany({
            where: { universeId: currentUniverse.id },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { id: true, name: true, characterType: true },
          }),
          prisma.location.findMany({
            where: { universeId: currentUniverse.id },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { id: true, name: true, locatedIn: true },
          }),
          prisma.work.count({ where: { universeId: currentUniverse.id } }),
          prisma.feedbackMessage.count({ where: { read: false } }),
          prisma.mailingListEntry.count(),
        ])
      : [0, 0, [], [], 0, 0, 0];

  const cardBase: React.CSSProperties = {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    borderRadius: "4px",
    padding: "1.25rem",
    textDecoration: "none",
    display: "block",
    transition: "border-color 0.15s",
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.5rem",
        }}
      >
        Welcome back, {session?.username}.
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "2.5rem",
        }}
      >
        The chronicles await.
      </p>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2.5rem" }} />

      {/* Active universe callout */}
      {currentUniverse ? (
        <div
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-gold-dim)",
            borderLeft: "3px solid var(--color-gold)",
            borderRadius: "4px",
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
          }}
        >
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.3rem" }}>
            Active Universe
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--color-ink)", marginBottom: currentUniverse.description ? "0.35rem" : 0 }}>
            {currentUniverse.name}
          </p>
          {currentUniverse.description && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-muted)", marginBottom: "0.75rem" }}>
              {currentUniverse.description}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginTop: currentUniverse.description ? 0 : "0.5rem", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
              {[
                { label: "Characters", count: charCount as number },
                { label: "Locations",  count: locCount as number },
                { label: "Works",      count: workCount as number },
              ].map(({ label, count }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", color: count > 0 ? "var(--color-ink)" : "var(--color-ink-faint)", lineHeight: 1 }}>
                    {count}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-faint)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/admin/works"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                color: "var(--color-gold)",
                border: "1px solid var(--color-gold-dim)",
                borderRadius: "3px",
                padding: "0.3rem 0.75rem",
                background: "transparent",
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-gold)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
            >
              Write →
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px dashed var(--color-border-light)",
            borderRadius: "4px",
            padding: "2rem",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-muted)", marginBottom: "1rem" }}>
            No universe selected yet.
          </p>
          <Link href="/admin/universes" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-gold)", letterSpacing: "0.06em" }}>
            Create your first universe →
          </Link>
        </div>
      )}

      {/* Quick-access cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {/* Characters */}
        <DashCard
          label="Characters"
          count={charCount as number}
          countLabel="character"
          href={currentUniverse && (charCount as number) > 0 ? "?popup=characters" : ""}
          style={cardBase}
          hasUniverse={!!currentUniverse}
          recentItems={(recentChars as { id: string; name: string; characterType: string }[]).map((c) => ({
            id: c.id, name: c.name, sub: c.characterType, href: `/admin/characters/${c.id}`,
          }))}
        />

        {/* Locations */}
        <DashCard
          label="Locations"
          count={locCount as number}
          countLabel="location"
          href={currentUniverse && (locCount as number) > 0 ? "?popup=locations" : ""}
          style={cardBase}
          hasUniverse={!!currentUniverse}
          recentItems={(recentLocs as { id: string; name: string; locatedIn: string | null }[]).map((l) => ({
            id: l.id, name: l.name, sub: l.locatedIn ?? undefined, href: `/admin/locations/${l.id}`,
          }))}
        />

        {/* Writing */}
        <Link href="/admin/works" style={cardBase} className="admin-card-link">
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>Writing</h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>
            {(workCount as number) > 0 ? `${workCount} work${(workCount as number) !== 1 ? "s" : ""}` : "Books & short stories"}
          </p>
        </Link>

        {/* Feedback */}
        <Link href="/admin/feedback" style={cardBase} className="admin-card-link">
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
            Feedback
            {(unreadFeedback as number) > 0 && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-crimson)", border: "1px solid var(--color-crimson-dim)", borderRadius: "2px", padding: "0.1rem 0.4rem", marginLeft: "0.5rem", letterSpacing: "0.08em" }}>
                {unreadFeedback} unread
              </span>
            )}
          </h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>Reader messages</p>
        </Link>

        {/* Mailing List */}
        <Link href="/admin/mailing-list" style={cardBase} className="admin-card-link">
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>Mailing List</h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>
            {(subCount as number) > 0 ? `${subCount} subscriber${(subCount as number) !== 1 ? "s" : ""}` : "Subscribers & export"}
          </p>
        </Link>

        {/* Read Stats */}
        <Link href="/admin/free-read-stats" style={cardBase} className="admin-card-link">
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>Read Stats</h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>Free-read open counts</p>
        </Link>
      </div>
    </div>
  );
}

// ── Dashboard card with live data ─────────────────────────────────────────────

function DashCard({
  label,
  count,
  countLabel,
  href,
  style,
  hasUniverse,
  recentItems,
}: {
  label: string;
  count: number;
  countLabel: string;
  href: string;
  style: React.CSSProperties;
  hasUniverse: boolean;
  recentItems: { id: string; name: string; sub?: string; href: string }[];
}) {
  const inner = (
    <>
      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
        {label}
      </h3>
      {!hasUniverse ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>Select a universe first</p>
      ) : count === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>No {label.toLowerCase()} yet</p>
      ) : (
        <>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-gold)", marginBottom: "0.6rem" }}>
            {count} {countLabel}{count !== 1 ? "s" : ""}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {recentItems.map((item) => (
              <li key={item.id} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-muted)" }}>
                  {item.name}
                  {item.sub && <span style={{ color: "var(--color-ink-faint)", marginLeft: "0.3rem" }}>· {item.sub}</span>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );

  if (!href) {
    return <div style={style}>{inner}</div>;
  }

  return (
    <Link href={href} style={style} className="admin-card-link">
      {inner}
    </Link>
  );
}
