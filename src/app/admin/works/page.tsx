import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createWork } from "@/app/actions/works";

export default async function WorksPage() {
  const cookieStore = await cookies();
  const universeId = cookieStore.get("selected-universe")?.value;
  if (!universeId) notFound();

  const works = await prisma.work.findMany({
    where: { universeId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      updatedAt: true,
      coverImage: { select: { id: true, label: true } },
    },
  });

  const books = works.filter((w) => w.type === "book");
  const stories = works.filter((w) => w.type === "short story");

  return (
    <div style={{ maxWidth: "860px" }}>
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
        createAction={createWork}
      />

      <div style={{ height: "1px", background: "var(--color-border)", margin: "2.5rem 0" }} />

      {/* ── Short Stories ── */}
      <WorkSection
        title="Short Stories"
        type="short story"
        items={stories}
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
  updatedAt: Date;
  coverImage: { id: string; label: string } | null;
};

function WorkSection({
  title,
  type,
  items,
  createAction,
}: {
  title: string;
  type: "book" | "short story";
  items: WorkItem[];
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
        <form
          action={async () => {
            "use server";
            await createAction(type);
          }}
        >
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
            <WorkRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function WorkRow({ item }: { item: WorkItem }) {
  const lastEdited = item.updatedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/admin/works/${item.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        padding: "0.9rem 1.25rem",
        textDecoration: "none",
        transition: "border-color 0.15s",
        gap: "1rem",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--color-gold-dim)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--color-border)")
      }
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

      <div
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}
      >
        <StatusBadge status={item.status} />
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
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.65rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: published ? "var(--color-gold)" : "var(--color-ink-faint)",
        border: `1px solid ${published ? "var(--color-gold-dim)" : "var(--color-border)"}`,
        borderRadius: "2px",
        padding: "0.1rem 0.45rem",
      }}
    >
      {published ? "Published" : "Private"}
    </span>
  );
}
