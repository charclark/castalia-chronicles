"use client";

import { useActionState } from "react";
import { addMailingListEntry } from "@/app/actions/inbox";

const inp: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.55rem 0.8rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  outline: "none",
  flex: 1,
  minWidth: "120px",
};

export default function AddSubscriberForm() {
  const [state, action, pending] = useActionState(addMailingListEntry, null);

  return (
    <div
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        padding: "1.25rem 1.5rem",
        marginTop: "1.5rem",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.1rem",
          fontWeight: 400,
          color: "var(--color-gold)",
          marginBottom: "1rem",
          letterSpacing: "0.04em",
        }}
      >
        Add Subscriber Manually
      </h3>

      {state?.error && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#d4848e", marginBottom: "0.75rem" }}>
          {state.error}
        </p>
      )}
      {state?.success && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#8bc98d", marginBottom: "0.75rem" }}>
          {state.success}
        </p>
      )}

      <form
        action={action}
        style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}
      >
        <input
          name="name"
          type="text"
          placeholder="Name (optional)"
          autoComplete="off"
          style={inp}
        />
        <input
          name="email"
          type="email"
          placeholder="Email address"
          required
          autoComplete="off"
          style={inp}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            background: pending ? "var(--color-border)" : "var(--color-crimson)",
            border: "none",
            borderRadius: "3px",
            padding: "0.55rem 1.1rem",
            color: "var(--color-ink)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.95rem",
            letterSpacing: "0.06em",
            cursor: pending ? "default" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {pending ? "Adding…" : "Add to List"}
        </button>
      </form>
    </div>
  );
}
