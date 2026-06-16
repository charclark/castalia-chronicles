"use client";

import { useState, useTransition } from "react";
import { approveAuthorProfile, rejectAuthorProfile, dismissAuthorProfile } from "@/app/actions/author-profiles";
import { approveJoinRequest, rejectJoinRequest, dismissJoinRequest } from "@/app/actions/join-requests";
import { approveFreeReadSubmission, rejectFreeReadSubmission, dismissFreeReadSubmission } from "@/app/actions/free-read-submissions";
import { approveDiscoverBooksSubmission, rejectDiscoverBooksSubmission, dismissDiscoverBooksSubmission } from "@/app/actions/discover-books-submissions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  eyebrowText: string | null;
  headline: string | null;
  bodyText: string | null;
  hasPhoto: boolean;
  status: string;
  submittedAt: string;
  approvedAt: string | null;
  rejectionNote: string | null;
  user: { id: string; username: string };
};

type JoinRequest = {
  id: string;
  fullName: string;
  email: string;
  requestedUsername: string;
  genres: string;
  aboutYou: string;
  existingWorkLink: string | null;
  howDidYouHear: string | null;
  confirmedAge: boolean;
  confirmedOriginalAuthor: boolean;
  confirmedPlagiarism: boolean;
  confirmedApproval: boolean;
  confirmedPersonalUse: boolean;
  confirmedRightToRefuse: boolean;
  confirmedTerms: boolean;
  termsVersion: string;
  ipAddress: string;
  submittedAt: string;
  status: string;
  reviewedAt: string | null;
  rejectionNote: string | null;
};

type FreeReadSub = {
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
  reviewedAt: string | null;
  rejectionNote: string | null;
  work: { id: string; title: string; type: string; content: string };
  user: { id: string; username: string };
  chapterMap: Record<string, string>;
  chapterContent: Record<string, string>;
};

type DiscoverBooksSub = {
  id: string;
  bookTitle: string;
  authorName: string;
  coverBgIndex: number | null;
  hasCoverImage: boolean;
  purchaseUrl: string;
  purchaseLinkText: string;
  description: string;
  contentRating: string;
  status: string;
  submittedAt: string;
  rejectionNote: string | null;
  work: { id: string; title: string };
  user: { id: string; username: string };
  isReplacing: boolean;
};

// ── Shared style constants ─────────────────────────────────────────────────────

const statusColors: Record<string, { color: string; border: string; bg: string }> = {
  pending:  { color: "var(--color-gold)",    border: "var(--color-gold-dim)",    bg: "rgba(201,168,76,0.08)" },
  approved: { color: "#8bc98d",              border: "rgba(76,139,64,0.35)",     bg: "rgba(76,139,64,0.08)" },
  rejected: { color: "#d4848e",              border: "var(--color-crimson-dim)", bg: "rgba(139,38,53,0.08)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusColors[status] ?? statusColors.pending;
  return (
    <span style={{
      fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em",
      textTransform: "uppercase", color: s.color,
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: "2px", padding: "0.1rem 0.45rem",
    }}>
      {status}
    </span>
  );
}

const metaText: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-ink-faint)",
};
const metaLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--color-ink-faint)", marginBottom: "0.15rem",
};
const cardStyle: React.CSSProperties = {
  background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
  borderRadius: "4px", padding: "1.25rem 1.5rem",
};

// ── Reject with note prompt ───────────────────────────────────────────────────

function promptRejectNote(label: string): { confirmed: boolean; note: string | undefined } {
  const note = window.prompt(`Reject ${label}?\n\nOptional feedback for the author (leave blank for none):`);
  if (note === null) return { confirmed: false, note: undefined };
  return { confirmed: true, note: note.trim() || undefined };
}

// ── Approve/Reject/Dismiss buttons ────────────────────────────────────────────

