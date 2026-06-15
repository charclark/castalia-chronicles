"use client";

import { useState, useTransition } from "react";
import {
  markFeedbackRead,
  deleteFeedbackMessage,
  shareFeedback,
  unshareFeedback,
} from "@/app/actions/inbox";

type Share = { userId: string; username: string };
type User = { id: string; username: string };

type Message = {
  id: string;
  name: string;
  email: string | null;
  message: string;
  read: boolean;
  createdAt: Date;
  shares: Share[];
};

export default function FeedbackInbox({
  isSuperAdmin,
  messages,
  otherUsers,
}: {
  isSuperAdmin: boolean;
  messages: Message[];
  otherUsers: User[];
}) {
  const unreadCount = messages.filter((m) => !m.read).length;

  if (messages.length === 0) {
    return (
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          padding: "2rem 0",
        }}
      >
        {isSuperAdmin ? "No messages yet." : "No feedback has been shared with you yet."}
      </p>
    );
  }

  return (
    <div>
      {isSuperAdmin && unreadCount > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(201,168,76,0.1)",
            border: "1px solid var(--color-gold-dim)",
            borderRadius: "3px",
            padding: "0.4rem 0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--color-gold)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              color: "var(--color-gold)",
              letterSpacing: "0.04em",
            }}
          >
            {unreadCount} unread
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {messages.map((msg) => (
          <MessageCard
            key={msg.id}
            msg={msg}
            isSuperAdmin={isSuperAdmin}
            otherUsers={otherUsers}
          />
        ))}
      </div>
    </div>
  );
}

function MessageCard({
  msg,
  isSuperAdmin,
  otherUsers,
}: {
  msg: Message;
  isSuperAdmin: boolean;
  otherUsers: User[];
}) {
  const [pending, startTransition] = useTransition();
  const [shares, setShares] = useState<Share[]>(msg.shares);
  const [showShare, setShowShare] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [shareError, setShareError] = useState("");

  function handleToggleRead() {
    startTransition(() => markFeedbackRead(msg.id, !msg.read));
  }

  function handleDelete() {
    if (!confirm(`Delete this message from ${msg.name}? This cannot be undone.`)) return;
    startTransition(() => deleteFeedbackMessage(msg.id));
  }

  function handleShare() {
    if (!selectedUserId) return;
    setShareError("");
    startTransition(async () => {
      const r = await shareFeedback(msg.id, selectedUserId);
      if (r.error) { setShareError(r.error); return; }
      const user = otherUsers.find((u) => u.id === selectedUserId);
      if (user) setShares((prev) => [...prev, { userId: user.id, username: user.username }]);
      setSelectedUserId("");
    });
  }

  function handleUnshare(userId: string, username: string) {
    if (!confirm(`Stop sharing this message with ${username}?`)) return;
    setShareError("");
    startTransition(async () => {
      const r = await unshareFeedback(msg.id, userId);
      if (r.error) { setShareError(r.error); return; }
      setShares((prev) => prev.filter((s) => s.userId !== userId));
    });
  }

  const date = msg.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const unsharedUsers = otherUsers.filter((u) => !shares.some((s) => s.userId === u.id));

  const inp: React.CSSProperties = {
    background: "var(--color-bg-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "3px",
    padding: "0.3rem 0.55rem",
    color: "var(--color-ink)",
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    outline: "none",
  };

  return (
    <div
      style={{
        background: "var(--color-bg-elevated)",
        border: `1px solid ${msg.read || !isSuperAdmin ? "var(--color-border)" : "var(--color-gold-dim)"}`,
        borderLeft: `3px solid ${msg.read || !isSuperAdmin ? "var(--color-border)" : "var(--color-gold)"}`,
        borderRadius: "4px",
        padding: "1.25rem 1.5rem",
        opacity: pending ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "0.85rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          {isSuperAdmin && !msg.read && (
            <span
              style={{
                display: "inline-block",
                fontFamily: "var(--font-body)",
                fontSize: "0.62rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--color-gold)",
                background: "rgba(201,168,76,0.12)",
                border: "1px solid var(--color-gold-dim)",
                borderRadius: "2px",
                padding: "0.1rem 0.4rem",
                marginBottom: "0.4rem",
              }}
            >
              New
            </span>
          )}
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              color: "var(--color-ink)",
              marginBottom: "0.2rem",
            }}
          >
            {msg.name}
          </p>
          {msg.email && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                color: "var(--color-ink-muted)",
              }}
            >
              {msg.email}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-ink-faint)",
              whiteSpace: "nowrap",
            }}
          >
            {date}
          </span>
          {isSuperAdmin && (
            <>
              <button
                onClick={() => { setShowShare((v) => !v); setShareError(""); }}
                disabled={pending}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                  color: shares.length > 0 ? "var(--color-gold)" : "var(--color-ink-muted)",
                  background: "transparent",
                  border: `1px solid ${shares.length > 0 ? "var(--color-gold-dim)" : "var(--color-border)"}`,
                  borderRadius: "3px",
                  padding: "0.2rem 0.6rem",
                  cursor: pending ? "default" : "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                Share{shares.length > 0 ? ` (${shares.length})` : ""}
              </button>
              <button
                onClick={handleToggleRead}
                disabled={pending}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                  color: "var(--color-ink-muted)",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: "3px",
                  padding: "0.2rem 0.6rem",
                  cursor: pending ? "default" : "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {msg.read ? "Mark unread" : "Mark handled"}
              </button>
              <button
                onClick={handleDelete}
                disabled={pending}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                  color: "var(--color-ink-faint)",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: "3px",
                  padding: "0.2rem 0.6rem",
                  cursor: pending ? "default" : "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Message body */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          color: "var(--color-ink-muted)",
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.message}
      </p>

      {/* Share panel (superadmin only) */}
      {isSuperAdmin && showShare && (
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-muted)", marginBottom: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Share with
          </p>

          {shares.length > 0 && (
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {shares.map((s) => (
                <span key={s.userId} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "rgba(201,168,76,0.08)", border: "1px solid var(--color-gold-dim)", borderRadius: "2px", padding: "0.15rem 0.5rem 0.15rem 0.65rem", fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-gold)" }}>
                  {s.username}
                  <button
                    onClick={() => handleUnshare(s.userId, s.username)}
                    disabled={pending}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-gold)", fontSize: "0.85rem", lineHeight: 1, padding: 0, opacity: 0.7 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {unsharedUsers.length > 0 ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ ...inp, flex: 1, maxWidth: "200px" }}
              >
                <option value="">Choose a user…</option>
                {unsharedUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
              <button
                onClick={handleShare}
                disabled={!selectedUserId || pending}
                style={{
                  fontFamily: "var(--font-body)", fontSize: "0.82rem",
                  color: !selectedUserId ? "var(--color-ink-faint)" : "var(--color-gold)",
                  background: "transparent",
                  border: `1px solid ${!selectedUserId ? "var(--color-border)" : "var(--color-gold-dim)"}`,
                  borderRadius: "3px", padding: "0.3rem 0.75rem",
                  cursor: !selectedUserId || pending ? "default" : "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                Share
              </button>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
              {otherUsers.length === 0 ? "No other users to share with." : "Shared with all users."}
            </p>
          )}

          {shareError && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#d4848e", marginTop: "0.4rem" }}>
              {shareError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
