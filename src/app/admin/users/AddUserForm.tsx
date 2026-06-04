"use client";

import { useActionState } from "react";
import { createUser } from "@/app/actions/auth";

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "3px",
  padding: "0.65rem 0.85rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.82rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "var(--color-ink-muted)",
};

export default function AddUserForm() {
  const [state, action, pending] = useActionState(createUser, null);

  return (
    <div
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        padding: "1.75rem",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.2rem",
          fontWeight: 400,
          color: "var(--color-gold)",
          marginBottom: "1.25rem",
          letterSpacing: "0.04em",
        }}
      >
        Add New User
      </h3>

      {state?.error && (
        <div
          role="alert"
          style={{
            background: "rgba(139,38,53,0.15)",
            border: "1px solid var(--color-crimson-dim)",
            borderRadius: "3px",
            padding: "0.75rem 1rem",
            color: "#d4848e",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            marginBottom: "1.25rem",
          }}
        >
          {state.error}
        </div>
      )}

      {state?.success && (
        <div
          role="status"
          style={{
            background: "rgba(76,139,64,0.12)",
            border: "1px solid rgba(76,139,64,0.35)",
            borderRadius: "3px",
            padding: "0.75rem 1rem",
            color: "#8bc98d",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            marginBottom: "1.25rem",
          }}
        >
          {state.success}
        </div>
      )}

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label htmlFor="username" style={labelStyle}>Username</label>
          <input id="username" name="username" type="text" autoComplete="off" required style={inputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required style={inputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required style={inputStyle} />
        </div>

        <button
          type="submit"
          disabled={pending}
          style={{
            alignSelf: "flex-start",
            background: pending ? "var(--color-border)" : "var(--color-crimson)",
            border: "none",
            borderRadius: "3px",
            padding: "0.7rem 1.4rem",
            color: "var(--color-ink)",
            fontFamily: "var(--font-heading)",
            fontSize: "1rem",
            letterSpacing: "0.08em",
            cursor: pending ? "default" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {pending ? "Creating…" : "Create User"}
        </button>
      </form>
    </div>
  );
}
