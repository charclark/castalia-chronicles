"use client";

import { useActionState } from "react";
import { forceChangePassword } from "@/app/actions/auth";

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

export default function ForceChangePasswordPage() {
  const [state, action, pending] = useActionState(forceChangePassword, null);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 400,
              color: "var(--color-ink)",
              marginBottom: "0.5rem",
            }}
          >
            Set Your Password
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              color: "var(--color-ink-faint)",
              fontStyle: "italic",
            }}
          >
            Choose a new password before you continue.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            padding: "2rem",
          }}
        >
          {/* Gold divider accent */}
          <div
            style={{
              textAlign: "center",
              color: "var(--color-gold)",
              fontSize: "1rem",
              marginBottom: "1.75rem",
              opacity: 0.7,
            }}
          >
            ✦
          </div>

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

          <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label htmlFor="newPassword" style={labelStyle}>New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                style={inputStyle}
              />
            </div>

            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.78rem",
                color: "var(--color-ink-faint)",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              8+ characters, one uppercase letter, one number, one special character.
            </p>

            <button
              type="submit"
              disabled={pending}
              style={{
                marginTop: "0.25rem",
                background: pending ? "var(--color-border)" : "var(--color-crimson)",
                border: "none",
                borderRadius: "3px",
                padding: "0.75rem 1.4rem",
                color: "var(--color-ink)",
                fontFamily: "var(--font-heading)",
                fontSize: "1rem",
                letterSpacing: "0.08em",
                cursor: pending ? "default" : "pointer",
                transition: "background 0.2s",
                width: "100%",
              }}
            >
              {pending ? "Saving…" : "Set Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
