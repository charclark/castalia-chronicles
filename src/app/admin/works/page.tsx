import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createWork } from "@/app/actions/works";
import WorkSharePopup from "./WorkSharePopup";

export const dynamic = "force-dynamic";

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ share?: string }>;
}) {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const session = await getSession();
  const { share: shareWorkId } = await searchParams;

  const works = await prisma.work.findMany({
    where: { universeId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      publishMode: true,
      updatedAt: true,
      coverImage: { select: { id: true, label: true } },
    },
  });

  // Does current user have edit access (to show Share buttons)?
  const universeRecord = await prisma.universe.findUnique({
    where: { id: universeId },
    select: {
      createdByUserId: true,
      accesses: {
        where: { userId: session?.userId, permission: "edit" },
        select: { id: true },
      },
    },
  });
  const canShare =
    universeRecord?.createdByUserId === session?.userId ||
    (universeRecord?.createdByUserId === null && (session?.isSuperAdmin ?? false)) ||
    (universeRecord?.accesses.length ?? 0) > 0;

  // Share popup data
  let shareWork: { id: string; title: string } | null = null;
  let otherUsers: { id: string; username: string }[] = [];
  let initialShares: { userId: string; username: string }[] = [];

  if (shareWorkId && canShare) {
    shareWork = works.find((w) => w.id === shareWorkId) ?? null;
    if (shareWork) {
      [otherUsers, initialShares] = await Promise.all([
        prisma.user.findMany({
          where: { id: { not: session?.userId } },
          orderBy: { username: "asc" },
          select: { id: true, username: true },
        }),
        prisma.workShare.findMany({
          where: { workId: shareWorkId },
          include: { user: { select: { id: true, username: true } } },
        }).then((rows) => rows.map((r) => ({ userId: r.userId, username: r.user.username }))),
      ]);
    }
  }

  const books = works.filter((w) => w.type === "book");
  const stories = works.filter((w) => w.type === "short story");

  return (
    <div style={{ maxWidth: "860px" }}>
      {/* Share popup overlay */}
      {shareWork && (
        <WorkSharePopup
          workId={shareWork.id}
          workTitle={shareWork.title}
          otherUsers={otherUsers}
          initialShares={initialShares}
        />
      )}

      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.4rem",
        }}
      >
        Writing
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.88rem",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginBottom: "2.5rem",
        }}
      >
        Books and short stories in this universe. All works start private and must be explicitly published.
      </p>

      {/* ── Books ── */}
      <WorkSection
        title="Books"
        type="book"
        items={books}
        canShare={canShare}
        createAction={createWork}
      />

      <div style={{ height: "1px", background: "var(--color-border)", margin: "2.5rem 0" }} />

      {/* ── Short Stories ── */}
      <WorkSection
        title="Short Stories"
        type="short story"
        items={stories}
        canShare={canShare}
        createAction={createWork}
      />
    </div>
  );
}

// ── Section component ──────────────────────────────────────────────────────────

type WorkItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  publishMode: string | null;
  updatedAt: Date;
  coverImage: { id: string; label: string } | null;
};

function WorkSection({
  title,
  type,
  items,
  canShare,
  createAction,
}: {
  title: string;
  type: "book" | "short story";
  items: WorkItem[];
  canShare: boolean;
  createAction: (type: "book" | "short story") => Promise<void>;
}) {
  return (
    <section>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontWeight: 400,
            color: "var(--color-ink)",
            letterSpacing: "0.03em",
          }}
        >
          {title}
          {items.length > 0 && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.78rem",
                color: "var(--color-ink-faint)",
                marginLeft: "0.6rem",
                fontWeight: 400,
              }}
            >
              {items.length}
            </span>
          )}
        </h3>

        {/* Create button */}
        <form action={createAction.bind(null, type)}>
          <button
            type="submit"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.9rem",
              letterSpacing: "0.06em",
              color: "var(--color-gold)",
              background: "transparent",
              border: "1px solid var(--color-gold-dim)",
              borderRadius: "3px",
              padding: "0.3rem 0.85rem",
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            + New {type === "book" ? "Book" : "Short Story"}
          </button>
        </form>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
            padding: "1.25rem 0",
          }}
        >
          No {title.toLowerCase()} yet. Create one to get started.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {items.map((item) => (
            <WorkRow key={item.id} item={item} canShare={canShare} />
          ))}
        </div>
      )}
    </section>
  );
}

function WorkRow({ item, canShare }: { item: WorkItem; canShare: boolean }) {
  const lastEdited = item.updatedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="hover-border-gold work-row"
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        transition: "border-color 0.15s",
        overflow: "hidden",
      }}
    >
      {/* Main link — title area */}
      <Link
        href={`/admin/works/${item.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          padding: "0.9rem 1.25rem",
          textDecoration: "none",
          gap: "1rem",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.15rem",
            fontWeight: 400,
            color: "var(--color-ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {item.title}
        </span>
      </Link>

      {/* Right side: badge, share button, date */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          padding: "0.9rem 1.25rem 0.9rem 0",
          flexShrink: 0,
        }}
      >
        <StatusBadge status={item.status} publishMode={item.publishMode} />

        {canShare && (
          <Link
            href={`?share=${item.id}`}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-crimson)",
              border: "1px solid var(--color-crimson-dim)",
              borderRadius: "2px",
              padding: "0.1rem 0.45rem",
              textDecoration: "none",
              transition: "border-color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            Share
          </Link>
        )}

        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            color: "var(--color-ink-faint)",
          }}
        >
          {lastEdited}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  publishMode,
}: {
  status: string;
  publishMode: string | null;
}) {
  if (status !== "published") {
    return (
      <span style={{
        fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--color-ink-faint)",
        border: "1px solid var(--color-border)", borderRadius: "2px", padding: "0.1rem 0.45rem",
      }}>
        Private
      </span>
    );
  }
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--color-gold)",
      border: "1px solid var(--color-gold-dim)", borderRadius: "2px", padding: "0.1rem 0.45rem",
    }}>
      {publishMode === "snippet" ? "Snippet" : "Published"}
    </span>
  );
}
