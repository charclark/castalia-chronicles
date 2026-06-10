"use client";

import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  renameWork,
  setCoverImage,
  deleteWork,
  publishWork,
  unpublishWork,
  saveWorkDescription,
  saveBuyLinks,
} from "@/app/actions/works";

// ── Types ─────────────────────────────────────────────────────────────────────

type BuyLink = { label: string; url: string };

type WorkMeta = {
  id: string;
  title: string;
  type: string;
  status: string;
  publishMode: string | null;
  snippet: string | null;
  coverImageId: string | null;
  coverImage: { id: string; label: string } | null;
  description: string | null;
  buyLinks: string | null;
  publishedAt: Date | null;
  openCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type ImageOption = { id: string; label: string; category: string };

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldRow: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.3rem",
};
const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)",
};
const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
  borderRadius: "3px", padding: "0.6rem 0.8rem", color: "var(--color-ink)",
  fontFamily: "var(--font-heading)", fontSize: "1.1rem", outline: "none", width: "100%",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, fontFamily: "var(--font-body)", fontSize: "0.95rem",
};
const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.75rem",
};

// ── Action button ─────────────────────────────────────────────────────────────

function ActionButton({
  label, sublabel, disabled = false, variant = "default", onClick,
}: {
  label: string; sublabel?: string; disabled?: boolean;
  variant?: "default" | "publish" | "danger"; onClick?: () => void;
}) {
  const colors = {
    default: { border: "var(--color-border-light)", color: "var(--color-ink-muted)", bg: "transparent" },
    publish: { border: "var(--color-gold-dim)", color: "var(--color-gold)", bg: "rgba(201,168,76,0.06)" },
    danger:  { border: "var(--color-crimson-dim)", color: "#d4848e", bg: "transparent" },
  };
  const c = colors[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.15rem",
        background: disabled ? "transparent" : c.bg,
        border: `1px solid ${disabled ? "var(--color-border)" : c.border}`,
        borderRadius: "4px", padding: "0.85rem 1.25rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "border-color 0.15s, opacity 0.15s",
        minWidth: "160px",
      }}
    >
      <span style={{
        fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.04em",
        color: disabled ? "var(--color-ink-faint)" : c.color,
      }}>
        {label}
      </span>
      {sublabel && (
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.72rem",
          color: "var(--color-ink-faint)", fontStyle: "italic",
        }}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

// ── Publishing section ────────────────────────────────────────────────────────

