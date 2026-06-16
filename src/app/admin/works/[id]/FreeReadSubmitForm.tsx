"use client";

import { useActionState, useTransition, useState, useMemo } from "react";
import { submitFreeRead, unpublishFreeRead } from "@/app/actions/free-read-submissions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Chapter = { id: string; title: string; order: number };

type Submission = {
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
};

type Props = {
  workId: string;
  workTitle: string;
  chapters: Chapter[];
  existingSubmission: Submission | null;
};

// ── Shared style constants ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.6rem 0.8rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  outline: "none",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.72rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-ink-muted)",
  display: "block",
  marginBottom: "0.3rem",
};

const RATINGS = ["General", "Teen", "Mature Themes", "Adult"] as const;

// ── Word count helper ─────────────────────────────────────────────────────────

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { color: string; border: string; bg: string }> = {
    pending:  { color: "var(--color-gold)",  border: "var(--color-gold-dim)",    bg: "rgba(201,168,76,0.08)" },
    approved: { color: "#8bc98d",            border: "rgba(76,139,64,0.35)",     bg: "rgba(76,139,64,0.08)" },
    rejected: { color: "#d4848e",            border: "var(--color-crimson-dim)", bg: "rgba(139,38,53,0.08)" },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em",
      textTransform: "uppercase", color: c.color, background: c.bg,
      border: `1px solid ${c.border}`, borderRadius: "2px", padding: "0.1rem 0.45rem",
    }}>
      {status}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FreeReadSubmitForm({ workId, workTitle, chapters, existingSubmission }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [unpublishPending, startUnpublish] = useTransition();
  const [unpublishDone, setUnpublishDone] = useState(false);

  const sub = existingSubmission;
  const currentStatus = unpublishDone ? "rejected" : sub?.status;

  // Pre-fill form from existing submission when editing
  const existingChapterIds: string[] = useMemo(() => {
    if (!sub?.selectedChapterIds) return [];
    try { return JSON.parse(sub.selectedChapterIds); } catch { return []; }
  }, [sub]);

  const [submissionType, setSubmissionType] = useState<"chapters" | "full">(
    (sub?.submissionType as "chapters" | "full") ?? "full"
  );
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>(existingChapterIds);
  const [title, setTitle] = useState(sub?.title ?? workTitle);
  const [description, setDescription] = useState(sub?.description ?? "");
  const [contentRating, setContentRating] = useState(sub?.contentRating ?? "General");
  const [coverMode, setCoverMode] = useState<"none" | "upload" | "preset">(
    sub?.hasCoverImage ? "upload" : sub?.coverBgIndex ? "preset" : "none"
  );
  const [coverBgIndex, setCoverBgIndex] = useState<number | null>(sub?.coverBgIndex ?? null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [state, formAction, pending] = useActionState(submitFreeRead, null);
  const submitted = state?.success === "submitted";
  const wc = wordCount(description);
  const isReplace = sub && (sub.status === "approved" || sub.status === "pending");

  function toggleChapter(id: string) {
    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleUnpublish() {
    if (!window.confirm("Are you sure you want to remove this from Start Reading? It will no longer be visible to readers."))
      return;
    startUnpublish(async () => {
      await unpublishFreeRead(workId);
      setUnpublishDone(true);
    });
  }

  // ── Success state ──
  if (submitted) {
    return (
      <div style={{
        background: "rgba(76,139,64,0.08)", border: "1px solid rgba(76,139,64,0.35)",
        borderRadius: "4px", padding: "1.1rem 1.25rem",
      }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#8bc98d", margin: 0 }}>
          Your submission has been sent to WriteWright for approval. Stay tuned!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Current status indicator ── */}
      {sub && !showForm && (
        <div style={{
          background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
          borderRadius: "4px", padding: "1rem 1.25rem",
          display: "flex", flexDirection: "column", gap: "0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <StatusPill status={currentStatus ?? "pending"} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-muted)" }}>
              {currentStatus === "approved" && "Live on Start Reading"}
              {currentStatus === "pending" && "Awaiting approval"}
              {currentStatus === "rejected" && "Not approved — you can edit and resubmit"}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)", margin: 0 }}>
            {sub.title}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", margin: 0 }}>
            Submitted {new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.82rem", background: "transparent",
                border: "1px solid var(--color-border-light)", borderRadius: "3px",
                padding: "0.3rem 0.85rem", color: "var(--color-ink-muted)", cursor: "pointer",
              }}
            >
              Edit &amp; Resubmit
            </button>
            {currentStatus === "approved" && (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={unpublishPending}
                style={{
                  fontFamily: "var(--font-body)", fontSize: "0.82rem", background: "transparent",
                  border: "1px solid var(--color-crimson-dim)", borderRadius: "3px",
                  padding: "0.3rem 0.85rem", color: "#d4848e",
                  cursor: unpublishPending ? "default" : "pointer",
                  opacity: unpublishPending ? 0.6 : 1,
                }}
              >
                {unpublishPending ? "Removing…" : "Unpublish"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Form ── */}
      {(!sub || showForm) && (
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <input type="hidden" name="workId" value={workId} />
          <input type="hidden" name="keepCover" value={sub?.hasCoverImage && coverFile === null ? "1" : "0"} />

          {/* Replace warning */}
          {isReplace && (
            <div style={{
              background: "rgba(201,168,76,0.06)", border: "1px solid var(--color-gold-dim)",
              borderLeft: "3px solid var(--color-gold)", borderRadius: "4px", padding: "0.85rem 1rem",
            }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-gold)", margin: 0 }}>
                {sub.status === "approved"
                  ? "You currently have an approved version of this work published on Start Reading. Submitting a new version will replace the existing one and remove it from public view until the new version is approved by WriteWright."
                  : "You have a pending submission for this work. Resubmitting will replace it."}
              </p>
            </div>
          )}

          {/* What to share */}
          <div>
            <label style={labelStyle}>What to share</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", cursor: "pointer" }}>
                <input
                  type="radio" name="submissionType" value="full"
                  checked={submissionType === "full"}
                  onChange={() => setSubmissionType("full")}
                  style={{ marginTop: "0.2rem", accentColor: "var(--color-gold)", flexShrink: 0 }}
                />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink)" }}>
                  Full work — submit all chapters
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", cursor: "pointer" }}>
                <input
                  type="radio" name="submissionType" value="chapters"
                  checked={submissionType === "chapters"}
                  onChange={() => setSubmissionType("chapters")}
                  style={{ marginTop: "0.2rem", accentColor: "var(--color-gold)", flexShrink: 0 }}
                />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink)" }}>
                  Specific chapters — choose which to include
                </span>
              </label>
            </div>

            {/* Chapter checklist */}
            {submissionType === "chapters" && (
              <div style={{
                marginTop: "0.75rem", padding: "0.75rem 1rem",
                background: "var(--color-bg)", borderRadius: "3px",
                border: "1px solid var(--color-border)",
                display: "flex", flexDirection: "column", gap: "0.4rem",
              }}>
                {chapters.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", margin: 0 }}>
                    No chapters yet. Open the editor to create chapters first.
                  </p>
                ) : (
                  chapters.map((ch) => (
                    <label key={ch.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        name="selectedChapterIds[]"
                        value={ch.id}
                        checked={selectedChapterIds.includes(ch.id)}
                        onChange={() => toggleChapter(ch.id)}
                        style={{ accentColor: "var(--color-gold)", flexShrink: 0 }}
                      />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
                        {ch.title}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Content rating */}
          <div>
            <label htmlFor="contentRating" style={labelStyle}>Content Rating</label>
            <select
              id="contentRating" name="contentRating"
              value={contentRating}
              onChange={(e) => setContentRating(e.target.value)}
              style={{ ...inputStyle, fontFamily: "var(--font-body)" }}
            >
              {RATINGS.map((r) => (
                <option key={r} value={r} style={{ background: "var(--color-bg-elevated)" }}>{r}</option>
              ))}
            </select>
          </div>

          {/* Submission title */}
          <div>
            <label htmlFor="sub-title" style={labelStyle}>Submission Title</label>
            <input
              id="sub-title" name="title" type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
              <label htmlFor="sub-description" style={{ ...labelStyle, marginBottom: 0 }}>Short Description</label>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "0.72rem",
                color: wc > 100 ? "#d4848e" : "var(--color-ink-faint)",
              }}>
                {wc} / 100 words
              </span>
            </div>
            <textarea
              id="sub-description" name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="A short description that appears on the Start Reading card…"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
            />
          </div>

          {/* Cover image */}
          <div>
            <label style={labelStyle}>Cover Image (optional)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="radio" name="coverModeRadio" value="none"
                  checked={coverMode === "none"}
                  onChange={() => { setCoverMode("none"); setCoverBgIndex(null); setCoverFile(null); }}
                  style={{ accentColor: "var(--color-gold)", flexShrink: 0 }}
                />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
                  No cover — use dark placeholder
                </span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="radio" name="coverModeRadio" value="upload"
                  checked={coverMode === "upload"}
                  onChange={() => { setCoverMode("upload"); setCoverBgIndex(null); }}
                  style={{ accentColor: "var(--color-gold)", flexShrink: 0 }}
                />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
                  Upload a photo
                </span>
              </label>

              {coverMode === "upload" && (
                <div style={{ marginLeft: "1.5rem" }}>
                  {sub?.hasCoverImage && coverFile === null && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-gold)", fontStyle: "italic", marginBottom: "0.4rem" }}>
                      Current cover image will be kept. Upload a new file to replace it.
                    </p>
                  )}
                  <input
                    type="file" name="coverImage" accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                    style={{
                      fontFamily: "var(--font-body)", fontSize: "0.85rem",
                      color: "var(--color-ink-muted)", display: "block",
                    }}
                  />
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="radio" name="coverModeRadio" value="preset"
                  checked={coverMode === "preset"}
                  onChange={() => { setCoverMode("preset"); }}
                  style={{ accentColor: "var(--color-gold)", flexShrink: 0 }}
                />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
                  Choose a preset background
                </span>
              </label>

              {coverMode === "preset" && (
                <div style={{ marginLeft: "1.5rem" }}>
                  <input type="hidden" name="coverBgIndex" value={coverBgIndex ?? ""} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n} type="button"
                        onClick={() => setCoverBgIndex(n)}
                        style={{
                          width: "60px", height: "80px", padding: 0, cursor: "pointer",
                          border: coverBgIndex === n ? "2px solid var(--color-gold)" : "2px solid transparent",
                          borderRadius: "3px", overflow: "hidden", background: "none",
                          opacity: coverBgIndex === n ? 1 : 0.7, transition: "opacity 0.15s, border-color 0.15s",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/cover-backgrounds/cover-bg-${n}.jpg`}
                          alt={`Preset ${n}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </button>
                    ))}
                  </div>
                  {coverBgIndex === null && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-ink-faint)", marginTop: "0.4rem" }}>
                      Click a thumbnail to select it.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {state?.error && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", margin: 0 }}>
              {state.error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="submit"
              disabled={pending || wc > 100}
              style={{
                background: pending ? "var(--color-border)" : "var(--color-gold)",
                border: "none", borderRadius: "3px",
                padding: "0.65rem 1.5rem",
                color: pending ? "var(--color-ink-muted)" : "var(--color-bg)",
                fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.06em",
                cursor: pending || wc > 100 ? "default" : "pointer",
              }}
            >
              {pending ? "Submitting…" : "Submit for Approval"}
            </button>
            {showForm && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: "transparent", border: "1px solid var(--color-border)",
                  borderRadius: "3px", padding: "0.6rem 1rem",
                  color: "var(--color-ink-faint)",
                  fontFamily: "var(--font-body)", fontSize: "0.85rem", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
