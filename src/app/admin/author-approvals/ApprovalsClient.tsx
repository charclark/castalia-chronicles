"use client";

import { useState, useTransition } from "react";
import { approveAuthorProfile, rejectAuthorProfile } from "@/app/actions/author-profiles";
import { approveJoinRequest, rejectJoinRequest } from "@/app/actions/join-requests";
import { approveFreeReadSubmission, rejectFreeReadSubmission } from "@/app/actions/free-read-submissions";
import { approveDiscoverBooksSubmission, rejectDiscoverBooksSubmission } from "@/app/actions/discover-books-submissions";

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
};

// ── Shared components ─────────────────────────────────────────────────────────

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

function ApproveRejectButtons({ status, pending, onApprove, onReject }: {
  status: string; pending: boolean; onApprove: () => void; onReject: () => void;
}) {
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
        {status === "rejected" ? "Rejected" : "Reject"}
      </button>
    </div>
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

// ── Author Profile Card ───────────────────────────────────────────────────────

function ProfileCard({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState(profile.status);
  const [pending, startTransition] = useTransition();
  const submitted = new Date(profile.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ ...cardStyle, opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
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
        <StatusBadge status={status} />
      </div>

      {profile.eyebrowText && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.4rem" }}>
          {profile.eyebrowText}
        </p>
      )}
      {profile.bodyText && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.6, marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {profile.bodyText}
        </p>
      )}

      <ApproveRejectButtons
        status={status} pending={pending}
        onApprove={() => startTransition(async () => { await approveAuthorProfile(profile.id); setStatus("approved"); })}
        onReject={() => {
          if (!window.confirm(`Reject ${profile.user.username}'s author profile?`)) return;
          startTransition(async () => { await rejectAuthorProfile(profile.id); setStatus("rejected"); });
        }}
      />
    </div>
  );
}

// ── Join Request Card ─────────────────────────────────────────────────────────

