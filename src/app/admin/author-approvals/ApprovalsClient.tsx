"use client";

import { useState, useTransition } from "react";
import { approveAuthorProfile, rejectAuthorProfile } from "@/app/actions/author-profiles";

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

function ProfileCard({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState(profile.status);
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      await approveAuthorProfile(profile.id);
      setStatus("approved");
    });
  }
  function handleReject() {
    if (!window.confirm(`Reject ${profile.user.username}'s author profile?`)) return;
    startTransition(async () => {
      await rejectAuthorProfile(profile.id);
      setStatus("rejected");
    });
  }

  const submitted = new Date(profile.submittedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div style={{
      background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
      borderRadius: "4px", padding: "1.25rem 1.5rem", opacity: pending ? 0.6 : 1,
      transition: "opacity 0.15s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {profile.hasPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/author-photo/${profile.user.id}`}
              alt=""
              style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border)", flexShrink: 0 }}
            />
          )}
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-ink)", marginBottom: "0.15rem" }}>
              {profile.headline || <em style={{ color: "var(--color-ink-faint)" }}>No headline</em>}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)" }}>
              @{profile.user.username} · submitted {submitted}
            </p>
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
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--color-ink-muted)",
          lineHeight: 1.6, marginBottom: "1rem",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {profile.bodyText}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button onClick={handleApprove} disabled={pending || status === "approved"} style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem",
          color: status === "approved" ? "var(--color-ink-faint)" : "#8bc98d",
          background: "transparent",
          border: `1px solid ${status === "approved" ? "var(--color-border)" : "rgba(76,139,64,0.35)"}`,
          borderRadius: "3px", padding: "0.3rem 0.85rem",
          cursor: pending || status === "approved" ? "default" : "pointer",
          transition: "color 0.15s, border-color 0.15s",
        }}>
          {status === "approved" ? "Approved ✓" : "Approve"}
        </button>
        <button onClick={handleReject} disabled={pending || status === "rejected"} style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem",
          color: status === "rejected" ? "var(--color-ink-faint)" : "#d4848e",
          background: "transparent",
          border: `1px solid ${status === "rejected" ? "var(--color-border)" : "var(--color-crimson-dim)"}`,
          borderRadius: "3px", padding: "0.3rem 0.85rem",
          cursor: pending || status === "rejected" ? "default" : "pointer",
          transition: "color 0.15s, border-color 0.15s",
        }}>
          {status === "rejected" ? "Rejected" : "Reject"}
        </button>
      </div>
    </div>
  );
}

export default function ApprovalsClient({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", padding: "2rem 0" }}>
        No author profiles submitted yet.
      </p>
    );
  }

  const pending  = profiles.filter((p) => p.status === "pending");
  const rest     = profiles.filter((p) => p.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {pending.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.75rem" }}>
            Pending ({pending.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {pending.map((p) => <ProfileCard key={p.id} profile={p} />)}
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
            {rest.map((p) => <ProfileCard key={p.id} profile={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
