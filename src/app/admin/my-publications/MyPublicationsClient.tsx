"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { unpublishFreeRead } from "@/app/actions/free-read-submissions";
import { unpublishDiscoverBooks } from "@/app/actions/discover-books-submissions";

type FreeReadSub = {
  id: string;
  title: string;
  description: string;
  submissionType: string;
  contentRating: string;
  coverBgIndex: number | null;
  hasCoverImage: boolean;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  rejectionNote: string | null;
  hasPendingEdit: boolean;
  work: { id: string; title: string };
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
  reviewedAt: string | null;
  publishedAt: string | null;
  rejectionNote: string | null;
  hasPendingEdit: boolean;
  work: { id: string; title: string };
};

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
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
  borderRadius: "4px", padding: "1.1rem 1.4rem",
  display: "flex", flexDirection: "column", gap: "0.65rem",
};

const metaText: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-ink-faint)",
};

// ── Free Read Row ─────────────────────────────────────────────────────────────

function EditPendingNote() {
  return (
    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontStyle: "italic", color: "var(--color-gold)", marginTop: "0.3rem" }}>
      An edit is pending review. Your published version stays live until it's approved.
    </p>
  );
}

function FreeReadRow({ sub }: { sub: FreeReadSub }) {
  const [status, setStatus] = useState(sub.status);
  const [pending, startTransition] = useTransition();
  const coverSrc = sub.hasCoverImage
    ? `/api/free-read-cover/${sub.id}`
    : sub.coverBgIndex
    ? `/cover-backgrounds/cover-bg-${sub.coverBgIndex}.jpg`
    : null;

  const submitted = new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ ...cardStyle, opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} alt="" style={{ width: "48px", height: "72px", objectFit: "cover", borderRadius: "2px", border: "1px solid var(--color-border)", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)" }}>
              {sub.title}
            </p>
            <StatusBadge status={status} />
          </div>
          <p style={metaText}>
            {sub.work.title} · {sub.submissionType === "full" ? "Full work" : "Selected chapters"} · {sub.contentRating} · submitted {submitted}
          </p>

          {status === "rejected" && sub.rejectionNote && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontStyle: "italic", color: "#d4848e", marginTop: "0.4rem" }}>
              Feedback from WriteWright: {sub.rejectionNote}
            </p>
          )}

          {status === "pending" && !sub.hasPendingEdit && (
            <p style={{ ...metaText, marginTop: "0.3rem", fontStyle: "italic" }}>
              Under review — you'll hear back soon.
            </p>
          )}

          {sub.hasPendingEdit && <EditPendingNote />}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <Link
          href={`/admin/works/${sub.work.id}`}
          style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem",
            color: "var(--color-ink-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "3px", padding: "0.25rem 0.75rem",
            textDecoration: "none",
          }}
        >
          {status === "rejected" ? "Edit & Resubmit" : "Edit"}
        </Link>
        {status === "approved" && (
          <>
            <a
              href="/free-read"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.8rem",
                color: "#8bc98d",
                border: "1px solid rgba(76,139,64,0.35)",
                borderRadius: "3px", padding: "0.25rem 0.75rem",
                textDecoration: "none",
              }}
            >
              View live ↗
            </a>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Remove this story from the public Start Reading section?")) return;
                startTransition(async () => {
                  await unpublishFreeRead(sub.work.id);
                  setStatus("rejected");
                });
              }}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.8rem",
                color: "#d4848e",
                border: "1px solid var(--color-crimson-dim)",
                borderRadius: "3px", padding: "0.25rem 0.75rem",
                background: "transparent", cursor: pending ? "default" : "pointer",
              }}
            >
              Unpublish
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Discover Books Row ────────────────────────────────────────────────────────

