"use client";

import { useTransition, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  submitFreeRead,
  withdrawFreeRead,
  unpublishFreeRead,
} from "@/app/actions/free-read-submissions";

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
  rejectionNote: string | null;
  hasPendingEdit: boolean;
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

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusPill({ status, label }: { status: string; label: string }) {
  const colors: Record<string, { color: string; border: string; bg: string }> = {
    pending:  { color: "var(--color-gold)",    border: "var(--color-gold-dim)",    bg: "rgba(201,168,76,0.08)" },
    approved: { color: "#8bc98d",              border: "rgba(76,139,64,0.35)",     bg: "rgba(76,139,64,0.08)" },
    rejected: { color: "#d4848e",              border: "var(--color-crimson-dim)", bg: "rgba(139,38,53,0.08)" },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em",
      textTransform: "uppercase", color: c.color, background: c.bg,
      border: `1px solid ${c.border}`, borderRadius: "2px", padding: "0.1rem 0.5rem",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── STATE A: No submission — option card ──────────────────────────────────────

function NeverSubmittedState({ onBegin }: { onBegin: () => void }) {
  return (
    <button
      type="button"
      onClick={onBegin}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem",
        background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
        borderRadius: "4px", padding: "1rem 1.25rem", cursor: "pointer", textAlign: "left", width: "100%",
        transition: "border-color 0.15s",
      }}
    >
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-ink-faint)" }}>
        Option 1
      </span>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.04em", color: "var(--color-ink)" }}>
        Submit to Start Reading — Free for Everyone
      </span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", lineHeight: 1.5 }}>
        Share your work with readers for free. Choose specific chapters, a selection, or your full work. All submissions require approval before going live.
      </span>
    </button>
  );
}

// ── STATE B: Pending approval ─────────────────────────────────────────────────

function PendingState({
  sub,
  onWithdraw,
}: {
  sub: Submission;
  onWithdraw: () => void;
}) {
  const submitted = new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <div style={{
      background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
      borderRadius: "4px", padding: "1.1rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.6rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <StatusPill status="pending" label="Pending — Awaiting Approval" />
      </div>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)" }}>
        {sub.title}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)" }}>
        Submitted {submitted} · Start Reading
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontStyle: "italic", color: "var(--color-ink-faint)" }}>
        You'll hear back once Char has reviewed your submission.
      </p>
      <button
        type="button"
        onClick={onWithdraw}
        style={{
          alignSelf: "flex-start",
          fontFamily: "var(--font-body)", fontSize: "0.8rem",
          background: "transparent", border: "1px solid var(--color-border)",
          borderRadius: "3px", padding: "0.3rem 0.85rem",
          color: "var(--color-ink-faint)", cursor: "pointer",
        }}
      >
        Withdraw Submission
      </button>
    </div>
  );
}

// ── STATE C: Approved / live ──────────────────────────────────────────────────

function ApprovedState({
  sub,
  onSubmitNew,
  onUnpublish,
}: {
  sub: Submission;
  onSubmitNew: () => void;
  onUnpublish: () => void;
}) {
  return (
    <div style={{
      background: "var(--color-bg-elevated)", border: "1px solid rgba(76,139,64,0.25)",
      borderRadius: "4px", padding: "1.1rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.6rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <StatusPill status="approved" label="Approved — Live on Start Reading" />
        {sub.hasPendingEdit && (
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--color-gold)",
            background: "rgba(201,168,76,0.08)", border: "1px solid var(--color-gold-dim)",
            borderRadius: "2px", padding: "0.1rem 0.5rem",
          }}>
            Edit pending review
          </span>
        )}
      </div>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)" }}>
        {sub.title}
      </p>
      {sub.hasPendingEdit && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontStyle: "italic", color: "var(--color-gold)" }}>
          A new version is awaiting Char's approval. Your published version stays live until it's approved.
        </p>
      )}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onSubmitNew}
          style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem",
            background: "transparent", border: "1px solid var(--color-border)",
            borderRadius: "3px", padding: "0.3rem 0.85rem",
            color: "var(--color-ink-muted)", cursor: "pointer",
          }}
        >
          Submit a New Version
        </button>
        <button
          type="button"
          onClick={onUnpublish}
          style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem",
            background: "transparent", border: "1px solid var(--color-crimson-dim)",
            borderRadius: "3px", padding: "0.3rem 0.85rem",
            color: "#d4848e", cursor: "pointer",
          }}
        >
          Unpublish
        </button>
      </div>
    </div>
  );
}

// ── STATE D: Rejected ─────────────────────────────────────────────────────────

