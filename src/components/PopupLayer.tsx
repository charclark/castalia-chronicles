"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";

type Entry = { id: string; title: string; content?: string | null; createdAt: Date };

export default function PopupLayer({
  ideas,
  notes,
  universeId,
}: {
  ideas: Entry[];
  notes: Entry[];
  universeId: string | null;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const popup = searchParams.get("popup");

  if (!popup || !universeId) return null;

  let title = "";
  let entries: Entry[] = [];
  let newHref = "";
  let entryHref: (id: string) => string = () => "#";

  if (popup === "ideas") {
    title = "Storyline Ideas";
    entries = ideas;
    newHref = "/admin/storyline-ideas/new";
    entryHref = (id) => `/admin/storyline-ideas/${id}`;
  } else if (popup === "notes") {
    title = "General Notes";
    entries = notes;
    newHref = "/admin/notes/new";
    entryHref = (id) => `/admin/notes/${id}`;
  } else {
    return null;
  }

  function close() {
    router.push(pathname, { scroll: false });
  }

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(10,8,12,0.75)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "4vh 1rem",
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {/* Panel */}
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          width: "100%",
          maxWidth: "760px",
          padding: "2rem",
          position: "relative",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 400,
              color: "var(--color-ink)",
              letterSpacing: "0.04em",
            }}
          >
            {title}
          </h2>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Link
              href={newHref}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.95rem",
                color: "var(--color-gold)",
                letterSpacing: "0.06em",
                textDecoration: "none",
                padding: "0.35rem 0.85rem",
                border: "1px solid var(--color-gold-dim)",
                borderRadius: "3px",
              }}
            >
              + New
            </Link>
            <button
              onClick={close}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                color: "var(--color-ink-muted)",
                fontSize: "1rem",
                cursor: "pointer",
                padding: "0.3rem 0.6rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Ornament */}
        <div
          style={{
            height: "1px",
            background: "var(--color-border)",
            marginBottom: "1.5rem",
          }}
        />

        {/* Entry cards */}
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--color-ink-faint)",
                fontStyle: "italic",
                marginBottom: "1.25rem",
              }}
            >
              No {title.toLowerCase()} yet.
            </p>
            <Link
              href={newHref}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.1rem",
                color: "var(--color-gold)",
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
            >
              Create the first one →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={entryHref(entry.id)}
                style={{
                  display: "block",
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "1.1rem 1.25rem",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-gold-dim)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-border)")
                }
              >
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.2rem",
                    fontWeight: 400,
                    color: "var(--color-ink)",
                    marginBottom: "0.4rem",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {entry.title}
                </h3>
                {entry.content && (
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.82rem",
                      color: "var(--color-ink-muted)",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {entry.content.replace(/<[^>]+>/g, "")}
                  </p>
                )}
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.72rem",
                    color: "var(--color-ink-faint)",
                    marginTop: "0.65rem",
                  }}
                >
                  {entry.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
