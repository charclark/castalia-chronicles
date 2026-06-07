"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

type Entry = { id: string; title: string };
type CharEntry = { id: string; name: string };
type LocEntry = { id: string; name: string };
type ImgEntry = { id: string; label: string };
type PlotEntry = { id: string; text: string; checked: boolean };

export type SidebarData = {
  universeId: string | null;
  ideas: Entry[];
  notes: Entry[];
  plotItems: PlotEntry[];
  characters: CharEntry[];
  locations: LocEntry[];
  images: ImgEntry[];
  isSuperAdmin?: boolean;
};

// ── Shared styles ────────────────────────────────────────────────────────────

const SIDEBAR_W = 248;

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.7rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--color-ink-faint)",
  padding: "0.9rem 1rem 0.3rem",
};

const itemRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0",
  width: "100%",
};

const arrowBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--color-ink-faint)",
  fontSize: "0.65rem",
  padding: "0.4rem 0.3rem 0.4rem 0.9rem",
  lineHeight: 1,
  flexShrink: 0,
  transition: "color 0.15s",
};

const wordBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  color: "var(--color-ink-muted)",
  padding: "0.4rem 0.5rem 0.4rem 0.25rem",
  textAlign: "left",
  flex: 1,
  transition: "color 0.15s",
};

const placeholderWord: React.CSSProperties = {
  ...wordBtn,
  cursor: "default",
  color: "var(--color-ink-faint)",
  fontStyle: "italic",
};

const inlineEntry: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "0.82rem",
  color: "var(--color-ink-muted)",
  padding: "0.22rem 1rem 0.22rem 2.1rem",
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  transition: "color 0.15s",
};

// ── Expandable sidebar tool item ─────────────────────────────────────────────