function JoinRequestCard({ req }: { req: JoinRequest }) {
  const [status, setStatus] = useState(req.status);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(req.status === "pending");

  const submitted = new Date(req.submittedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const boolIcon = (v: boolean) => (
    <span style={{ color: v ? "#8bc98d" : "#d4848e", fontSize: "0.82rem", fontWeight: 600 }}>{v ? "Yes" : "No"}</span>
  );

  return (
    <div style={{ ...cardStyle, opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      {/* Header */}
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

      <ApproveRejectButtons
        status={status} pending={pending}
        onApprove={() => startTransition(async () => { await approveJoinRequest(req.id); setStatus("approved"); })}
        onReject={() => {
          if (!window.confirm(`Reject ${req.fullName}'s application?`)) return;
          startTransition(async () => { await rejectJoinRequest(req.id); setStatus("rejected"); });
        }}
      />
    </div>
  );
}

// ── Free Read Submission Card ─────────────────────────────────────────────────

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
  work: { id: string; title: string; type: string };
  user: { id: string; username: string };
  chapterMap: Record<string, string>;
};

function FreeReadSubCard({ sub }: { sub: FreeReadSub }) {
  const [status, setStatus] = useState(sub.status);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(sub.status === "pending");

  const submitted = new Date(sub.submittedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const chapterTitles: string[] = (() => {
    if (sub.submissionType !== "chapters" || !sub.selectedChapterIds) return [];
    try {
      const ids = JSON.parse(sub.selectedChapterIds) as string[];
      return ids.map((id) => sub.chapterMap[id] ?? id);
    } catch { return []; }
  })();

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
            {expanded ? "Collapse" : "Details"}
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

          {sub.submissionType === "chapters" && chapterTitles.length > 0 && (
            <div>
              <p style={metaLabel}>Selected Chapters</p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {chapterTitles.map((t, i) => (
                  <li key={i} style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-muted)" }}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ApproveRejectButtons
        status={status} pending={pending}
        onApprove={() => startTransition(async () => { await approveFreeReadSubmission(sub.id); setStatus("approved"); })}
        onReject={() => {
          if (!window.confirm(`Reject "${sub.title}" by @${sub.user.username}?`)) return;
          startTransition(async () => { await rejectFreeReadSubmission(sub.id); setStatus("rejected"); });
        }}
      />
    </div>
  );
}

// ── Discover Books Submission Card ────────────────────────────────────────────

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
  work: { id: string; title: string };
  user: { id: string; username: string };
  isReplacing: boolean;
};

function DiscoverBooksSubCard({ sub }: { sub: DiscoverBooksSub }) {
  const [status, setStatus] = useState(sub.status);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(sub.status === "pending");

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
            {expanded ? "Collapse" : "Details"}
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

      <ApproveRejectButtons
        status={status} pending={pending}
        onApprove={() => startTransition(async () => { await approveDiscoverBooksSubmission(sub.id); setStatus("approved"); })}
        onReject={() => {
          if (!window.confirm(`Reject "${sub.bookTitle}" by ${sub.authorName}?`)) return;
          startTransition(async () => { await rejectDiscoverBooksSubmission(sub.id); setStatus("rejected"); });
        }}
      />
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function CardSection<T extends { id: string; status: string }>({
  emptyLabel, items, renderCard,
}: {
  emptyLabel: string;
  items: T[];
  renderCard: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", padding: "0.75rem 0" }}>
        No {emptyLabel} yet.
      </p>
    );
  }

  const pending = items.filter((i) => i.status === "pending");
  const rest    = items.filter((i) => i.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {pending.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.75rem" }}>
            Pending ({pending.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {pending.map((i) => renderCard(i))}
          </div>
        </div>
      )}
      {rest.length > 0 && (
        <div>
          {pending.length > 0 && <div style={{ height: "1px", background: "var(--color-border)", margin: "0.5rem 0 1.5rem" }} />}
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.75rem" }}>
            Reviewed
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {rest.map((i) => renderCard(i))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function ApprovalsClient({
  profiles,
  joinRequests,
  freeReadSubmissions,
  discoverBooksSubmissions,
}: {
  profiles: Profile[];
  joinRequests: JoinRequest[];
  freeReadSubmissions: FreeReadSub[];
  discoverBooksSubmissions: DiscoverBooksSub[];
}) {
  return (
    <div>
      {/* Discover Books Submissions */}
      <div style={{ marginBottom: "3.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
          Discover Books Submissions
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.75rem" }}>
          Book listings submitted for the public Discover Books page.
        </p>
        <CardSection
          emptyLabel="Discover Books submissions"
          items={discoverBooksSubmissions}
          renderCard={(s) => <DiscoverBooksSubCard key={s.id} sub={s} />}
        />
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--color-border-light)", marginBottom: "3.5rem" }} />

      {/* Start Reading Submissions */}
      <div style={{ marginBottom: "3.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
          Start Reading Submissions
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.75rem" }}>
          Works submitted for the public Start Reading section.
        </p>
        <CardSection
          emptyLabel="Start Reading submissions"
          items={freeReadSubmissions}
          renderCard={(s) => <FreeReadSubCard key={s.id} sub={s} />}
        />
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--color-border-light)", marginBottom: "3.5rem" }} />

      {/* Join Requests */}
      <div style={{ marginBottom: "3.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
          Join Requests
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.75rem" }}>
          Applications submitted via the Write With Us page.
        </p>
        <CardSection
          emptyLabel="join requests submitted"
          items={joinRequests}
          renderCard={(r) => <JoinRequestCard key={r.id} req={r} />}
        />
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--color-border-light)", marginBottom: "3.5rem" }} />

      {/* Author Profile Approvals */}
      <div>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
          Author Profile Approvals
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginBottom: "1.75rem" }}>
          Profiles submitted for display on the public Our Authors page.
        </p>
        <CardSection
          emptyLabel="author profiles submitted"
          items={profiles}
          renderCard={(p) => <ProfileCard key={p.id} profile={p} />}
        />
      </div>
    </div>
  );
}
