import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const session = await getSession();

  const universes = await prisma.universe.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, description: true },
  });

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("selected-universe")?.value ?? null;
  const currentUniverse =
    universes.find((u) => u.id === cookieId) ?? universes[0] ?? null;

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

      <div
        style={{ height: "1px", background: "var(--color-border)", marginBottom: "2.5rem" }}
      />

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
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
              marginBottom: "0.3rem",
            }}
          >
            Active Universe
          </p>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              color: "var(--color-ink)",
              marginBottom: currentUniverse.description ? "0.35rem" : 0,
            }}
          >
            {currentUniverse.name}
          </p>
          {currentUniverse.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                color: "var(--color-ink-muted)",
              }}
            >
              {currentUniverse.description}
            </p>
          )}
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
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-ink-muted)",
              marginBottom: "1rem",
            }}
          >
            No universe selected yet.
          </p>
          <Link
            href="/admin/universes"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              color: "var(--color-gold)",
              letterSpacing: "0.06em",
            }}
          >
            Create your first universe →
          </Link>
        </div>
      )}

      {/* Quick-access cards — expand in later stages */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {[
          { label: "Characters", note: "Coming soon", href: "" },
          { label: "Locations", note: "Coming soon", href: "" },
          { label: "Writing", note: "Books & short stories", href: "/admin/works" },
          { label: "Feedback", note: "Reader messages", href: "/admin/feedback" },
          { label: "Mailing List", note: "Subscribers & export", href: "/admin/mailing-list" },
          { label: "Read Stats", note: "Free-read open counts", href: "/admin/free-read-stats" },
        ].map(({ label, note, href }) => {
          const cardStyle: React.CSSProperties = {
            display: "block",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            padding: "1.25rem",
            textDecoration: "none",
          };
          const inner = (
            <>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.2rem",
                  fontWeight: 400,
                  color: "var(--color-ink)",
                  marginBottom: "0.3rem",
                }}
              >
                {label}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  color: "var(--color-ink-faint)",
                }}
              >
                {note}
              </p>
            </>
          );
          return href ? (
            <Link key={label} href={href} style={cardStyle}>
              {inner}
            </Link>
          ) : (
            <div key={label} style={cardStyle}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
