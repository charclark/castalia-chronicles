"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { renameWork, setCoverImage, deleteWork } from "@/app/actions/works";

type WorkMeta = {
  id: string;
  title: string;
  type: string;
  status: string;
  coverImageId: string | null;
  coverImage: { id: string; label: string } | null;
  publishedAt: Date | null;
  openCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type ImageOption = { id: string; label: string; category: string };

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldRow: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
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
  ...inputStyle,
  fontFamily: "var(--font-body)", fontSize: "0.95rem",
};

// ── Action button (placeholder for future functionality) ──────────────────────

function ActionButton({
  label,
  sublabel,
  disabled = false,
  variant = "default",
  onClick,
}: {
  label: string;
  sublabel?: string;
  disabled?: boolean;
  variant?: "default" | "publish" | "danger";
  onClick?: () => void;
}) {
  const colors: Record<string, { border: string; color: string; bg: string }> = {
    default: { border: "var(--color-border-light)", color: "var(--color-ink-muted)", bg: "transparent" },
    publish: { border: "var(--color-gold-dim)", color: "var(--color-gold)", bg: "rgba(201,168,76,0.06)" },
    danger: { border: "var(--color-crimson-dim)", color: "#d4848e", bg: "transparent" },
  };
  const c = colors[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        gap: "0.15rem",
        background: disabled ? "transparent" : c.bg,
        border: `1px solid ${disabled ? "var(--color-border)" : c.border}`,
        borderRadius: "4px",
        padding: "0.85rem 1.25rem",
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

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkDetail({
  work,
  availableImages,
}: {
  work: WorkMeta;
  availableImages: ImageOption[];
}) {
  const router = useRouter();
  const [renameState, renameAction, renamePending] = useActionState(renameWork, null);
  const [coverState, coverAction, coverPending] = useActionState(setCoverImage, null);
  const [deletePending, startDelete] = useTransition();

  const isBook = work.type === "book";
  const isPublished = work.status === "published";

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

  const typeLabel = isBook ? "Book" : "Short Story";

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
          <StatusBadge status={work.status} />
        </div>
      </div>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-ink-faint)",
        fontStyle: "italic", marginBottom: "2rem",
      }}>
        Created {work.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        {isPublished && work.publishedAt && (
          <> · Published {work.publishedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>
        )}
        {isPublished && (
          <> · {work.openCount} {work.openCount === 1 ? "read" : "reads"}</>
        )}
      </p>

      {/* ── Action buttons ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.75rem",
        }}>
          Actions
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* "Open in Editor" — now live */}
          <Link
            href={`/admin/works/${work.id}/editor`}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              gap: "0.15rem",
              background: "rgba(201,168,76,0.06)",
              border: "1px solid var(--color-gold-dim)",
              borderRadius: "4px",
              padding: "0.85rem 1.25rem",
              textDecoration: "none",
              minWidth: "160px",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-gold-dim)")}
          >
            <span style={{
              fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.04em",
              color: "var(--color-gold)",
            }}>
              Open in Editor
            </span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.72rem",
              color: "var(--color-ink-faint)", fontStyle: "italic",
            }}>
              Write and edit content
            </span>
          </Link>

          <ActionButton
            label={isPublished ? "Unpublish" : "Publish"}
            sublabel={isPublished ? "Make private again" : "Share with readers"}
            variant="publish"
            disabled
          />
          <ActionButton
            label="Backup / Download"
            sublabel="Export as JSON or Word"
            variant="default"
            disabled
          />
        </div>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)",
          fontStyle: "italic", marginTop: "0.6rem",
        }}>
          Publishing and backup features are coming in later stages.
        </p>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />

      {/* ── Rename form ── */}
      <form action={renameAction} style={{ marginBottom: "2rem" }}>
        <input type="hidden" name="id" value={work.id} />
        <div style={fieldRow}>
          <label htmlFor="title" style={fieldLabel}>{typeLabel} Title</label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={work.title}
            required
            style={inputStyle}
          />
        </div>

        {/* Status messages */}
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
          type="submit"
          disabled={renamePending}
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

      {/* ── Cover image selector (books only) ── */}
      {isBook && (
        <>
          <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />
          <form action={coverAction} style={{ marginBottom: "2rem" }}>
            <input type="hidden" name="id" value={work.id} />
            <div style={fieldRow}>
              <label htmlFor="coverImageId" style={fieldLabel}>Cover Image</label>
              {availableImages.length === 0 ? (
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)",
                  fontStyle: "italic",
                }}>
                  No images uploaded yet. Upload images via the sidebar Images tool to assign a cover.
                </p>
              ) : (
                <>
                  <select
                    id="coverImageId"
                    name="coverImageId"
                    defaultValue={work.coverImageId ?? ""}
                    style={selectStyle}
                  >
                    <option value="">— No cover image —</option>
                    {availableImages.map((img) => (
                      <option key={img.id} value={img.id} style={{ background: "var(--color-bg-elevated)" }}>
                        {img.label}{img.category !== "other" ? ` (${img.category})` : ""}
                      </option>
                    ))}
                  </select>

                  {/* Preview current cover if set */}
                  {work.coverImage && (
                    <div style={{
                      marginTop: "0.75rem", borderRadius: "3px", overflow: "hidden",
                      border: "1px solid var(--color-border)", maxWidth: "200px",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/images/${work.coverImage.id}`}
                        alt={work.coverImage.label}
                        style={{ display: "block", width: "100%", height: "auto" }}
                      />
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
                    type="submit"
                    disabled={coverPending}
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

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />

      {/* ── Delete ── */}
      <div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.6rem" }}>
          Danger Zone
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deletePending}
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
    </div>
  );
}

// ── Small badge components ─────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--color-ink-muted)",
      border: "1px solid var(--color-border)", borderRadius: "2px",
      padding: "0.1rem 0.45rem",
    }}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: published ? "var(--color-gold)" : "var(--color-ink-faint)",
      border: `1px solid ${published ? "var(--color-gold-dim)" : "var(--color-border)"}`,
      borderRadius: "2px", padding: "0.1rem 0.45rem",
    }}>
      {published ? "Published" : "Private"}
    </span>
  );
}
