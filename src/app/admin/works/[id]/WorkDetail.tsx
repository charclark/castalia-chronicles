"use client";

import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  renameWork,
  setCoverImage,
  deleteWork,
  saveWorkDescription,
  saveBuyLinks,
} from "@/app/actions/works";
import FreeReadSubmitForm from "./FreeReadSubmitForm";

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

type ChapterItem = { id: string; title: string; order: number };

type FreeReadSubmission = {
  id: string;
  submissionType: string;
  selectedChapterIds: string | null;
  title: string;
  description: string;
  contentRating: string;
  coverBgIndex: number | null;
  hasCoverImage: boolean;
  status: string;
  submittedAt: string;
} | null;

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

// ── Publishing options (two-card layout) ─────────────────────────────────────

function PublishingSection({
  work,
  chapters,
  freeReadSubmission,
}: {
  work: WorkMeta;
  chapters: ChapterItem[];
  freeReadSubmission: FreeReadSubmission;
}) {
  const [openPanel, setOpenPanel] = useState<"startReading" | "discoverBooks" | null>(null);

  const card = (
    active: boolean,
    label: string,
    title: string,
    description: string,
    onClick: () => void
  ) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem",
        background: active ? "rgba(201,168,76,0.06)" : "var(--color-bg-elevated)",
        border: `1px solid ${active ? "var(--color-gold-dim)" : "var(--color-border)"}`,
        borderRadius: "4px", padding: "1rem 1.25rem",
        cursor: "pointer", textAlign: "left", width: "100%",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <span style={{
        fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em",
        textTransform: "uppercase", color: active ? "var(--color-gold)" : "var(--color-ink-faint)",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.04em",
        color: active ? "var(--color-gold)" : "var(--color-ink)",
      }}>
        {title}
      </span>
      <span style={{
        fontFamily: "var(--font-body)", fontSize: "0.78rem",
        color: "var(--color-ink-faint)", lineHeight: 1.5,
      }}>
        {description}
      </span>
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p style={sectionLabel}>Publish This Work</p>

      {/* Option 1 — Start Reading */}
      {card(
        openPanel === "startReading",
        "Option 1",
        "Submit to Start Reading — Free for Everyone",
        "Share your work with readers for free. Choose specific chapters, a selection of chapters, or your full work. Readers can enjoy it directly on WriteWright at no cost. All submissions require approval before going live.",
        () => setOpenPanel(openPanel === "startReading" ? null : "startReading")
      )}

      {openPanel === "startReading" && (
        <div style={{
          marginLeft: "1rem", paddingLeft: "1rem",
          borderLeft: "2px solid var(--color-gold-dim)",
        }}>
          <FreeReadSubmitForm
            workId={work.id}
            workTitle={work.title}
            chapters={chapters}
            existingSubmission={freeReadSubmission}
          />
        </div>
      )}

      {/* Option 2 — Discover Books */}
      {card(
        openPanel === "discoverBooks",
        "Option 2",
        "List on Discover Books — Sell Your Work",
        "List your published book for sale. Share your cover, a short description, and a link where readers can purchase your work. No written content is shared — this is a storefront listing only.",
        () => setOpenPanel(openPanel === "discoverBooks" ? null : "discoverBooks")
      )}

      {openPanel === "discoverBooks" && (
        <div style={{
          marginLeft: "1rem", paddingLeft: "1rem",
          borderLeft: "2px solid var(--color-border-light)",
          display: "flex", flexDirection: "column", gap: "1.75rem",
        }}>
          <DescriptionEditor work={work} />
          <div style={{ height: "1px", background: "var(--color-border)" }} />
          <BuyLinksEditor work={work} />
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
  chapters,
  freeReadSubmission,
}: {
  work: WorkMeta;
  availableImages: ImageOption[];
  isSuperAdmin: boolean;
  canEdit?: boolean;
  chapters: ChapterItem[];
  freeReadSubmission: FreeReadSubmission;
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic", lineHeight: 1.45, margin: 0, maxWidth: "200px" }}>
              Downloads this work only. Each book or short story must be downloaded separately.
            </p>
          </div>

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

          {/* ── Publishing options ── */}
          <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "2rem" }} />
          <div style={{ marginBottom: "2rem" }}>
            <PublishingSection
              work={work}
              chapters={chapters}
              freeReadSubmission={freeReadSubmission}
            />
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