function SidebarTool({
  label,
  entries,
  onWordClick,
  popupKey,
  entryHref,
  isPlaceholder,
}: {
  label: string;
  entries?: Entry[];
  onWordClick?: () => void;
  popupKey?: string;
  entryHref?: (id: string) => string;
  isPlaceholder?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasEntries = entries && entries.length > 0;

  return (
    <div>
      <div style={itemRow}>
        {/* Arrow — only for items that have entries */}
        {entries !== undefined ? (
          <button
            style={{
              ...arrowBtn,
              color: hasEntries ? "var(--color-ink-muted)" : "var(--color-ink-faint)",
              opacity: hasEntries ? 1 : 0.4,
            }}
            onClick={() => hasEntries && setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span style={{ width: "22px", flexShrink: 0 }} />
        )}

        {/* Label word */}
        {isPlaceholder ? (
          <span style={placeholderWord}>{label}</span>
        ) : (
          <button style={wordBtn} onClick={onWordClick}>
            {label}
          </button>
        )}

        {/* Entry count badge */}
        {entries !== undefined && entries.length > 0 && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              color: "var(--color-ink-faint)",
              marginRight: "0.75rem",
              flexShrink: 0,
            }}
          >
            {entries.length}
          </span>
        )}
      </div>

      {/* Inline entry list */}
      {expanded && hasEntries && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {entries.slice(0, 12).map((e) => (
            <li key={e.id}>
              <Link
                href={entryHref ? entryHref(e.id) : "#"}
                style={inlineEntry}
                onMouseEnter={(ev) =>
                  (ev.currentTarget.style.color = "var(--color-ink)")
                }
                onMouseLeave={(ev) =>
                  (ev.currentTarget.style.color = "var(--color-ink-muted)")
                }
              >
                {e.title}
              </Link>
            </li>
          ))}
          {entries.length > 12 && (
            <li>
              <button
                style={{ ...inlineEntry as React.CSSProperties, background: "none", border: "none", cursor: "pointer", color: "var(--color-ink-faint)", fontStyle: "italic" }}
                onClick={onWordClick}
              >
                + {entries.length - 12} more…
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Plot checklist summary in sidebar ────────────────────────────────────────

function PlotChecklistTool({
  items,
}: {
  items: PlotEntry[];
}) {
  const [expanded, setExpanded] = useState(false);
  const unchecked = items.filter((i) => !i.checked);

  return (
    <div>
      <div style={itemRow}>
        <button
          style={{
            ...arrowBtn,
            color: items.length > 0 ? "var(--color-ink-muted)" : "var(--color-ink-faint)",
            opacity: items.length > 0 ? 1 : 0.4,
          }}
          onClick={() => items.length > 0 && setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <Link
          href="/admin/plot-checklist"
          style={{
            ...wordBtn as React.CSSProperties,
            textDecoration: "none",
            display: "block",
            flex: 1,
          }}
        >
          Plot Checklist
        </Link>
        {items.length > 0 && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              color: "var(--color-ink-faint)",
              marginRight: "0.75rem",
              flexShrink: 0,
            }}
          >
            {unchecked.length}/{items.length}
          </span>
        )}
      </div>

      {expanded && unchecked.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {unchecked.slice(0, 8).map((item) => (
            <li
              key={item.id}
              style={{
                ...inlineEntry,
                display: "flex",
                alignItems: "flex-start",
                gap: "0.4rem",
              }}
            >
              <span style={{ color: "var(--color-border-light)", flexShrink: 0 }}>
                ○
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.text}
              </span>
            </li>
          ))}
          {unchecked.length > 8 && (
            <li
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8rem",
                color: "var(--color-ink-faint)",
                padding: "0.2rem 1rem 0.2rem 2.1rem",
                fontStyle: "italic",
              }}
            >
              + {unchecked.length - 8} more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Main sidebar ─────────────────────────────────────────────────────────────

export default function SidebarClient({ universeId, ideas, notes, plotItems, characters, locations, images, isSuperAdmin }: SidebarData) {
  const router = useRouter();
  const pathname = usePathname();

  function openPopup(key: string) {
    router.push(`${pathname}?popup=${key}`, { scroll: false });
  }

  if (!universeId) {
    return (
      <aside
        style={{
          width: `${SIDEBAR_W}px`,
          flexShrink: 0,
          borderRight: "1px solid var(--color-border)",
          background: "var(--color-bg-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Select a universe to see story tools.
        </p>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: `${SIDEBAR_W}px`,
        flexShrink: 0,
        borderRight: "1px solid var(--color-border)",
        background: "var(--color-bg-surface)",
        overflowY: "auto",
        paddingBottom: "2rem",
      }}
    >
      {/* Story Bible label */}
      <div style={sectionLabel}>Story Bible</div>

      {/* Characters */}
      <SidebarTool
        label="Characters"
        entries={characters.map((c) => ({ id: c.id, title: c.name }))}
        onWordClick={() => openPopup("characters")}
        entryHref={(id) => `/admin/characters/${id}`}
      />

      {/* Locations */}
      <SidebarTool
        label="Locations"
        entries={locations.map((l) => ({ id: l.id, title: l.name }))}
        onWordClick={() => openPopup("locations")}
        entryHref={(id) => `/admin/locations/${id}`}
      />

      {/* Connections Map */}
      <div style={itemRow}>
        <span style={{ width: "22px", flexShrink: 0 }} />
        <button style={wordBtn} onClick={() => openPopup("connections")}>
          Connections Map
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--color-border)", margin: "0.5rem 0.75rem" }} />

      {/* Storyline Ideas */}
      <SidebarTool
        label="Storyline Ideas"
        entries={ideas}
        onWordClick={() => openPopup("ideas")}
        entryHref={(id) => `/admin/storyline-ideas/${id}`}
      />

      {/* General Notes */}
      <SidebarTool
        label="General Notes"
        entries={notes}
        onWordClick={() => openPopup("notes")}
        entryHref={(id) => `/admin/notes/${id}`}
      />

      {/* Plot Checklist */}
      <PlotChecklistTool items={plotItems} />

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--color-border)", margin: "0.5rem 0.75rem" }} />

      {/* Images */}
      <SidebarTool
        label="Images"
        entries={images.map((i) => ({ id: i.id, title: i.label }))}
        onWordClick={() => openPopup("images")}
        entryHref={(id) => `/admin/images/${id}`}
      />

      {/* Divider + Universe backup — superadmin only */}
      {isSuperAdmin && <>
      <div style={{ height: "1px", background: "var(--color-border)", margin: "0.75rem 0.75rem 0.5rem" }} />
      <div style={{ padding: "0.25rem 1rem 0.75rem" }}>
        <p style={{ ...sectionLabel, marginBottom: "0.5rem" }}>Story Bible Backup</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <a
            href="/api/admin/backup/universe?format=json"
            download
            style={{
              fontFamily: "var(--font-body)", fontSize: "0.78rem",
              color: "var(--color-ink-faint)",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "3px", padding: "0.3rem 0.7rem",
              textDecoration: "none",
              transition: "border-color 0.15s, color 0.15s",
              display: "block",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-border-light)"; e.currentTarget.style.color = "var(--color-ink-muted)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-ink-faint)"; }}
          >
            ↓ JSON backup
          </a>
          <a
            href="/api/admin/backup/universe?format=docx"
            download
            style={{
              fontFamily: "var(--font-body)", fontSize: "0.78rem",
              color: "var(--color-ink-faint)",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "3px", padding: "0.3rem 0.7rem",
              textDecoration: "none",
              transition: "border-color 0.15s, color 0.15s",
              display: "block",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-border-light)"; e.currentTarget.style.color = "var(--color-ink-muted)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-ink-muted)"; }}
          >
            ↓ Word (.docx)
          </a>
        </div>
      </div>
      </>}
    </aside>
  );
}