function RejectedState({
  sub,
  onSubmitAgain,
}: {
  sub: Submission;
  onSubmitAgain: () => void;
}) {
  return (
    <div style={{
      background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
      borderRadius: "4px", padding: "1.1rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.6rem",
    }}>
      <StatusPill status="rejected" label="Not Approved" />
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)" }}>
        {sub.title}
      </p>
      {sub.rejectionNote && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontStyle: "italic", color: "#d4848e" }}>
          Feedback from WriteWright: {sub.rejectionNote}
        </p>
      )}
      <button
        type="button"
        onClick={onSubmitAgain}
        style={{
          alignSelf: "flex-start",
          fontFamily: "var(--font-body)", fontSize: "0.8rem",
          background: "transparent", border: "1px solid var(--color-border)",
          borderRadius: "3px", padding: "0.3rem 0.85rem",
          color: "var(--color-ink-muted)", cursor: "pointer",
        }}
      >
        Submit Again
      </button>
    </div>
  );
}

// ── Submission form ───────────────────────────────────────────────────────────

function SubmitForm({
  workId,
  workTitle,
  chapters,
  existingSubmission,
  isEdit,        // true when editing an approved submission
  onSuccess,
  onCancel,
}: {
  workId: string;
  workTitle: string;
  chapters: Chapter[];
  existingSubmission: Submission | null;
  isEdit: boolean;
  onSuccess: (result: "submitted" | "edit_pending") => void;
  onCancel: () => void;
}) {
  const sub = existingSubmission;

  const existingChapterIds: string[] = useMemo(() => {
    if (!sub?.selectedChapterIds) return [];
    try { return JSON.parse(sub.selectedChapterIds) as string[]; } catch { return []; }
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
  const [error, setError] = useState("");
  const [actionPending, startTransition] = useTransition();

  const wc = wordCount(description);

  function toggleChapter(id: string) {
    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    setError("");
    const fd = new FormData();
    fd.set("workId", workId);
    fd.set("submissionType", submissionType);
    if (submissionType === "chapters") {
      for (const id of selectedChapterIds) fd.append("selectedChapterIds[]", id);
    }
    fd.set("title", title);
    fd.set("description", description);
    fd.set("contentRating", contentRating);

    if (coverMode === "upload" && coverFile) {
      fd.set("coverImage", coverFile);
    } else if (coverMode === "upload" && sub?.hasCoverImage && !coverFile) {
      fd.set("keepCover", "1");
    } else if (coverMode === "preset" && coverBgIndex) {
      fd.set("coverBgIndex", String(coverBgIndex));
    }

    startTransition(async () => {
      const result = await submitFreeRead(null, fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success === "edit_pending") {
        onSuccess("edit_pending");
      } else {
        onSuccess("submitted");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Notice for approved edits */}
      {isEdit && (
        <div style={{
          background: "rgba(201,168,76,0.06)", border: "1px solid var(--color-gold-dim)",
          borderLeft: "3px solid var(--color-gold)", borderRadius: "4px", padding: "0.85rem 1rem",
        }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-gold)", margin: 0 }}>
            Your current published version will remain live until your new version is approved by WriteWright.
          </p>
        </div>
      )}

      {/* What to share */}
      <div>
        <label style={labelStyle}>What to share</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", cursor: "pointer" }}>
            <input type="radio" name="submissionType" value="full"
              checked={submissionType === "full"} onChange={() => setSubmissionType("full")}
              style={{ marginTop: "0.2rem", accentColor: "var(--color-gold)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink)" }}>
              Full work — submit all chapters
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", cursor: "pointer" }}>
            <input type="radio" name="submissionType" value="chapters"
              checked={submissionType === "chapters"} onChange={() => setSubmissionType("chapters")}
              style={{ marginTop: "0.2rem", accentColor: "var(--color-gold)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-ink)" }}>
              Specific chapters — choose which to include
            </span>
          </label>
        </div>

        {submissionType === "chapters" && (
          <div style={{
            marginTop: "0.75rem", padding: "0.75rem 1rem",
            background: "var(--color-bg)", borderRadius: "3px", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", gap: "0.4rem",
          }}>
            {chapters.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", margin: 0 }}>
                No chapters yet. Create chapters in the editor first.
              </p>
            ) : chapters.map((ch) => (
              <label key={ch.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" checked={selectedChapterIds.includes(ch.id)}
                  onChange={() => toggleChapter(ch.id)}
                  style={{ accentColor: "var(--color-gold)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
                  {ch.title}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Content rating */}
      <div>
        <label htmlFor="contentRating" style={labelStyle}>Content Rating</label>
        <select id="contentRating" value={contentRating} onChange={(e) => setContentRating(e.target.value)}
          style={{ ...inputStyle, fontFamily: "var(--font-body)" }}>
          {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Submission title */}
      <div>
        <label htmlFor="sub-title" style={labelStyle}>Submission Title</label>
        <input id="sub-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          required style={inputStyle} />
      </div>

      {/* Description */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
          <label htmlFor="sub-description" style={{ ...labelStyle, marginBottom: 0 }}>Short Description</label>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: wc > 100 ? "#d4848e" : "var(--color-ink-faint)" }}>
            {wc} / 100 words
          </span>
        </div>
        <textarea id="sub-description" value={description} onChange={(e) => setDescription(e.target.value)}
          required rows={4} placeholder="A short description that appears on the Start Reading card…"
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
      </div>

      {/* Cover image */}
      <div>
        <label style={labelStyle}>Cover Image (optional)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {(["none", "upload", "preset"] as const).map((mode) => (
            <label key={mode} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="radio" checked={coverMode === mode}
                onChange={() => { setCoverMode(mode); if (mode !== "preset") setCoverBgIndex(null); if (mode !== "upload") setCoverFile(null); }}
                style={{ accentColor: "var(--color-gold)", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
                {mode === "none" ? "No cover — use dark placeholder" : mode === "upload" ? "Upload a photo" : "Choose a preset background"}
              </span>
            </label>
          ))}

          {coverMode === "upload" && (
            <div style={{ marginLeft: "1.5rem" }}>
              {sub?.hasCoverImage && coverFile === null && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-gold)", fontStyle: "italic", marginBottom: "0.4rem" }}>
                  Current cover will be kept. Upload a new file to replace it.
                </p>
              )}
              <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-muted)", display: "block" }} />
            </div>
          )}

          {coverMode === "preset" && (
            <div style={{ marginLeft: "1.5rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setCoverBgIndex(n)} style={{
                    width: "60px", height: "80px", padding: 0, cursor: "pointer",
                    border: coverBgIndex === n ? "2px solid var(--color-gold)" : "2px solid transparent",
                    borderRadius: "3px", overflow: "hidden", background: "none",
                    opacity: coverBgIndex === n ? 1 : 0.7,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/cover-backgrounds/cover-bg-${n}.jpg`} alt={`Preset ${n}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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

      {error && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={actionPending || wc > 100}
          style={{
            background: actionPending ? "var(--color-border)" : "var(--color-gold)",
            border: "none", borderRadius: "3px", padding: "0.65rem 1.5rem",
            color: actionPending ? "var(--color-ink-muted)" : "var(--color-bg)",
            fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.06em",
            cursor: actionPending || wc > 100 ? "default" : "pointer",
          }}
        >
          {actionPending ? "Submitting…" : isEdit ? "Submit New Version" : "Submit for Approval"}
        </button>
        <button type="button" onClick={onCancel} style={{
          background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px",
          padding: "0.6rem 1rem", color: "var(--color-ink-faint)",
          fontFamily: "var(--font-body)", fontSize: "0.85rem", cursor: "pointer",
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function FreeReadSubmitForm({ workId, workTitle, chapters, existingSubmission }: Props) {
  const router = useRouter();
  const sub = existingSubmission;

  type LocalStatus = "none" | "pending" | "approved" | "rejected";
  const [localStatus, setLocalStatus] = useState<LocalStatus>(
    sub ? (sub.status as LocalStatus) : "none"
  );
  const [hasPendingEdit, setHasPendingEdit] = useState(sub?.hasPendingEdit ?? false);
  const [showForm, setShowForm] = useState(false);
  const [actionPending, startTransition] = useTransition();

  function handleWithdraw() {
    if (!window.confirm("Are you sure you want to withdraw this submission?")) return;
    startTransition(async () => {
      await withdrawFreeRead(workId);
      setLocalStatus("none");
      router.refresh();
    });
  }

  function handleUnpublish() {
    if (!window.confirm("Are you sure you want to remove this from Start Reading? It will no longer be visible to readers.")) return;
    startTransition(async () => {
      await unpublishFreeRead(workId);
      setLocalStatus("rejected");
      setHasPendingEdit(false);
    });
  }

  function handleFormSuccess(result: "submitted" | "edit_pending") {
    setShowForm(false);
    if (result === "edit_pending") {
      setHasPendingEdit(true);
      // status stays "approved", live version remains
    } else {
      setLocalStatus("pending");
    }
  }

  if (showForm) {
    return (
      <SubmitForm
        workId={workId}
        workTitle={workTitle}
        chapters={chapters}
        existingSubmission={sub}
        isEdit={localStatus === "approved"}
        onSuccess={handleFormSuccess}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div style={{ opacity: actionPending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      {localStatus === "none" && (
        <NeverSubmittedState onBegin={() => setShowForm(true)} />
      )}
      {localStatus === "pending" && sub && (
        <PendingState sub={sub} onWithdraw={handleWithdraw} />
      )}
      {localStatus === "approved" && sub && (
        <ApprovedState
          sub={{ ...sub, hasPendingEdit }}
          onSubmitNew={() => setShowForm(true)}
          onUnpublish={handleUnpublish}
        />
      )}
      {localStatus === "rejected" && sub && (
        <RejectedState sub={sub} onSubmitAgain={() => setShowForm(true)} />
      )}
    </div>
  );
}