function ActionButtons({ status, pending, tab, onApprove, onReject, onDismiss }: {
  status: string;
  pending: boolean;
  tab: "pending" | "approved" | "rejected";
  onApprove: () => void;
  onReject: () => void;
  onDismiss: () => void;
}) {
  if (tab === "rejected") {
    return (
      <button
        onClick={onDismiss}
        disabled={pending}
        style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem",
          color: "var(--color-ink-faint)",
          background: "transparent",
          border: "1px solid var(--color-border)",
          borderRadius: "3px", padding: "0.3rem 0.85rem",
          cursor: pending ? "default" : "pointer",
        }}
      >
        Dismiss (delete record)
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
      <button onClick={onApprove} disabled={pending || status === "approved"} style={{
        fontFamily: "var(--font-body)", fontSize: "0.82rem",
        color: status === "approved" ? "var(--color-ink-faint)" : "#8bc98d",
        background: "transparent",
        border: `1px solid ${status === "approved" ? "var(--color-border)" : "rgba(76,139,64,0.35)"}`,
        borderRadius: "3px", padding: "0.3rem 0.85rem",
        cursor: pending || status === "approved" ? "default" : "pointer",
      }}>
        {status === "approved" ? "Approved ✓" : "Approve"}
      </button>
      <button onClick={onReject} disabled={pending || status === "rejected"} style={{
        fontFamily: "var(--font-body)", fontSize: "0.82rem",
        color: status === "rejected" ? "var(--color-ink-faint)" : "#d4848e",
        background: "transparent",
        border: `1px solid ${status === "rejected" ? "var(--color-border)" : "var(--color-crimson-dim)"}`,
        borderRadius: "3px", padding: "0.3rem 0.85rem",
        cursor: pending || status === "rejected" ? "default" : "pointer",
      }}>
        {status === "rejected" ? "Rejected" : "Reject…"}
      </button>
    </div>
  );
}

// ── Author Profile Card ───────────────────────────────────────────────────────

function ProfileCard({ profile, tab, onRemove }: { profile: Profile; tab: "pending" | "approved" | "rejected"; onRemove: (id: string) => void }) {
  const [status, setStatus] = useState(profile.status);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const submitted = new Date(profile.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ ...cardStyle, opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {profile.hasPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/author-photo/${profile.user.id}`} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border)", flexShrink: 0 }} />
          )}
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink)", marginBottom: "0.15rem" }}>
              {profile.headline || <em style={{ color: "var(--color-ink-faint)" }}>No headline</em>}
            </p>
            <p style={metaText}>@{profile.user.username} · submitted {submitted}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.2rem 0.6rem", color: "var(--color-ink-faint)", cursor: "pointer" }}
          >
            {expanded ? "Collapse" : "Full preview"}
          </button>
        </div>
      </div>

      {profile.eyebrowText && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem" }}>
          {profile.eyebrowText}
        </p>
      )}

      {profile.bodyText && (
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.6, marginBottom: "1rem",
          ...(expanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }),
        }}>
          {profile.bodyText}
        </p>
      )}

      {profile.rejectionNote && status === "rejected" && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontStyle: "italic", color: "#d4848e", marginBottom: "0.75rem" }}>
          Note left: "{profile.rejectionNote}"
        </p>
      )}

      <ActionButtons
        status={status} pending={pending} tab={tab}
        onApprove={() => startTransition(async () => { await approveAuthorProfile(profile.id); setStatus("approved"); })}
        onReject={() => {
          const { confirmed, note } = promptRejectNote(`${profile.user.username}'s author profile`);
          if (!confirmed) return;
          startTransition(async () => { await rejectAuthorProfile(profile.id, note); setStatus("rejected"); });
        }}
        onDismiss={() => {
          if (!window.confirm(`Permanently delete ${profile.user.username}'s rejected profile?`)) return;
          startTransition(async () => { await dismissAuthorProfile(profile.id); onRemove(profile.id); });
        }}
      />
    </div>
  );
}

// ── Join Request Card ─────────────────────────────────────────────────────────