function DiscoverBooksRow({ sub }: { sub: DiscoverBooksSub }) {
  const [status, setStatus] = useState(sub.status);
  const [pending, startTransition] = useTransition();
  const coverSrc = sub.hasCoverImage
    ? `/api/discover-books-cover/${sub.id}`
    : sub.coverBgIndex
    ? `/cover-backgrounds/cover-bg-${sub.coverBgIndex}.jpg`
    : null;

  const submitted = new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ ...cardStyle, opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} alt="" style={{ width: "48px", height: "72px", objectFit: "cover", borderRadius: "2px", border: "1px solid var(--color-border)", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-ink)" }}>
              {sub.bookTitle}
            </p>
            <StatusBadge status={status} />
          </div>
          <p style={metaText}>
            by {sub.authorName} · {sub.contentRating} · submitted {submitted}
          </p>

          {status === "rejected" && sub.rejectionNote && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontStyle: "italic", color: "#d4848e", marginTop: "0.4rem" }}>
              Feedback from WriteWright: {sub.rejectionNote}
            </p>
          )}

          {status === "pending" && !sub.hasPendingEdit && (
            <p style={{ ...metaText, marginTop: "0.3rem", fontStyle: "italic" }}>
              Under review — you'll hear back soon.
            </p>
          )}

          {sub.hasPendingEdit && <EditPendingNote />}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <Link
          href={`/admin/works/${sub.work.id}`}
          style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem",
            color: "var(--color-ink-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "3px", padding: "0.25rem 0.75rem",
            textDecoration: "none",
          }}
        >
          {status === "rejected" ? "Edit & Resubmit" : "Edit"}
        </Link>
        {status === "approved" && (
          <>
            <a
              href="/books"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.8rem",
                color: "#8bc98d",
                border: "1px solid rgba(76,139,64,0.35)",
                borderRadius: "3px", padding: "0.25rem 0.75rem",
                textDecoration: "none",
              }}
            >
              View live ↗
            </a>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Remove this book from the public Discover Books section?")) return;
                startTransition(async () => {
                  await unpublishDiscoverBooks(sub.work.id);
                  setStatus("rejected");
                });
              }}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.8rem",
                color: "#d4848e",
                border: "1px solid var(--color-crimson-dim)",
                borderRadius: "3px", padding: "0.25rem 0.75rem",
                background: "transparent", cursor: pending ? "default" : "pointer",
              }}
            >
              Unpublish
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function MyPublicationsClient({
  freeReadSubs,
  discoverBooksSubs,
}: {
  freeReadSubs: FreeReadSub[];
  discoverBooksSubs: DiscoverBooksSub[];
}) {
  const sectionHead: React.CSSProperties = {
    fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 400,
    color: "var(--color-ink)", marginBottom: "0.3rem",
  };
  const sectionSub: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)",
    fontStyle: "italic", marginBottom: "1.5rem",
  };
  const emptyMsg: React.CSSProperties = {
    fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", padding: "0.5rem 0",
  };

  if (freeReadSubs.length === 0 && discoverBooksSubs.length === 0) {
    return (
      <div>
        <p style={{ ...emptyMsg, fontSize: "1rem", textAlign: "center", marginTop: "2rem" }}>
          You haven't submitted any work to the public sections yet.{" "}
          <Link href="/admin/works" style={{ color: "var(--color-gold)", textDecoration: "none" }}>
            Go to Writing
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Start Reading section */}
      <div style={{ marginBottom: "3.5rem" }}>
        <h3 style={sectionHead}>Start Reading</h3>
        <p style={sectionSub}>Stories and chapters you've submitted to the public Start Reading section.</p>
        {freeReadSubs.length === 0 ? (
          <p style={emptyMsg}>No submissions yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {freeReadSubs.map((s) => <FreeReadRow key={s.id} sub={s} />)}
          </div>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--color-border-light)", marginBottom: "3.5rem" }} />

      {/* Discover Books section */}
      <div>
        <h3 style={sectionHead}>Discover Books</h3>
        <p style={sectionSub}>Book listings you've submitted to the public Discover Books section.</p>
        {discoverBooksSubs.length === 0 ? (
          <p style={emptyMsg}>No submissions yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {discoverBooksSubs.map((s) => <DiscoverBooksRow key={s.id} sub={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
