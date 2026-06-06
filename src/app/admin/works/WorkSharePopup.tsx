"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createWorkShare, revokeWorkShare } from "@/app/actions/work-shares";

type User = { id: string; username: string };
type Share = { userId: string; username: string };

export default function WorkSharePopup({
  workId,
  workTitle,
  otherUsers,
  initialShares,
}: {
  workId: string;
  workTitle: string;
  otherUsers: User[];
  initialShares: Share[];
}) {
  const [shares, setShares] = useState(initialShares);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const unsharedUsers = otherUsers.filter((u) => !shares.some((s) => s.userId === u.id));

  function handleShare() {
    if (!selectedUserId) return;
    setError("");
    start(async () => {
      const r = await createWorkShare(workId, selectedUserId);
      if (r.error) { setError(r.error); return; }
      const user = otherUsers.find((u) => u.id === selectedUserId);
      if (user) {
        setShares((prev) => [...prev, { userId: user.id, username: user.username }]);
      }
      setSelectedUserId("");
    });
  }

  function handleRevoke(userId: string, username: string) {
    if (!window.confirm(`Remove ${username}'s access to this story?`)) return;
    setError("");
    start(async () => {
      const r = await revokeWorkShare(workId, userId);
      if (r.error) setError(r.error);
      else setShares((prev) => prev.filter((s) => s.userId !== userId));
    });
  }

  const inp: React.CSSProperties = {
    background: "var(--color-bg-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "3px",
    padding: "0.4rem 0.6rem",
    color: "var(--color-ink)",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    outline: "none",
    cursor: "pointer",
  };

  const btnSm: React.CSSProperties = {
    background: "transparent",
    border: "1px solid var(--color-border)",
    borderRadius: "3px",
    padding: "0.3rem 0.65rem",
    color: "var(--color-ink-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    cursor: "pointer",
  };

  return (
    /* Full-screen overlay — dimmed background */
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "6px",
          padding: "2rem",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "85vh",
          overflowY: "auto",
          opacity: pending ? 0.8 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 400, color: "var(--color-ink)", marginBottom: "0.2rem" }}>
              Share Story
            </h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              {workTitle}
            </p>
          </div>
          <Link
            href="/admin/works"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              color: "var(--color-ink-faint)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              padding: "0.25rem 0",
            }}
          >
            ✕ Close
          </Link>
        </div>

        {/* Warning */}
        <div
          style={{
            background: "rgba(139,38,53,0.1)",
            border: "1px solid var(--color-crimson-dim)",
            borderRadius: "4px",
            padding: "0.85rem 1rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-muted)", lineHeight: 1.6, margin: 0 }}>
            Sharing a story will allow another user to <strong style={{ fontStyle: "normal" }}>read and comment</strong> on your work only.
            They will not be able to make any changes or see anything but the story you share.
          </p>
        </div>

        {/* Current shares */}
        {shares.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.5rem" }}>
              Currently shared with
            </p>
            {shares.map((s) => (
              <div
                key={s.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.45rem 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--color-ink)", flex: 1 }}>
                  {s.username}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                  Read only
                </span>
                <button
                  type="button"
                  onClick={() => handleRevoke(s.userId, s.username)}
                  disabled={pending}
                  style={{ ...btnSm, color: "#d4848e", borderColor: "var(--color-crimson-dim)" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add user */}
        {unsharedUsers.length > 0 ? (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.5rem" }}>
              Share with
            </p>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={pending}
                style={{ ...inp, minWidth: "150px" }}
              >
                <option value="">Select user…</option>
                {unsharedUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleShare}
                disabled={pending || !selectedUserId}
                style={{
                  ...btnSm,
                  color: selectedUserId ? "var(--color-gold)" : "var(--color-ink-faint)",
                  borderColor: selectedUserId ? "var(--color-gold-dim)" : "var(--color-border)",
                  opacity: !selectedUserId ? 0.5 : 1,
                }}
              >
                {pending ? "…" : "Share"}
              </button>
            </div>
          </div>
        ) : shares.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
            No other users to share with.
          </p>
        ) : null}

        {error && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#d4848e", marginTop: "0.75rem" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