function JoinRequestCard({ req, tab, onRemove }: { req: JoinRequest; tab: "pending" | "approved" | "rejected"; onRemove: (id: string) => void }) {
  const [status, setStatus] = useState(req.status);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const submitted = new Date(req.submittedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const boolIcon = (v: boolean) => (
    <span style={{ color: v ? "#8bc98d" : "#d4848e", fontSize: "0.82rem", fontWeight: 600 }}>{v ? "Yes" : "No"}</span>
  );

  return (
    <div style={{ ...cardStyle, opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink)", marginBottom: "0.15rem" }}>{req.fullName}</p>
          <p style={metaText}>{req.email} · @{req.requestedUsername} · {submitted}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.2rem 0.6rem", color: "var(--color-ink-faint)", cursor: "pointer" }}
          >
            {expanded ? "Collapse" : "Details"}
          </button>
        </div>
      </div>

      <p style={{ ...metaText, marginBottom: expanded ? "1rem" : "0.75rem" }}>
        <strong style={{ color: "var(--color-ink-muted)" }}>Genres:</strong> {req.genres}
      </p>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <p style={metaLabel}>About You and Your Writing</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{req.aboutYou}</p>
          </div>

          {req.existingWorkLink && (
            <div>
              <p style={metaLabel}>Existing Work Link</p>
              <a href={req.existingWorkLink} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-gold)", wordBreak: "break-all" }}>{req.existingWorkLink}</a>
            </div>
          )}

          {req.howDidYouHear && (
            <div>
              <p style={metaLabel}>How Did You Hear</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>{req.howDidYouHear}</p>
            </div>
          )}

          <div>
            <p style={metaLabel}>Confirmations</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem 1.5rem" }}>
              {([
                ["18+ confirmed",      req.confirmedAge],
                ["Original author",    req.confirmedOriginalAuthor],
                ["No plagiarism",      req.confirmedPlagiarism],
                ["Content approval",   req.confirmedApproval],
                ["Personal use only",  req.confirmedPersonalUse],
                ["Right to refuse",    req.confirmedRightToRefuse],
                ["Terms agreed",       req.confirmedTerms],
              ] as [string, boolean][]).map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  {boolIcon(val)}
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem" }}>
            <div>
              <p style={metaLabel}>Terms Version</p>
              <p style={metaText}>{req.termsVersion}</p>
            </div>
            <div>
              <p style={metaLabel}>IP Address</p>
              <p style={{ ...metaText, fontFamily: "monospace" }}>{req.ipAddress}</p>
            </div>
          </div>
        </div>
      )}

      {req.rejectionNote && status === "rejected" && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontStyle: "italic", color: "#d4848e", marginBottom: "0.75rem" }}>
          Note left: "{req.rejectionNote}"
        </p>
      )}

      <ActionButtons
        status={status} pending={pending} tab={tab}
        onApprove={() => startTransition(async () => { await approveJoinRequest(req.id); setStatus("approved"); })}
        onReject={() => {
          const { confirmed, note } = promptRejectNote(`${req.fullName}'s application`);
          if (!confirmed) return;
          startTransition(async () => { await rejectJoinRequest(req.id, note); setStatus("rejected"); });
        }}
        onDismiss={() => {
          if (!window.confirm(`Permanently delete ${req.fullName}'s rejected application?`)) return;
          startTransition(async () => { await dismissJoinRequest(req.id); onRemove(req.id); });
        }}
      />
    </div>
  );
}

// ── Free Read Submission Card ─────────────────────────────────────────────────