function PublishingSection({ work }: { work: WorkMeta }) {
  const isPublished = work.status === "published";
  const [publishMode, setPublishMode] = useState<"whole" | "snippet">("whole");
  const [snippetText, setSnippetText] = useState(work.snippet ?? "");
  const [error, setError] = useState("");
  const [publishPending, startPublish] = useTransition();
  const [unpublishPending, startUnpublish] = useTransition();

  function handlePublish() {
    // Snippet must come from either the textarea or a previously saved snippet
    if (publishMode === "snippet" && !snippetText.trim() && !work.snippet) {
      setError("Enter snippet text, or open the editor, select text, and click 'Set as Snippet'.");
      return;
    }
    setError("");
    if (
      !window.confirm(
        `Are you sure you want to publish "${work.title}" for others to read?\n\n` +
          (publishMode === "whole"
            ? "The full work will be visible publicly."
            : "Your chosen snippet/teaser will be visible publicly.")
      )
    )
      return;

    startPublish(async () => {
      const result = await publishWork(
        work.id,
        publishMode,
        // Pass textarea text if edited; server will fall back to saved snippet if empty
        publishMode === "snippet" ? snippetText : undefined
      );
      if (result?.error) setError(result.error);
    });
  }

  function handleUnpublish() {
    if (
      !window.confirm(
        `Unpublish "${work.title}"?\n\nIt will no longer be visible to readers.`
      )
    )
      return;
    startUnpublish(async () => {
      const result = await unpublishWork(work.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <p style={sectionLabel}>Publishing</p>

      {isPublished ? (
        /* ── Published state ── */
        <div>
          <div
            style={{
              background: "rgba(201,168,76,0.06)",
              border: "1px solid var(--color-gold-dim)",
              borderLeft: "3px solid var(--color-gold)",
              borderRadius: "4px",
              padding: "1rem 1.25rem",
              marginBottom: "1rem",
            }}
          >
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.82rem",
              color: "var(--color-gold)", marginBottom: "0.2rem",
            }}>
              {work.publishMode === "snippet" ? "Snippet published" : "Full work published"}
              {work.publishedAt && (
                <span style={{ color: "var(--color-ink-faint)", marginLeft: "0.5rem" }}>
                  · {work.publishedAt.toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              )}
            </p>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.82rem",
              color: "var(--color-ink-muted)",
            }}>
              {work.openCount.toLocaleString()}{" "}
              {work.openCount === 1 ? "read" : "reads"}
            </p>
            {work.publishMode === "snippet" && work.snippet && (
              <details style={{ marginTop: "0.6rem" }}>
                <summary style={{
                  fontFamily: "var(--font-body)", fontSize: "0.75rem",
                  color: "var(--color-ink-faint)", cursor: "pointer", letterSpacing: "0.04em",
                }}>
                  View published snippet
                </summary>
                <div
                  style={{
                    marginTop: "0.5rem", padding: "0.75rem",
                    background: "var(--color-bg)", borderRadius: "3px",
                    fontFamily: "var(--font-body)", fontSize: "0.85rem",
                    color: "var(--color-ink-muted)", lineHeight: 1.7,
                    maxHeight: "160px", overflowY: "auto",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}
                >
                  {work.snippet}
                </div>
              </details>
            )}
          </div>

          {error && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginBottom: "0.75rem" }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleUnpublish}
            disabled={unpublishPending}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border-light)",
              borderRadius: "3px", padding: "0.55rem 1.1rem",
              color: "var(--color-ink-muted)",
              fontFamily: "var(--font-body)", fontSize: "0.88rem",
              cursor: unpublishPending ? "default" : "pointer",
              opacity: unpublishPending ? 0.6 : 1,
            }}
          >
            {unpublishPending ? "Unpublishing…" : "Unpublish — make private again"}
          </button>
        </div>
      ) : (
        /* ── Unpublished state ── */
        <div
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            padding: "1.25rem 1.5rem",
          }}
        >
          {/* Mode selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
              <input
                type="radio"
                name={`pubmode-${work.id}`}
                value="whole"
                checked={publishMode === "whole"}
                onChange={() => setPublishMode("whole")}
                style={{ marginTop: "0.2rem", accentColor: "var(--color-gold)", flexShrink: 0 }}
              />
              <span>
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--color-ink)",
                  display: "block",
                }}>
                  Publish the full work — Free Read
                </span>
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)",
                  fontStyle: "italic",
                }}>
                  The entire written content is readable online on the Free Read page.
                </span>
              </span>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
              <input
                type="radio"
                name={`pubmode-${work.id}`}
                value="snippet"
                checked={publishMode === "snippet"}
                onChange={() => setPublishMode("snippet")}
                style={{ marginTop: "0.2rem", accentColor: "var(--color-gold)", flexShrink: 0 }}
              />
              <span>
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--color-ink)",
                  display: "block",
                }}>
                  Publish a snippet / teaser only — Published Books
                </span>
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)",
                  fontStyle: "italic",
                }}>
                  Only your chosen excerpt is shown publicly. The full content stays private.
                </span>
              </span>
            </label>
          </div>

          {/* Snippet textarea — shown only when snippet mode selected */}
          {publishMode === "snippet" && (
            <div style={{ ...fieldRow, marginBottom: "1.25rem" }}>
              <label style={fieldLabel}>
                Snippet text
                {work.snippet && (
                  <span style={{
                    textTransform: "none", fontStyle: "italic", letterSpacing: 0,
                    fontSize: "0.72rem", color: "var(--color-gold)", marginLeft: "0.5rem",
                  }}>
                    — saved from editor ({work.snippet.length} chars)
                  </span>
                )}
              </label>
              <textarea
                value={snippetText}
                onChange={(e) => setSnippetText(e.target.value)}
                placeholder="Select text in the editor and click 'Set as Snippet', or paste directly here…"
                rows={8}
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "3px", padding: "0.7rem 0.9rem",
                  color: "var(--color-ink)",
                  fontFamily: "var(--font-body)", fontSize: "0.95rem",
                  lineHeight: 1.75, outline: "none", width: "100%",
                  resize: "vertical",
                }}
              />
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.72rem",
                color: "var(--color-ink-faint)", fontStyle: "italic",
              }}>
                In the editor, select text then click "Set as Snippet" to save it here automatically.
                Or paste/type directly above.
              </p>
            </div>
          )}

          {error && (
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.85rem",
              color: "#d4848e", marginBottom: "0.75rem",
            }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishPending}
            style={{
              background: publishPending ? "var(--color-border)" : "var(--color-gold)",
              border: "none", borderRadius: "3px",
              padding: "0.65rem 1.5rem",
              color: publishPending ? "var(--color-ink-muted)" : "var(--color-bg)",
              fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.06em",
              cursor: publishPending ? "default" : "pointer",
            }}
          >
            {publishPending ? "Publishing…" : "Publish →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Description editor ────────────────────────────────────────────────────────

function DescriptionEditor({ work }: { work: WorkMeta }) {
  const [text, setText] = useState(work.description ?? "");
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSave() {
    setSaved(false);
    setError("");
    startSave(async () => {
      const result = await saveWorkDescription(work.id, text);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div>
      <p style={sectionLabel}>Description</p>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        placeholder="Short synopsis visible to readers on the public books page…"
        rows={5}
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "3px", padding: "0.7rem 0.9rem",
          color: "var(--color-ink)",
          fontFamily: "var(--font-body)", fontSize: "0.95rem",
          lineHeight: 1.75, outline: "none", width: "100%",
          resize: "vertical",
        }}
      />
      {error && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginTop: "0.4rem" }}>
          {error}
        </p>
      )}
      {saved && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#8bc98d", marginTop: "0.4rem" }}>
          Description saved.
        </p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: "0.75rem",
          background: saving ? "var(--color-border)" : "var(--color-crimson)",
          border: "none", borderRadius: "3px",
          padding: "0.6rem 1.25rem", color: "var(--color-ink)",
          fontFamily: "var(--font-heading)", fontSize: "0.95rem", letterSpacing: "0.06em",
          cursor: saving ? "default" : "pointer",
        }}
      >
        {saving ? "Saving…" : "Save Description"}
      </button>
    </div>
  );
}

