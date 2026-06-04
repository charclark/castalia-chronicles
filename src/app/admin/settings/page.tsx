"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/auth";

export default function SettingsPage() {
  const [state, action, pending] = useActionState(changePassword, null);

  return (
    <div style={{ maxWidth: "520px" }}>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
          fontWeight: 400,
          color: "var(--color-ink)",
          marginBottom: "0.4rem",
        }}
      >
        Account Settings
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--color-ink-faint)",
          marginBottom: "2.5rem",
          fontStyle: "italic",
        }}
      >
        Change your password below.
      </p>

      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          padding: "2rem",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.3rem",
            fontWeight: 400,
            color: "var(--color-gold)",
            marginBottom: "1.5rem",
            letterSpacing: "0.04em",
          }}
        >
          Change Password
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
          {[
            { id: "currentPassword", label: "Current Password", autoComplete: "current-password" },
            { id: "newPassword", label: "New Password", autoComplete: "new-password" },
            { id: "confirmPassword", label: "Confirm New Password", autoComplete: "new-password" },
          ].map(({ id, label, autoComplete }) => (
            <div key={id} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label
                htmlFor={id}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-muted)",
                }}
              >
                {label}
              </label>
              <input
                id={id}
                name={id}
                type="password"
                autoComplete={autoComplete}
                required
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "3px",
                  padding: "0.65rem 0.85rem",
                  color: "var(--color-ink)",
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  outline: "none",
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: "0.5rem",
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
            {pending ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