function FreeReadSubCard({ sub, tab, onRemove }: { sub: FreeReadSub; tab: "pending" | "approved" | "rejected"; onRemove: (id: string) => void }) {
  const [status, setStatus] = useState(sub.status);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const submitted = new Date(sub.submittedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const chapterIds: string[] = (() => {
    if (sub.submissionType !== "chapters" || !sub.selectedChapterIds) return [];
    try { return JSON.parse(sub.selectedChapterIds) as string[]; } catch { return []; }
  })();

  const chapterTitles = chapterIds.map((id) => sub.chapterMap[id] ?? id);

  const coverSrc = sub.hasCoverImage
    ? `/api/free-read-cover/${sub.id}`
    : sub.coverBgIndex
    ? `/cover-backgrounds/cover-bg-${sub.coverBgIndex}.jpg`
    : null;

  return (
    <div style={{ ...cardStyle, opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink)", marginBottom: "0.15rem" }}>
            {sub.title}
          </p>
          <p style={metaText}>
            @{sub.user.username} · {sub.work.title} ({sub.work.type}) · {submitted}
          </p>
          <p style={{ ...metaText, marginTop: "0.15rem" }}>
            <strong style={{ color: "var(--color-ink-muted)" }}>Rating:</strong> {sub.contentRating}
            {" · "}
            <strong style={{ color: "var(--color-ink-muted)" }}>Content:</strong>{" "}
            {sub.submissionType === "full" ? "Full work" : `${chapterTitles.length} chapter(s)`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.2rem 0.6rem", color: "var(--color-ink-faint)", cursor: "pointer" }}
          >
            {expanded ? "Collapse" : "Full preview"}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {coverSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} alt="Cover" style={{ width: "72px", height: "100px", objectFit: "cover", borderRadius: "3px", border: "1px solid var(--color-border)", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={metaLabel}>Description</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{sub.description}</p>
            </div>
          </div>

          {/* Full content preview */}
          {sub.submissionType === "chapters" && chapterIds.length > 0 && (
            <div>
              <p style={metaLabel}>Chapter Content</p>
              {chapterIds.map((id) => (
                <div key={id} style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-gold)", marginBottom: "0.5rem" }}>
                    {sub.chapterMap[id] ?? id}
                  </p>
                  {sub.chapterContent[id] ? (
                    <div
                      className="prose-preview"
                      dangerouslySetInnerHTML={{ __html: sub.chapterContent[id] }}
                      style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.75, maxHeight: "320px", overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.75rem 1rem" }}
                    />
                  ) : (
                    <p style={{ ...metaText, fontStyle: "italic" }}>No content.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {sub.submissionType === "full" && (
            <div>
              <p style={metaLabel}>Full Work Content</p>
              {sub.work.content ? (
                <div
                  className="prose-preview"
                  dangerouslySetInnerHTML={{ __html: sub.work.content }}
                  style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.75, maxHeight: "400px", overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.75rem 1rem" }}
                />
              ) : (
                <p style={{ ...metaText, fontStyle: "italic" }}>No content saved yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {sub.rejectionNote && status === "rejected" && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontStyle: "italic", color: "#d4848e", marginBottom: "0.75rem" }}>
          Note left: "{sub.rejectionNote}"
        </p>
      )}

      <ActionButtons
        status={status} pending={pending} tab={tab}
        onApprove={() => startTransition(async () => { await approveFreeReadSubmission(sub.id); setStatus("approved"); })}
        onReject={() => {
          const { confirmed, note } = promptRejectNote(`"${sub.title}" by @${sub.user.username}`);
          if (!confirmed) return;
          startTransition(async () => { await rejectFreeReadSubmission(sub.id, note); setStatus("rejected"); });
        }}
        onDismiss={() => {
          if (!window.confirm(`Permanently delete "${sub.title}"'s rejected submission?`)) return;
          startTransition(async () => { await dismissFreeReadSubmission(sub.id); onRemove(sub.id); });
        }}
      />
    </div>
  );
}

// ── Discover Books Submission Card ────────────────────────────────────────────

function DiscoverBooksSubCard({ sub, tab, onRemove }: { sub: DiscoverBooksSub; tab: "pending" | "approved" | "rejected"; onRemove: (id: string) => void }) {
  const [status, setStatus] = useState(sub.status);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const submitted = new Date(sub.submittedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const coverSrc = sub.hasCoverImage
    ? `/api/discover-books-cover/${sub.id}`
    : sub.coverBgIndex
    ? `/cover-backgrounds/cover-bg-${sub.coverBgIndex}.jpg`
    : null;

  return (
    <div style={{ ...cardStyle, opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink)", marginBottom: "0.15rem" }}>
            {sub.bookTitle}
          </p>
          <p style={metaText}>
            by {sub.authorName} · @{sub.user.username} · {sub.work.title} · {submitted}
          </p>
          <p style={{ ...metaText, marginTop: "0.15rem" }}>
            <strong style={{ color: "var(--color-ink-muted)" }}>Rating:</strong> {sub.contentRating}
            {" · "}
            <strong style={{ color: "var(--color-ink-muted)" }}>Link:</strong> {sub.purchaseLinkText}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {sub.isReplacing && (
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.08em",
              textTransform: "uppercase", color: "var(--color-gold)",
              background: "rgba(201,168,76,0.08)", border: "1px solid var(--color-gold-dim)",
              borderRadius: "2px", padding: "0.1rem 0.45rem",
            }}>
              Replacing live listing
            </span>
          )}
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "3px", padding: "0.2rem 0.6rem", color: "var(--color-ink-faint)", cursor: "pointer" }}
          >
            {expanded ? "Collapse" : "Full preview"}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {coverSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} alt="Cover" style={{ width: "72px", height: "108px", objectFit: "cover", borderRadius: "3px", border: "1px solid var(--color-border)", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={metaLabel}>Description</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{sub.description}</p>
              <p style={{ ...metaLabel, marginTop: "0.75rem" }}>Purchase URL</p>
              <a href={sub.purchaseUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-gold)", wordBreak: "break-all" }}>
                {sub.purchaseUrl}
              </a>
            </div>
          </div>
        </div>
      )}

      {sub.rejectionNote && status === "rejected" && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontStyle: "italic", color: "#d4848e", marginBottom: "0.75rem" }}>
          Note left: "{sub.rejectionNote}"
        </p>
      )}

      <ActionButtons
        status={status} pending={pending} tab={tab}
        onApprove={() => startTransition(async () => { await approveDiscoverBooksSubmission(sub.id); setStatus("approved"); })}
        onReject={() => {
          const { confirmed, note } = promptRejectNote(`"${sub.bookTitle}" by ${sub.authorName}`);
          if (!confirmed) return;
          startTransition(async () => { await rejectDiscoverBooksSubmission(sub.id, note); setStatus("rejected"); });
        }}
        onDismiss={() => {
          if (!window.confirm(`Permanently delete "${sub.bookTitle}"'s rejected submission?`)) return;
          startTransition(async () => { await dismissDiscoverBooksSubmission(sub.id); onRemove(sub.id); });
        }}
      />
    </div>
  );
}

// ── Tabbed section ────────────────────────────────────────────────────────────

type Tab = "pending" | "approved" | "rejected";

function TabBar({ active, counts, onChange }: { active: Tab; counts: Record<Tab, number>; onChange: (t: Tab) => void }) {
  const tabs: Tab[] = ["pending", "approved", "rejected"];
  return (
    <div style={{ display: "flex", gap: "0.25rem", marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0" }}>
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            style={{
              fontFamily: "var(--font-body)", fontSize: "0.85rem",
              textTransform: "capitalize",
              padding: "0.5rem 1.1rem",
              background: "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid var(--color-gold)" : "2px solid transparent",
              color: isActive ? "var(--color-gold)" : "var(--color-ink-faint)",
              cursor: "pointer",
              marginBottom: "-1px",
            }}
          >
            {t} {counts[t] > 0 ? `(${counts[t]})` : ""}
          </button>
        );
      })}
    </div>
  );
}

function SectionBlock<T extends { id: string; status: string }>({
  title, subtitle, emptyLabel, items, tab, renderCard,
}: {
  title: string;
  subtitle: string;
  emptyLabel: string;
  items: T[];
  tab: Tab;
  renderCard: (item: T) => React.ReactNode;
}) {
  const filtered = items.filter((i) => i.status === tab);

  return (
    <div style={{ marginBottom: "3.5rem" }}>
      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
        {title}
      </h3>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.5rem" }}>
        {subtitle}
      </p>
      {filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", padding: "0.5rem 0" }}>
          No {emptyLabel} {tab}.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {filtered.map((i) => renderCard(i))}
        </div>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function ApprovalsClient({
  profiles: initialProfiles,
  joinRequests: initialJoinRequests,
  freeReadSubmissions: initialFreeRead,
  discoverBooksSubmissions: initialDiscoverBooks,
}: {
  profiles: Profile[];
  joinRequests: JoinRequest[];
  freeReadSubmissions: FreeReadSub[];
  discoverBooksSubmissions: DiscoverBooksSub[];
}) {
  const [tab, setTab] = useState<Tab>("pending");
  const [profiles, setProfiles] = useState(initialProfiles);
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests);
  const [freeRead, setFreeRead] = useState(initialFreeRead);
  const [discoverBooks, setDiscoverBooks] = useState(initialDiscoverBooks);

  const removeProfile     = (id: string) => setProfiles((p) => p.filter((x) => x.id !== id));
  const removeJoinRequest = (id: string) => setJoinRequests((p) => p.filter((x) => x.id !== id));
  const removeFreeRead    = (id: string) => setFreeRead((p) => p.filter((x) => x.id !== id));
  const removeDiscoverBooks = (id: string) => setDiscoverBooks((p) => p.filter((x) => x.id !== id));

  const counts = (items: { status: string }[]): Record<Tab, number> => ({
    pending:  items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  });

  const totalCounts: Record<Tab, number> = {
    pending:  counts(profiles).pending  + counts(joinRequests).pending  + counts(freeRead).pending  + counts(discoverBooks).pending,
    approved: counts(profiles).approved + counts(joinRequests).approved + counts(freeRead).approved + counts(discoverBooks).approved,
    rejected: counts(profiles).rejected + counts(joinRequests).rejected + counts(freeRead).rejected + counts(discoverBooks).rejected,
  };

  return (
    <div>
      <TabBar active={tab} counts={totalCounts} onChange={setTab} />

      <SectionBlock
        title="Discover Books Submissions"
        subtitle="Book listings submitted for the public Discover Books page."
        emptyLabel="Discover Books submissions"
        items={discoverBooks}
        tab={tab}
        renderCard={(s) => (
          <DiscoverBooksSubCard key={s.id} sub={s} tab={tab} onRemove={removeDiscoverBooks} />
        )}
      />

      <div style={{ height: "1px", background: "var(--color-border-light)", marginBottom: "3.5rem" }} />

      <SectionBlock
        title="Start Reading Submissions"
        subtitle="Works submitted for the public Start Reading section."
        emptyLabel="Start Reading submissions"
        items={freeRead}
        tab={tab}
        renderCard={(s) => (
          <FreeReadSubCard key={s.id} sub={s} tab={tab} onRemove={removeFreeRead} />
        )}
      />

      <div style={{ height: "1px", background: "var(--color-border-light)", marginBottom: "3.5rem" }} />

      <SectionBlock
        title="Join Requests"
        subtitle="Applications submitted via the Write With Us page."
        emptyLabel="join requests"
        items={joinRequests}
        tab={tab}
        renderCard={(r) => (
          <JoinRequestCard key={r.id} req={r} tab={tab} onRemove={removeJoinRequest} />
        )}
      />

      <div style={{ height: "1px", background: "var(--color-border-light)", marginBottom: "3.5rem" }} />

      <SectionBlock
        title="Author Profile Approvals"
        subtitle="Profiles submitted for display on the public Our Authors page."
        emptyLabel="author profiles"
        items={profiles}
        tab={tab}
        renderCard={(p) => (
          <ProfileCard key={p.id} profile={p} tab={tab} onRemove={removeProfile} />
        )}
      />
    </div>
  );
}