// ── Buy links editor ──────────────────────────────────────────────────────────

function BuyLinksEditor({ work }: { work: WorkMeta }) {
  const parsedLinks: BuyLink[] = (() => {
    try { return work.buyLinks ? JSON.parse(work.buyLinks) : []; }
    catch { return []; }
  })();

  const [links, setLinks] = useState<BuyLink[]>(parsedLinks);
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
    setSaved(false);
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function updateLink(i: number, field: "label" | "url", value: string) {
    setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
    setSaved(false);
  }

  function handleSave() {
    const clean = links.filter((l) => l.label.trim() && l.url.trim());
    setSaved(false);
    setError("");
    startSave(async () => {
      const result = await saveBuyLinks(work.id, clean.length ? JSON.stringify(clean) : "");
      if (result?.error) setError(result.error);
      else { setLinks(clean); setSaved(true); }
    });
  }

  return (
    <div>
      <p style={sectionLabel}>Buy Links</p>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "0.78rem",
        color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "0.75rem",
      }}>
        Add links to where readers can buy this book (e.g. Amazon, Kobo, your own store).
      </p>

      {links.map((link, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Label (e.g. Amazon)"
            value={link.label}
            onChange={(e) => updateLink(i, "label", e.target.value)}
            style={{ ...inputStyle, flex: "0 0 160px", fontSize: "0.92rem" }}
          />
          <input
            type="url"
            placeholder="https://…"
            value={link.url}
            onChange={(e) => updateLink(i, "url", e.target.value)}
            style={{ ...inputStyle, flex: "1 1 220px", fontSize: "0.92rem" }}
          />
          <button
            type="button"
            onClick={() => removeLink(i)}
            style={{
              background: "transparent",
              border: "1px solid var(--color-crimson-dim)",
              borderRadius: "3px", padding: "0.55rem 0.75rem",
              color: "#d4848e",
              fontFamily: "var(--font-body)", fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addLink}
        style={{
          marginTop: "0.25rem",
          background: "transparent",
          border: "1px solid var(--color-border-light)",
          borderRadius: "3px", padding: "0.5rem 1rem",
          color: "var(--color-ink-muted)",
          fontFamily: "var(--font-body)", fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        + Add link
      </button>

      {error && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
      {saved && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#8bc98d", marginTop: "0.5rem" }}>
          Buy links saved.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          display: "block",
          marginTop: "0.75rem",
          background: saving ? "var(--color-border)" : "var(--color-crimson)",
          border: "none", borderRadius: "3px",
          padding: "0.6rem 1.25rem", color: "var(--color-ink)",
          fontFamily: "var(--font-heading)", fontSize: "0.95rem", letterSpacing: "0.06em",
          cursor: saving ? "default" : "pointer",
        }}
      >
        {saving ? "Saving…" : "Save Buy Links"}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkDetail({
  work,
  availableImages,
  isSuperAdmin,
  canEdit = true,
}: {
  work: WorkMeta;
  availableImages: ImageOption[];
  isSuperAdmin: boolean;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [renameState, renameAction, renamePending] = useActionState(renameWork, null);
  const [coverState, coverAction, coverPending] = useActionState(setCoverImage, null);
  const [deletePending, startDelete] = useTransition();

  const isBook = work.type === "book";
  const typeLabel = isBook ? "Book" : "Short Story";

  function handleDelete() {
    if (
      !window.confirm(
        `Delete "${work.title}"? This cannot be undone.\n\nAll written content will be permanently lost.`
      )
    )
      return;
    startDelete(async () => {
      await deleteWork(work.id);
    });
  }

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/admin/works")}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: "0.88rem",
          color: "var(--color-ink-faint)", padding: 0, marginBottom: "1.5rem",
        }}
      >
        ← Writing
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
        <h2 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400, color: "var(--color-ink)", flex: 1, minWidth: "200px",
        }}>
          {work.title}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", paddingTop: "0.3rem" }}>
          <TypeBadge type={work.type} />
          <StatusBadge status={work.status} publishMode={work.publishMode} />
        </div>
      </div>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-ink-faint)",
        fontStyle: "italic", marginBottom: "2rem",
      }}>
        Created {work.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        {work.status === "published" && work.publishedAt && (
          <> · Published {work.publishedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>
        )}
      </p>

      {/* ── Action buttons ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={sectionLabel}>Actions</p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href={`/admin/works/${work.id}/editor`}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.15rem",
              background: "rgba(201,168,76,0.06)",
              border: "1px solid var(--color-gold-dim)",
              borderRadius: "4px", padding: "0.85rem 1.25rem",
              textDecoration: "none", minWidth: "160px",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
          >
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.04em", color: "var(--color-gold)" }}>
              {canEdit ? "Open in Editor" : "Read Chapters"}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              {canEdit ? "Write and edit content" : "View all written content"}
            </span>
          </Link>

          {/* Download — visible to all users with access */}
          <a
            href={`/api/admin/backup/work/${work.id}?format=docx`}
            download
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.15rem",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "4px", padding: "0.85rem 1.25rem",
              textDecoration: "none", minWidth: "160px",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.04em", color: "var(--color-ink-muted)" }}>
              ↓ Download
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              Word document (.docx)
            </span>
          </a>

          {/* JSON backup — superadmin only */}
          {isSuperAdmin && (
            <a
              href={`/api/admin/backup/work/${work.id}?format=json`}
              download
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.15rem",
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "4px", padding: "0.85rem 1.25rem",
                textDecoration: "none", minWidth: "160px",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-light)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.04em", color: "var(--color-ink-muted)" }}>
                ↓ JSON backup
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                Full data backup
              </span>
            </a>
          )}
        </div>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />

      {canEdit && (
        <>
          {/* ── Rename form ── */}
          <form action={renameAction} style={{ marginBottom: "2rem" }}>
            <input type="hidden" name="id" value={work.id} />
            <div style={fieldRow}>
              <label htmlFor="title" style={fieldLabel}>{typeLabel} Title</label>
              <input
                id="title" name="title" type="text"
                defaultValue={work.title} required style={inputStyle}
              />
            </div>

            {renameState?.error && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginTop: "0.5rem" }}>
                {renameState.error}
              </p>
            )}
            {renameState?.success && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#8bc98d", marginTop: "0.5rem" }}>
                {renameState.success}
              </p>
            )}

            <button
              type="submit" disabled={renamePending}
              style={{
                marginTop: "0.85rem",
                background: renamePending ? "var(--color-border)" : "var(--color-crimson)",
                border: "none", borderRadius: "3px",
                padding: "0.6rem 1.25rem", color: "var(--color-ink)",
                fontFamily: "var(--font-heading)", fontSize: "0.95rem", letterSpacing: "0.06em",
                cursor: renamePending ? "default" : "pointer",
              }}
            >
              {renamePending ? "Saving…" : "Save Title"}
            </button>
          </form>

          {/* ── Publishing section ── */}
          <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />
          <div style={{ marginBottom: "2rem" }}>
            <PublishingSection work={work} />
          </div>

          {/* ── Cover image selector (books only) ── */}
          {isBook && (
            <>
              <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />
              <form action={coverAction} style={{ marginBottom: "2rem" }}>
                <input type="hidden" name="id" value={work.id} />
                <div style={fieldRow}>
                  <label htmlFor="coverImageId" style={fieldLabel}>Cover Image</label>
                  {availableImages.length === 0 ? (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                      No images uploaded yet. Upload images via the sidebar Images tool to assign a cover.
                    </p>
                  ) : (
                    <>
                      <select id="coverImageId" name="coverImageId" defaultValue={work.coverImageId ?? ""} style={selectStyle}>
                        <option value="">— No cover image —</option>
                        {availableImages.map((img) => (
                          <option key={img.id} value={img.id} style={{ background: "var(--color-bg-elevated)" }}>
                            {img.label}{img.category !== "other" ? ` (${img.category})` : ""}
                          </option>
                        ))}
                      </select>

                      {work.coverImage && (
                        <div style={{ marginTop: "0.75rem", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--color-border)", maxWidth: "200px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/api/images/${work.coverImage.id}`} alt={work.coverImage.label}
                            style={{ display: "block", width: "100%", height: "auto" }} />
                        </div>
                      )}

                      {coverState?.error && (
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginTop: "0.5rem" }}>
                          {coverState.error}
                        </p>
                      )}
                      {coverState?.success && (
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#8bc98d", marginTop: "0.5rem" }}>
                          {coverState.success}
                        </p>
                      )}

                      <button
                        type="submit" disabled={coverPending}
                        style={{
                          marginTop: "0.75rem",
                          background: coverPending ? "var(--color-border)" : "var(--color-crimson)",
                          border: "none", borderRadius: "3px",
                          padding: "0.6rem 1.25rem", color: "var(--color-ink)",
                          fontFamily: "var(--font-heading)", fontSize: "0.95rem", letterSpacing: "0.06em",
                          cursor: coverPending ? "default" : "pointer",
                        }}
                      >
                        {coverPending ? "Saving…" : "Save Cover"}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </>
          )}

          {/* ── Description & Buy Links (books only) ── */}
          {isBook && (
            <>
              <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />
              <div style={{ marginBottom: "2rem" }}>
                <DescriptionEditor work={work} />
              </div>
              <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />
              <div style={{ marginBottom: "2rem" }}>
                <BuyLinksEditor work={work} />
              </div>
            </>
          )}

          <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />

          {/* ── Delete ── */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.6rem" }}>
              Danger Zone
            </p>
            <button
              type="button" onClick={handleDelete} disabled={deletePending}
              style={{
                background: "transparent",
                border: "1px solid var(--color-crimson-dim)",
                borderRadius: "3px", padding: "0.6rem 1.1rem",
                color: "#d4848e", fontFamily: "var(--font-body)", fontSize: "0.88rem",
                cursor: deletePending ? "default" : "pointer",
              }}
            >
              {deletePending ? "Deleting…" : `Delete ${typeLabel}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Badge components ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--color-ink-muted)",
      border: "1px solid var(--color-border)", borderRadius: "2px", padding: "0.1rem 0.45rem",
    }}>
      {type}
    </span>
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
  const label = publishMode === "snippet" ? "Snippet" : "Published";
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--color-gold)",
      border: "1px solid var(--color-gold-dim)", borderRadius: "2px", padding: "0.1rem 0.45rem",
    }}>
      {label}
    </span>
  );
}
