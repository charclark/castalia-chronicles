"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

type TextEntry = {
  id: string;
  title: string;
  content?: string | null;
  createdAt: Date;
};

type CharacterEntry = {
  id: string;
  name: string;
  characterType: string;
  notes?: string | null;
  createdAt: Date;
};

type LocationEntry = {
  id: string;
  name: string;
  locatedIn?: string | null;
  atmosphere?: string | null;
  createdAt: Date;
};

// ── Shared card components ───────────────────────────────────────────────────

function TextCard({ entry, href }: { entry: TextEntry; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        padding: "1.1rem 1.25rem",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.2rem",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.35rem",
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
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", marginTop: "0.6rem" }}>
        {entry.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </Link>
  );
}

function CharacterCard({ char, href }: { char: CharacterEntry; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        padding: "1.1rem 1.25rem",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.2rem",
            fontWeight: 400,
            color: "var(--color-ink)",
          }}
        >
          {char.name}
        </h3>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.68rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-gold)",
            border: "1px solid var(--color-gold-dim)",
            borderRadius: "2px",
            padding: "0.1rem 0.45rem",
          }}
        >
          {char.characterType}
        </span>
      </div>
      {char.notes && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--color-ink-muted)",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {char.notes}
        </p>
      )}
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", marginTop: "0.6rem" }}>
        {char.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </Link>
  );
}

function LocationCard({ loc, href }: { loc: LocationEntry; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        padding: "1.1rem 1.25rem",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.2rem",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.35rem",
        }}
      >
        {loc.name}
      </h3>
      {loc.locatedIn && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--color-ink-muted)",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {loc.locatedIn}
        </p>
      )}
      {loc.atmosphere && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--color-ink-muted)",
            lineHeight: 1.5,
            fontStyle: "italic",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {loc.atmosphere}
        </p>
      )}
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", marginTop: "0.6rem" }}>
        {loc.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </Link>
  );
}

// ── PopupLayer ───────────────────────────────────────────────────────────────

export default function PopupLayer({
  ideas,
  notes,
  characters,
  locations,
  universeId,
}: {
  ideas: TextEntry[];
  notes: TextEntry[];
  characters: CharacterEntry[];
  locations: LocationEntry[];
  universeId: string | null;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const popup = searchParams.get("popup");

  if (!popup || !universeId) return null;

  let title = "";
  let newHref = "";
  let content: React.ReactNode = null;

  if (popup === "ideas") {
    title = "Storyline Ideas";
    newHref = "/admin/storyline-ideas/new";
    content = ideas.length === 0
      ? <EmptyState title={title} newHref={newHref} />
      : <CardGrid>{ideas.map((e) => <TextCard key={e.id} entry={e} href={`/admin/storyline-ideas/${e.id}`} />)}</CardGrid>;

  } else if (popup === "notes") {
    title = "General Notes";
    newHref = "/admin/notes/new";
    content = notes.length === 0
      ? <EmptyState title={title} newHref={newHref} />
      : <CardGrid>{notes.map((e) => <TextCard key={e.id} entry={e} href={`/admin/notes/${e.id}`} />)}</CardGrid>;

  } else if (popup === "characters") {
    title = "Characters";
    newHref = "/admin/characters/new";
    content = characters.length === 0
      ? <EmptyState title={title} newHref={newHref} />
      : <CardGrid>{characters.map((c) => <CharacterCard key={c.id} char={c} href={`/admin/characters/${c.id}`} />)}</CardGrid>;

  } else if (popup === "locations") {
    title = "Locations";
    newHref = "/admin/locations/new";
    content = locations.length === 0
      ? <EmptyState title={title} newHref={newHref} />
      : <CardGrid>{locations.map((l) => <LocationCard key={l.id} loc={l} href={`/admin/locations/${l.id}`} />)}</CardGrid>;

  } else {
    return null;
  }

  function close() {
    router.push(pathname, { scroll: false });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(10,8,12,0.75)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "4vh 1rem", overflowY: "auto",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          width: "100%", maxWidth: "820px",
          padding: "2rem",
          maxHeight: "88vh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 400, color: "var(--color-ink)", letterSpacing: "0.04em" }}>
            {title}
          </h2>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Link
              href={newHref}
              style={{
                fontFamily: "var(--font-heading)", fontSize: "0.95rem",
                color: "var(--color-gold)", letterSpacing: "0.06em",
                textDecoration: "none",
                padding: "0.35rem 0.85rem",
                border: "1px solid var(--color-gold-dim)", borderRadius: "3px",
              }}
            >
              + New
            </Link>
            <button
              onClick={close}
              aria-label="Close popup"
              style={{
                background: "transparent", border: "1px solid var(--color-border)",
                borderRadius: "3px", color: "var(--color-ink-muted)",
                fontSize: "1rem", cursor: "pointer",
                padding: "0.3rem 0.6rem", lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "1.5rem" }} />
        {content}
      </div>
    </div>
  );
}

function EmptyState({ title, newHref }: { title: string; newHref: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.25rem" }}>
        No {title.toLowerCase()} yet.
      </p>
      <Link href={newHref} style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-gold)", letterSpacing: "0.06em", textDecoration: "none" }}>
        Create the first one →
      </Link>
    </div>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
      {children}
    </div>
  );
}
