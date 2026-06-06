import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import UniverseSharePanel from "./UniverseSharePanel";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getSession();
  const { view } = await searchParams;

  const universes = await prisma.universe.findMany({
    where: {
      archivedAt: null,
      OR: [
        { createdByUserId: session?.userId },
        ...(session?.isSuperAdmin ? [{ createdByUserId: null }] : []),
        { accesses: { some: { userId: session?.userId } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, description: true },
  });

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("selected-universe")?.value ?? null;
  const currentUniverse =
    universes.find((u) => u.id === cookieId) ?? universes[0] ?? null;

  // ── Share universe screen ──────────────────────────────────────────────────
  if (view === "share-universe" && currentUniverse) {
    // Determine if current user has edit access (creator or explicit edit grant)
    const universeRecord = await prisma.universe.findUnique({
      where: { id: currentUniverse.id },
      select: {
        createdByUserId: true,
        accesses: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    const isCreator =
      universeRecord?.createdByUserId === session?.userId ||
      (universeRecord?.createdByUserId === null && session?.isSuperAdmin);
    const editAccess = universeRecord?.accesses.find(
      (a) => a.userId === session?.userId && a.permission === "edit"
    );
    const canShare = isCreator || !!editAccess;

    const existingAccesses = (universeRecord?.accesses ?? [])
      .filter((a) => a.userId !== session?.userId)
      .map((a) => ({
        userId: a.userId,
        username: a.user.username,
        permission: a.permission as "view" | "edit",
      }));

    const otherUsers = await prisma.user.findMany({
      where: { id: { not: session?.userId } },
      orderBy: { username: "asc" },
      select: { id: true, username: true },
    });

    return (
      <div style={{ maxWidth: "620px" }}>
        <style>{`.admin-share-crimson-btn:hover { border-color: var(--color-crimson) !important; }`}</style>

        {/* Back link */}
        <Link
          href="/admin"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--color-ink-faint)",
            textDecoration: "none",
            letterSpacing: "0.04em",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            marginBottom: "1.75rem",
          }}
        >
          ← Back to Dashboard
        </Link>

        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 400,
            color: "var(--color-ink)",
            marginBottom: "0.3rem",
          }}
        >
          Share Universe
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.75rem" }}>
          {currentUniverse.name}
        </p>

        {/* Warning */}
        <div
          style={{
            background: "rgba(139,38,53,0.1)",
            border: "1px solid var(--color-crimson-dim)",
            borderLeft: "3px solid var(--color-crimson)",
            borderRadius: "4px",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
          }}
        >
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: "#d4848e", fontStyle: "normal" }}>Sharing the full universe</strong> will allow others to edit, alter, and delete all data from your universe.
            {" "}Note: You can use the <strong style={{ fontStyle: "normal" }}>Share</strong> button in the <strong style={{ fontStyle: "normal" }}>WRITING</strong> section to share just a book or story in read-only mode. This will preserve your universe.
          </p>
        </div>

        {/* Permission explanations */}
        <div
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ marginBottom: "0.75rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.15rem" }}>View Only</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", margin: 0 }}>Can browse all content in this universe but cannot make any changes.</p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.15rem" }}>Editorial</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", margin: 0 }}>Full access to add, edit, and delete characters, locations, works, and all other content in this universe. <em>Use with caution.</em></p>
          </div>
        </div>

        {canShare ? (
          <UniverseSharePanel
            universeId={currentUniverse.id}
            initialAccesses={existingAccesses}
            otherUsers={otherUsers}
          />
        ) : (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
            You have view-only access to this universe and cannot manage sharing.
          </p>
        )}
      </div>
    );
  }

  // ── Normal dashboard ───────────────────────────────────────────────────────

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

  // Does the current user have edit access to share this universe?
  let canShareCurrentUniverse = false;
  if (currentUniverse) {
    const universeRecord = await prisma.universe.findUnique({
      where: { id: currentUniverse.id },
      select: {
        createdByUserId: true,
        accesses: {
          where: { userId: session?.userId, permission: "edit" },
          select: { id: true },
        },
      },
    });
    canShareCurrentUniverse =
      universeRecord?.createdByUserId === session?.userId ||
      (universeRecord?.createdByUserId === null && (session?.isSuperAdmin ?? false)) ||
      (universeRecord?.accesses.length ?? 0) > 0;
  }

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
      <style>{`.admin-write-btn:hover, .admin-add-btn:hover { border-color: var(--color-gold) !important; } .admin-share-btn:hover { border-color: var(--color-crimson) !important; }`}</style>
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {canShareCurrentUniverse && (
                <Link
                  href="?view=share-universe"
                  className="admin-share-btn"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    color: "var(--color-crimson)",
                    border: "1px solid var(--color-crimson-dim)",
                    borderRadius: "3px",
                    padding: "0.25rem 0.6rem",
                    background: "transparent",
                    textDecoration: "none",
                    letterSpacing: "0.04em",
                    transition: "border-color 0.15s",
                  }}
                >
                  Share
                </Link>
              )}
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
                className="admin-write-btn"
              >
                Write →
              </Link>
            </div>
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
          addHref="/admin/characters/new"
          addLabel="+Character"
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
          addHref="/admin/locations/new"
          addLabel="+Location"
          style={cardBase}
          hasUniverse={!!currentUniverse}
          recentItems={(recentLocs as { id: string; name: string; locatedIn: string | null }[]).map((l) => ({
            id: l.id, name: l.name, sub: l.locatedIn ?? undefined, href: `/admin/locations/${l.id}`,
          }))}
        />

        {/* Writing */}
        <div style={{ ...cardBase, display: "flex", flexDirection: "column" }}>
          <Link href="/admin/works" style={{ textDecoration: "none", flexGrow: 1 }} className="admin-card-link">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>Writing</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>
              {(workCount as number) > 0 ? `${workCount} work${(workCount as number) !== 1 ? "s" : ""}` : "Books & short stories"}
            </p>
          </Link>
          <div style={{ marginTop: "0.75rem" }}>
            <Link
              href="/admin/works"
              className="admin-add-btn"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                color: "var(--color-gold)",
                border: "1px solid var(--color-gold-dim)",
                borderRadius: "3px",
                padding: "0.25rem 0.65rem",
                background: "transparent",
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "border-color 0.15s",
                display: "inline-block",
              }}
            >
              +Write
            </Link>
          </div>
        </div>

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
  addHref,
  addLabel,
  style,
  hasUniverse,
  recentItems,
}: {
  label: string;
  count: number;
  countLabel: string;
  href: string;
  addHref?: string;
  addLabel?: string;
  style: React.CSSProperties;
  hasUniverse: boolean;
  recentItems: { id: string; name: string; sub?: string; href: string }[];
}) {
  const addBtn = addHref && addLabel ? (
    <div style={{ marginTop: "0.75rem" }}>
      <Link
        href={addHref}
        className="admin-add-btn"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          color: "var(--color-gold)",
          border: "1px solid var(--color-gold-dim)",
          borderRadius: "3px",
          padding: "0.25rem 0.65rem",
          background: "transparent",
          textDecoration: "none",
          letterSpacing: "0.05em",
          transition: "border-color 0.15s",
          display: "inline-block",
        }}
      >
        {addLabel}
      </Link>
    </div>
  ) : null;

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
      {addBtn}
    </>
  );

  if (!href) {
    return <div style={style}>{inner}</div>;
  }

  return (
    <div style={style}>
      <Link href={href} style={{ textDecoration: "none", display: "block" }} className="admin-card-link">
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
      </Link>
      {addBtn}
    </div>
  );
}
