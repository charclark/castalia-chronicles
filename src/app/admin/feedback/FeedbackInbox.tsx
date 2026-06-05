"use client";

import { useTransition } from "react";
import { markFeedbackRead, deleteFeedbackMessage } from "@/app/actions/inbox";

type Message = {
  id: string;
  name: string;
  email: string | null;
  message: string;
  read: boolean;
  createdAt: Date;
};

export default function FeedbackInbox({ messages }: { messages: Message[] }) {
  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div>
      {/* Unread count */}
      {unreadCount > 0 && (
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

      {messages.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--color-ink-faint)",
            fontStyle: "italic",
            padding: "2rem 0",
          }}
        >
          No messages yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {messages.map((msg) => (
            <MessageCard key={msg.id} msg={msg} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageCard({ msg }: { msg: Message }) {
  const [pending, startTransition] = useTransition();

  function handleToggleRead() {
    startTransition(() => markFeedbackRead(msg.id, !msg.read));
  }

  function handleDelete() {
    if (!confirm(`Delete this message from ${msg.name}? This cannot be undone.`)) return;
    startTransition(() => deleteFeedbackMessage(msg.id));
  }

  const date = msg.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        background: "var(--color-bg-elevated)",
        border: `1px solid ${msg.read ? "var(--color-border)" : "var(--color-gold-dim)"}`,
        borderLeft: `3px solid ${msg.read ? "var(--color-border)" : "var(--color-gold)"}`,
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
          {!msg.read && (
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
    </div>
  );
}
